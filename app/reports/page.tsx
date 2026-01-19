'use client';

import { useState } from 'react';
import { getReportData, exportReportToCSV } from '@/app/actions/reports';
import { refundOrder } from '@/app/actions/orders';
import Navbar from '@/components/layout/Navbar';
import { format } from 'date-fns-tz';
import { useToast } from '@/contexts/ToastContext';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const MYT_TIMEZONE = 'Asia/Kuala_Lumpur';

export default function ReportsPage() {
    const { showSuccess, showError } = useToast();
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return format(date, 'yyyy-MM-dd');
    });
    const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [refunding, setRefunding] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showRefundConfirm, setShowRefundConfirm] = useState(false);
    const [orderToRefund, setOrderToRefund] = useState<string | null>(null);

    async function loadReport() {
        setLoading(true);
        setError(null);
        try {
            // Create ISO datetime strings (will be interpreted as MYT on server)
            const startDateTime = `${startDate}T00:00:00`;
            const endDateTime = `${endDate}T23:59:59`;
            const result = await getReportData(startDateTime, endDateTime);
            if (result.success) {
                setReportData(result.data);
            } else {
                setError(result.error || 'Failed to load report data');
                setReportData(null);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while loading the report');
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleExport() {
        if (!reportData) {
            const errorMsg = 'Please load report data first';
            setError(errorMsg);
            showError(errorMsg);
            return;
        }
        setExporting(true);
        setError(null);
        try {
            const startDateTime = `${startDate}T00:00:00`;
            const endDateTime = `${endDate}T23:59:59`;
            const result = await exportReportToCSV(startDateTime, endDateTime);
            if (result.success && result.data) {
                const blob = new Blob([result.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report-${startDate}-${endDate}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                showSuccess('Report exported successfully');
            } else {
                const errorMsg = result.error || 'Failed to export report';
                setError(errorMsg);
                showError(errorMsg);
            }
        } catch (err: any) {
            const errorMsg = err.message || 'An error occurred while exporting the report';
            setError(errorMsg);
            showError(errorMsg);
        } finally {
            setExporting(false);
        }
    }

    function handleViewOrder(order: any) {
        setSelectedOrder(order);
        setShowOrderModal(true);
    }

    function handleCloseModal() {
        setShowOrderModal(false);
        setSelectedOrder(null);
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
            loadReport(); // Reload report data
            // Close modal if viewing the refunded order
            if (selectedOrder && selectedOrder.id === orderToRefund) {
                handleCloseModal();
            }
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
                <h1 className="text-3xl font-bold mb-6" style={{ color: '#333333' }}>Reports</h1>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-md p-4" style={{ backgroundColor: '#FFE5E5', border: '1px solid #FF4C4C' }}>
                        <p className="text-sm" style={{ color: '#FF4C4C' }}>{error}</p>
                    </div>
                )}

                {/* Date Range Filter */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={loadReport}
                                disabled={loading}
                                className="w-full disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                                style={{ backgroundColor: loading ? '#ccc' : '#FF6F3C', cursor: loading ? 'not-allowed' : 'pointer' }}
                                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FF8F5C')}
                                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FF6F3C')}
                            >
                                {loading ? 'Loading...' : 'Load Report'}
                            </button>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleExport}
                                disabled={exporting || !reportData}
                                className="w-full disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                                style={{ backgroundColor: (exporting || !reportData) ? '#ccc' : '#4CAF50', cursor: (exporting || !reportData) ? 'not-allowed' : 'pointer' }}
                                onMouseEnter={(e) => !(exporting || !reportData) && (e.currentTarget.style.backgroundColor = '#66BB6A')}
                                onMouseLeave={(e) => !(exporting || !reportData) && (e.currentTarget.style.backgroundColor = '#4CAF50')}
                            >
                                {exporting ? 'Exporting...' : 'Export CSV'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {reportData && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                RM {reportData.totalRevenue?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {reportData.totalOrders || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm font-medium text-gray-600">Cash Payments</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {reportData.cashCount || 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <p className="text-sm font-medium text-gray-600">Touch 'n Go</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {reportData.touchNGoCount || 0}
                            </p>
                        </div>
                    </div>
                )}

                {/* Orders List */}
                {reportData && reportData.orders && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Orders</h2>
                        </div>
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
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reportData.orders.map((order: any) => {
                                        const zonedDate = new Date(order.created_at);
                                        return (
                                            <tr key={order.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(zonedDate, 'yyyy-MM-dd HH:mm', { timeZone: MYT_TIMEZONE })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {order.order_items?.length || 0} item(s)
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {order.payment_type === 'cash' ? 'Cash' : "Touch 'n Go"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    RM {Number(order.total_amount).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    <button
                                                        onClick={() => handleViewOrder(order)}
                                                        className="transition-colors"
                                                        style={{ color: '#FF6F3C', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#FF8F5C'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#FF6F3C'}
                                                    >
                                                        View
                                                    </button>
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
                                    {/* Total Row */}
                                    {reportData.orders.length > 0 && (
                                        <tr className="bg-gray-50 font-bold">
                                            <td colSpan={3} className="px-6 py-4 text-sm text-gray-900 text-right">
                                                Total:
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold" style={{ color: '#FF6F3C' }}>
                                                RM {reportData.totalRevenue?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="px-6 py-4"></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Order Details Modal */}
                {showOrderModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-xl font-bold" style={{ color: '#333333' }}>Order Details</h3>
                                <button
                                    onClick={handleCloseModal}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="px-6 py-4 space-y-4">
                                {/* Order Information */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Date & Time</p>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {format(new Date(selectedOrder.created_at), 'yyyy-MM-dd HH:mm:ss', { timeZone: MYT_TIMEZONE })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Payment Type</p>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {selectedOrder.payment_type === 'cash' ? 'Cash' : "Touch 'n Go"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Status</p>
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${selectedOrder.status === 'paid'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {selectedOrder.status === 'paid' ? 'Paid' : 'Refunded'}
                                        </span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-3">Order Items</p>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                                                    selectedOrder.order_items.map((item: any, index: number) => {
                                                        const itemTotal = Number(item.item_price_snapshot) * item.quantity;
                                                        const category = item.items?.category || '';
                                                        const categoryLabel = category === 'food' ? 'food' : category === 'drink' ? 'drink' : '';
                                                        const displayName = categoryLabel 
                                                            ? `${item.item_name_snapshot} (${categoryLabel})`
                                                            : item.item_name_snapshot;
                                                        return (
                                                            <tr key={index}>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{displayName}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-500">RM {Number(item.item_price_snapshot).toFixed(2)}</td>
                                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">RM {itemTotal.toFixed(2)}</td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-4 py-3 text-sm text-gray-500 text-center">No items</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-medium" style={{ color: '#333333' }}>Total Amount:</span>
                                        <span className="text-xl font-bold" style={{ color: '#FF6F3C' }}>
                                            RM {Number(selectedOrder.total_amount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Refund Info if refunded */}
                                {selectedOrder.status === 'refunded' && selectedOrder.refunded_at && (
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium text-gray-600">Refunded At</p>
                                        <p className="text-sm text-gray-900 mt-1">
                                            {format(new Date(selectedOrder.refunded_at), 'yyyy-MM-dd HH:mm:ss', { timeZone: MYT_TIMEZONE })}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="border-t pt-4 flex justify-end space-x-2">
                                    {selectedOrder.status === 'paid' && (
                                        <button
                                            onClick={() => {
                                                handleCloseModal();
                                                handleRefundClick(selectedOrder.id);
                                            }}
                                            disabled={refunding === selectedOrder.id}
                                            className="px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                                            style={{
                                                backgroundColor: '#FF4C4C',
                                                color: '#ffffff',
                                                cursor: refunding === selectedOrder.id ? 'not-allowed' : 'pointer'
                                            }}
                                            onMouseEnter={(e) => !refunding && (e.currentTarget.style.backgroundColor = '#CC0000')}
                                            onMouseLeave={(e) => !refunding && (e.currentTarget.style.backgroundColor = '#FF4C4C')}
                                        >
                                            {refunding === selectedOrder.id ? 'Refunding...' : 'Refund Order'}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 border border-gray-300 rounded-md transition-colors"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
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
