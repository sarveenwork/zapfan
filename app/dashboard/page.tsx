'use client';

import { useEffect, useState } from 'react';
import { getDashboardMetrics, getDailySales, getWeeklySales, getMonthlySales } from '@/app/actions/analytics';
import Navbar from '@/components/layout/Navbar';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [dailySales, setDailySales] = useState<any[]>([]);
    const [weeklySales, setWeeklySales] = useState<any[]>([]);
    const [monthlySales, setMonthlySales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [metricsResult, dailyResult, weeklyResult, monthlyResult] = await Promise.all([
            getDashboardMetrics(),
            getDailySales(30),
            getWeeklySales(12),
            getMonthlySales(12),
        ]);

        if (metricsResult.success) {
            setMetrics(metricsResult.data);
        }
        if (dailyResult.success) {
            setDailySales(dailyResult.data || []);
        }
        if (weeklyResult.success) {
            setWeeklySales(weeklyResult.data || []);
        }
        if (monthlyResult.success) {
            setMonthlySales(monthlyResult.data || []);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: '#FFF8F0' }}>
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center" style={{ color: '#777777' }}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#FFF8F0' }}>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6" style={{ color: '#333333' }}>Dashboard</h1>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm font-medium" style={{ color: '#777777' }}>Today's Revenue</p>
                        <p className="text-2xl font-bold mt-2" style={{ color: '#333333' }}>
                            RM {metrics?.todayRevenue?.toFixed(2) || '0.00'}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm font-medium" style={{ color: '#777777' }}>Orders Today</p>
                        <p className="text-2xl font-bold mt-2" style={{ color: '#333333' }}>
                            {metrics?.ordersToday || 0}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm font-medium" style={{ color: '#777777' }}>Cash Payments</p>
                        <p className="text-2xl font-bold mt-2" style={{ color: '#333333' }}>
                            {metrics?.cashCount || 0}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-sm font-medium" style={{ color: '#777777' }}>Touch 'n Go</p>
                        <p className="text-2xl font-bold mt-2" style={{ color: '#333333' }}>
                            {metrics?.touchNGoCount || 0}
                        </p>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4" style={{ color: '#333333' }}>Daily Sales (Last 30 Days)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={dailySales}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `RM ${value.toFixed(2)}`} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#FF6F3C"
                                    strokeWidth={2}
                                    name="Revenue"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4" style={{ color: '#333333' }}>Weekly Sales (Last 12 Weeks)</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklySales}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `RM ${value.toFixed(2)}`} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#FF6F3C" name="Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4" style={{ color: '#333333' }}>Monthly Sales (Last 12 Months)</h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `RM ${value.toFixed(2)}`} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#4CAF50" name="Revenue" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
