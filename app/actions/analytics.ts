'use server';

import { createClient } from '@/lib/supabase/server';
import { requireCompanyAdmin } from '@/lib/auth/helpers';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

const MYT_TIMEZONE = 'Asia/Kuala_Lumpur';

export async function getDashboardMetrics() {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            return { success: false, error: 'User must be assigned to a company' };
        }

        const supabase = await createClient();
        const now = new Date();
        const zonedNow = toZonedTime(now, MYT_TIMEZONE);
        const startOfToday = new Date(zonedNow);
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTodayUTC = fromZonedTime(startOfToday, MYT_TIMEZONE);

        // Today's revenue (exclude refunded)
        const { data: todayOrders } = await (supabase
            .from('orders') as any)
            .select('total_amount, payment_type')
            .eq('company_id', user.company_id)
            .eq('status', 'paid')
            .gte('created_at', startOfTodayUTC.toISOString());

        const todayRevenue = (todayOrders as any)?.reduce((sum: number, order: any) => sum + Number(order.total_amount), 0) || 0;
        const ordersToday = (todayOrders as any)?.length || 0;
        const cashCount = (todayOrders as any)?.filter((o: any) => o.payment_type === 'cash').length || 0;
        const touchNGoCount = (todayOrders as any)?.filter((o: any) => o.payment_type === 'touch_n_go').length || 0;

        return {
            success: true,
            data: {
                todayRevenue,
                ordersToday,
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

export async function getDailySales(days: number = 30) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            return { success: false, error: 'User must be assigned to a company' };
        }

        const supabase = await createClient();
        const now = new Date();
        const zonedNow = toZonedTime(now, MYT_TIMEZONE);
        const startDate = new Date(zonedNow);
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        const startDateUTC = fromZonedTime(startDate, MYT_TIMEZONE);

        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('company_id', user.company_id)
            .eq('status', 'paid')
            .gte('created_at', startDateUTC.toISOString())
            .order('created_at');

        if (!orders) {
            return { success: true, data: [] };
        }

        // Group by date in MYT timezone
        const dailyMap = new Map<string, number>();
        (orders as any[]).forEach((order: any) => {
            const zonedDate = toZonedTime(new Date(order.created_at), MYT_TIMEZONE);
            const dateKey = format(zonedDate, 'yyyy-MM-dd');
            const current = dailyMap.get(dateKey) || 0;
            dailyMap.set(dateKey, current + Number(order.total_amount));
        });

        const data = Array.from(dailyMap.entries())
            .map(([date, revenue]) => ({
                date,
                revenue,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function getWeeklySales(weeks: number = 12) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            return { success: false, error: 'User must be assigned to a company' };
        }

        const supabase = await createClient();
        const now = new Date();
        const zonedNow = toZonedTime(now, MYT_TIMEZONE);
        const startDate = new Date(zonedNow);
        startDate.setDate(startDate.getDate() - weeks * 7);
        startDate.setHours(0, 0, 0, 0);
        const startDateUTC = fromZonedTime(startDate, MYT_TIMEZONE);

        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('company_id', user.company_id)
            .eq('status', 'paid')
            .gte('created_at', startDateUTC.toISOString())
            .order('created_at');

        if (!orders) {
            return { success: true, data: [] };
        }

        // Group by week in MYT timezone
        const weeklyMap = new Map<string, number>();
        (orders as any[]).forEach((order: any) => {
            const zonedDate = toZonedTime(new Date(order.created_at), MYT_TIMEZONE);
            const year = zonedDate.getFullYear();
            const week = getWeekNumber(zonedDate);
            const weekKey = `${year}-W${week.toString().padStart(2, '0')}`;
            const current = weeklyMap.get(weekKey) || 0;
            weeklyMap.set(weekKey, current + Number(order.total_amount));
        });

        const data = Array.from(weeklyMap.entries())
            .map(([week, revenue]) => ({
                week,
                revenue,
            }))
            .sort((a, b) => a.week.localeCompare(b.week));

        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

export async function getMonthlySales(months: number = 12) {
    try {
        const user = await requireCompanyAdmin();
        if (!user.company_id) {
            return { success: false, error: 'User must be assigned to a company' };
        }

        const supabase = await createClient();
        const now = new Date();
        const zonedNow = toZonedTime(now, MYT_TIMEZONE);
        const startDate = new Date(zonedNow);
        startDate.setMonth(startDate.getMonth() - months);
        startDate.setHours(0, 0, 0, 0);
        const startDateUTC = fromZonedTime(startDate, MYT_TIMEZONE);

        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('company_id', user.company_id)
            .eq('status', 'paid')
            .gte('created_at', startDateUTC.toISOString())
            .order('created_at');

        if (!orders) {
            return { success: true, data: [] };
        }

        // Group by month in MYT timezone
        const monthlyMap = new Map<string, number>();
        (orders as any[]).forEach((order: any) => {
            const zonedDate = toZonedTime(new Date(order.created_at), MYT_TIMEZONE);
            const monthKey = format(zonedDate, 'yyyy-MM');
            const current = monthlyMap.get(monthKey) || 0;
            monthlyMap.set(monthKey, current + Number(order.total_amount));
        });

        const data = Array.from(monthlyMap.entries())
            .map(([month, revenue]) => ({
                month,
                revenue,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return { success: true, data };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'An error occurred',
        };
    }
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
