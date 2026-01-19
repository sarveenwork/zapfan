'use client';

import { useState, useEffect } from 'react';
import { getOrders } from '@/app/actions/orders';
import { refundOrder } from '@/app/actions/orders';
import Navbar from '@/components/layout/Navbar';
import { format } from 'date-fns-tz';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const MYT_TIMEZONE = 'Asia/Kuala_Lumpur';

export default function OrdersPage() {
    const { showSuccess, showError } = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refunding, setRefunding] = useState<string | null>(null);
    const [showRefundConfirm, setShowRefundConfirm] = useState(false);
    const [orderToRefund, setOrderToRefund] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        setLoading(true);
        const result = await getOrders();
        if (result.success) {
            setOrders(result.data || []);
        } else {
            showError(result.error || 'Failed to load orders');
        }
        setLoading(false);
    }

    function handleRefundClick(orderId: string) {
        setOrderToRefund(orderId);
        setShowRefundConfirm(true);
    }

    async function handleRefundConfirm() {
        if (!orderToRefund) return;

        setShowRefundConfirm(false);
        setRefunding(orderToRefund);
        const formData = new FormData();
        formData.append('order_id', orderToRefund);
        const result = await refundOrder(formData);

        if (result.success) {
            showSuccess('Order refunded successfully');
            loadOrders(); // Reload orders
        } else {
            showError(result.error || 'Failed to refund order');
        }
        setRefunding(null);
        setOrderToRefund(null);
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#FFF8F0' }}>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold" style={{ color: '#333333' }}>Recent Transactions</h1>
                    <button
                        onClick={loadOrders}
                        disabled={loading}
                        className="px-4 py-2 rounded-md transition-colors text-white"
                        style={{ 
                            backgroundColor: loading ? '#ccc' : '#FF6F3C', 
                            cursor: loading ? 'not-allowed' : 'pointer' 
                        }}
                        onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FF8F5C')}
                        onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FF6F3C')}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8" style={{ color: '#777777' }}>Loading transactions...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-8" style={{ color: '#777777' }}>No transactions found for today</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => {
                                        const zonedDate = new Date(order.created_at);
                                        return (
                                            <tr key={order.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(zonedDate, 'yyyy-MM-dd HH:mm', { timeZone: MYT_TIMEZONE })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="max-w-xs">
                                                        {order.order_items && order.order_items.length > 0 ? (
                                                            <div className="space-y-1">
                                                                {order.order_items.map((item: any, idx: number) => (
                                                                    <div key={idx} className="text-xs">
                                                                        {item.item_name_snapshot} × {item.quantity} = RM {(Number(item.item_price_snapshot) * item.quantity).toFixed(2)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span>No items</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.payment_type === 'cash' ? 'Cash' : "Touch 'n Go"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    RM {Number(order.total_amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            order.status === 'paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {order.status === 'paid' ? 'Paid' : 'Refunded'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {order.status === 'paid' && (
                                                        <button
                                                            onClick={() => handleRefundClick(order.id)}
                                                            disabled={refunding === order.id}
                                                            className="disabled:opacity-50 transition-colors"
                                                            style={{ color: '#FF4C4C', cursor: refunding === order.id ? 'not-allowed' : 'pointer' }}
                                                            onMouseEnter={(e) => !refunding && (e.currentTarget.style.color = '#CC0000')}
                                                            onMouseLeave={(e) => !refunding && (e.currentTarget.style.color = '#FF4C4C')}
                                                        >
                                                            {refunding === order.id ? 'Refunding...' : 'Refund'}
                                                        </button>
                                                    )}
                                                    {order.status === 'refunded' && (
                                                        <span className="text-gray-500">Refunded</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Refund Confirmation Modal */}
                <ConfirmationModal
                    isOpen={showRefundConfirm}
                    title="Refund Order"
                    message="Are you sure you want to refund this order? This action cannot be undone."
                    confirmText="Refund"
                    cancelText="Cancel"
                    confirmColor="danger"
                    onConfirm={handleRefundConfirm}
                    onCancel={() => {
                        setShowRefundConfirm(false);
                        setOrderToRefund(null);
                    }}
                    isLoading={refunding !== null}
                />
            </div>
        </div>
    );
}
