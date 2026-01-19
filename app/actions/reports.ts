'use server';

import { createClient } from '@/lib/supabase/server';
import { requireCompanyAdmin } from '@/lib/auth/helpers';
import { reportDateRangeSchema } from '@/lib/validations/schemas';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const MYT_TIMEZONE = 'Asia/Kuala_Lumpur';

export async function getReportData(startDate: string, endDate: string) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            return { success: false, error: 'User must be assigned to a company' };
        }

        // Validate input - accept ISO datetime strings
        // Add Z to make it a valid ISO datetime for validation
        const startDateISO = startDate.endsWith('Z') ? startDate : `${startDate}Z`;
        const endDateISO = endDate.endsWith('Z') ? endDate : `${endDate}Z`;

        const validated = reportDateRangeSchema.safeParse({
            start_date: startDateISO,
            end_date: endDateISO,
        });

        if (!validated.success) {
            return {
                success: false,
                error: `Invalid date format: ${validated.error.errors.map(e => e.message).join(', ')}`,
            };
        }

        const supabase = await createClient();

        // Parse dates - treat the input as MYT timezone and convert to UTC
        // Remove Z if present, then parse as MYT
        const startDateStr = startDate.endsWith('Z') ? startDate.slice(0, -1) : startDate;
        const endDateStr = endDate.endsWith('Z') ? endDate.slice(0, -1) : endDate;

        // Parse date string components (format: YYYY-MM-DDTHH:mm:ss)
        // Create Date from components to represent wall-clock time, then convert from MYT to UTC
        const parseMYTDate = (dateStr: string): Date => {
            const [datePart, timePart = '00:00:00'] = dateStr.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const timeParts = timePart.split(':');
            const hour = parseInt(timeParts[0] || '0', 10);
            const minute = parseInt(timeParts[1] || '0', 10);
            const second = parseInt(timeParts[2] || '0', 10);

            // Create Date object using components (this represents wall-clock time)
            // fromZonedTime will interpret these components as MYT and convert to UTC
            const wallClockDate = new Date(year, month - 1, day, hour, minute, second);

            // Convert from MYT timezone to UTC
            return fromZonedTime(wallClockDate, MYT_TIMEZONE);
        };

        const startUTC = parseMYTDate(startDateStr);
        let endUTC = parseMYTDate(endDateStr);

        // Ensure end date includes the full day
        if (!endDateStr.includes('23:59:59')) {
            const [datePart] = endDateStr.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const endOfDayDate = new Date(year, month - 1, day, 23, 59, 59);
            endUTC = fromZonedTime(endOfDayDate, MYT_TIMEZONE);
            endUTC.setMilliseconds(999);
        }

        // Fetch orders with order items
        const { data: ordersData, error: ordersError } = await (supabase
            .from('orders') as any)
            .select(
                `
        *,
        order_items (*)
      `
            )
            .eq('company_id', user.company_id)
            .gte('created_at', startUTC.toISOString())
            .lte('created_at', endUTC.toISOString())
            .order('created_at', { ascending: false });

        if (ordersError) {
            throw new Error('Failed to fetch report data');
        }

        const orders = ordersData as any;

        // Calculate totals (exclude refunded orders)
        const paidOrders = (orders as any)?.filter((o: any) => o.status === 'paid') || [];
        const totalRevenue = paidOrders.reduce(
            (sum: number, order: any) => sum + Number(order.total_amount),
            0
        );
        const totalOrders = paidOrders.length;
        const cashCount = paidOrders.filter((o: any) => o.payment_type === 'cash').length;
        const touchNGoCount = paidOrders.filter((o: any) => o.payment_type === 'touch_n_go').length;

        return {
            success: true,
            data: {
                orders: paidOrders,
                totalRevenue,
                totalOrders,
                cashCount,
                touchNGoCount,
            },
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function exportReportToCSV(startDate: string, endDate: string) {
    try {
        const result = await getReportData(startDate, endDate);
        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch data');
        }

        const { orders } = result.data;

        // Build CSV
        const headers = [
            'Date',
            'Time',
            'Item Name',
            'Quantity',
            'Unit Price',
            'Item Total',
            'Payment Type',
            'Order Total',
        ];

        const rows: string[][] = [];
        let totalSum = 0;

        orders?.forEach((order: any) => {
            const zonedDate = toZonedTime(new Date(order.created_at), MYT_TIMEZONE);
            const dateStr = zonedDate.toLocaleDateString('en-MY');
            const timeStr = zonedDate.toLocaleTimeString('en-MY');
            totalSum += Number(order.total_amount);

            if (order.order_items && order.order_items.length > 0) {
                order.order_items.forEach((item: any, index: number) => {
                    const price = Number(item.item_price_snapshot) || 0;
                    const quantity = Number(item.quantity) || 0;
                    const itemTotal = price * quantity;
                    rows.push([
                        index === 0 ? dateStr : '',
                        index === 0 ? timeStr : '',
                        item.item_name_snapshot || '',
                        quantity.toString(),
                        price.toFixed(2),
                        itemTotal.toFixed(2),
                        index === 0 ? order.payment_type : '',
                        index === 0 ? Number(order.total_amount).toFixed(2) : '',
                    ]);
                });
            } else {
                // Order with no items
                rows.push([
                    dateStr,
                    timeStr,
                    '',
                    '',
                    '',
                    '',
                    order.payment_type,
                    Number(order.total_amount).toFixed(2),
                ]);
            }
        });

        // Add total row
        rows.push([
            '',
            '',
            '',
            '',
            '',
            '',
            'TOTAL',
            totalSum.toFixed(2),
        ]);

        // Convert to CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        return {
            success: true,
            data: csvContent,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}
