'use server';

import { createClient } from '@/lib/supabase/server';
import { requireCompanyAdmin } from '@/lib/auth/helpers';
import { createOrderSchema, refundOrderSchema } from '@/lib/validations/schemas';
import { revalidatePath } from 'next/cache';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const MYT_TIMEZONE = 'Asia/Kuala_Lumpur';

export async function createOrder(formData: FormData) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            throw new Error('User must be assigned to a company');
        }

        const itemsJson = formData.get('items') as string;
        const paymentType = formData.get('payment_type') as string;

        if (!itemsJson || !paymentType) {
            throw new Error('Missing required fields: items or payment_type');
        }

        let items;
        try {
            items = JSON.parse(itemsJson);
        } catch (parseError) {
            throw new Error('Invalid items JSON format');
        }

        const rawData = {
            items,
            payment_type: paymentType,
        };

        // Validate input
        const validated = createOrderSchema.parse(rawData);

        const supabase = await createClient();

        // Fetch items to get current prices and names for snapshot
        const itemIds = validated.items.map((item) => item.item_id);
        const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select('id, name, price')
            .eq('company_id', user.company_id)
            .in('id', itemIds);

        if (itemsError || !itemsData) {
            throw new Error('Failed to fetch items');
        }

        // Create item map for quick lookup
        const itemsMap = new Map((itemsData as any[]).map((item: any) => [item.id, item]));

        // Calculate total and prepare order items
        let totalAmount = 0;
        const orderItems = [];

        for (const cartItem of validated.items) {
            const item = itemsMap.get(cartItem.item_id);
            if (!item) {
                throw new Error(`Item ${cartItem.item_id} not found`);
            }

            const itemTotal = item.price * cartItem.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                item_id: item.id,
                item_name_snapshot: item.name,
                item_price_snapshot: item.price,
                quantity: cartItem.quantity,
            });
        }

        // Create order
        const { data: order, error: orderError } = await (supabase
            .from('orders') as any)
            .insert({
                company_id: user.company_id,
                total_amount: totalAmount,
                payment_type: validated.payment_type,
                status: 'paid',
                created_by: user.id,
            })
            .select()
            .single();

        if (orderError || !order) {
            throw new Error('Failed to create order');
        }

        // Create order items
        const { error: orderItemsError } = await (supabase
            .from('order_items') as any)
            .insert(
                orderItems.map((item) => ({
                    order_id: (order as any).id,
                    ...item,
                }))
            );

        if (orderItemsError) {
            // Rollback: delete order if order items creation fails
            await supabase.from('orders').delete().eq('id', order.id);
            throw new Error('Failed to create order items');
        }

        revalidatePath('/pos');
        return { success: true, data: order };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function refundOrder(formData: FormData) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            throw new Error('User must be assigned to a company');
        }

        const rawData = {
            order_id: formData.get('order_id') as string,
        };

        const validated = refundOrderSchema.parse(rawData);

        const supabase = await createClient();

        // Check if order exists and belongs to user's company
        const { data: order, error: orderError } = await (supabase
            .from('orders') as any)
            .select('*')
            .eq('id', validated.order_id)
            .eq('company_id', user.company_id)
            .single();

        if (orderError || !order) {
            throw new Error('Order not found');
        }

        if ((order as any).status === 'refunded') {
            throw new Error('Order is already refunded');
        }

        // Update order status
        const { error: updateError } = await (supabase
            .from('orders') as any)
            .update({
                status: 'refunded',
                refunded_at: new Date().toISOString(),
                refunded_by: user.id,
            })
            .eq('id', validated.order_id);

        if (updateError) {
            throw new Error('Failed to refund order');
        }

        revalidatePath('/reports');
        revalidatePath('/orders');
        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function getOrders() {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            throw new Error('User must be assigned to a company');
        }

        const supabase = await createClient();

        // Get today's date range in MYT timezone
        // Get current time and convert to MYT to get today's date
        const now = new Date();
        const mytNow = toZonedTime(now, MYT_TIMEZONE);

        // Create start of today in MYT (00:00:00)
        const startOfTodayMYT = new Date(
            mytNow.getFullYear(),
            mytNow.getMonth(),
            mytNow.getDate(),
            0, 0, 0, 0
        );
        // Convert MYT time to UTC for database query
        const startOfTodayUTC = fromZonedTime(startOfTodayMYT, MYT_TIMEZONE);

        // Create end of today in MYT (23:59:59.999)
        const endOfTodayMYT = new Date(
            mytNow.getFullYear(),
            mytNow.getMonth(),
            mytNow.getDate(),
            23, 59, 59, 999
        );
        // Convert MYT time to UTC for database query
        const endOfTodayUTC = fromZonedTime(endOfTodayMYT, MYT_TIMEZONE);

        // Fetch orders with order items for today only
        const { data: orders, error: ordersError } = await (supabase
            .from('orders') as any)
            .select(
                `
        *,
        order_items (*)
      `
            )
            .eq('company_id', user.company_id)
            .gte('created_at', startOfTodayUTC.toISOString())
            .lte('created_at', endOfTodayUTC.toISOString())
            .order('created_at', { ascending: false });

        if (ordersError) {
            throw new Error('Failed to fetch orders');
        }

        return {
            success: true,
            data: orders || [],
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}
