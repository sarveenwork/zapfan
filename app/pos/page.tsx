'use client';

import { useEffect, useState } from 'react';
import { getActiveItems } from '@/app/actions/items';
import { createOrder } from '@/app/actions/orders';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/contexts/ToastContext';

interface Item {
    id: string;
    name: string;
    price: number;
    is_active: boolean;
}

interface CartItem {
    item_id: string;
    name: string;
    price: number;
    quantity: number;
}

export default function POSPage() {
    const { showSuccess, showError } = useToast();
    const [items, setItems] = useState<Item[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentType, setPaymentType] = useState<'cash' | 'touch_n_go' | ''>('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadItems();
    }, []);

    async function loadItems() {
        setLoading(true);
        const result = await getActiveItems();
        if (result.success && result.data) {
            setItems(result.data);
        }
        setLoading(false);
    }

    function addToCart(item: Item) {
        setError('');
        const existingItem = cart.find((ci) => ci.item_id === item.id);
        if (existingItem) {
            setCart(
                cart.map((ci) =>
                    ci.item_id === item.id
                        ? { ...ci, quantity: ci.quantity + 1 }
                        : ci
                )
            );
        } else {
            setCart([...cart, { item_id: item.id, name: item.name, price: item.price, quantity: 1 }]);
        }
    }

    function updateQuantity(itemId: string, delta: number) {
        setCart(
            cart
                .map((item) =>
                    item.item_id === itemId
                        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    }

    function removeFromCart(itemId: string) {
        setCart(cart.filter((item) => item.item_id !== itemId));
    }

    function calculateSubtotal() {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    async function handlePay() {
        if (cart.length === 0) {
            setError('Cart is empty');
            return;
        }

        if (!paymentType) {
            setError('Please select a payment type');
            return;
        }

        setProcessing(true);
        setError('');

        const formData = new FormData();
        formData.append(
            'items',
            JSON.stringify(
                cart.map((item) => ({
                    item_id: item.item_id,
                    quantity: item.quantity,
                }))
            )
        );
        formData.append('payment_type', paymentType);

        const result = await createOrder(formData);

        if (result.success) {
            // Reset cart and payment
            setCart([]);
            setPaymentType('');
            setError('');
            showSuccess('Order created successfully!');
            // Reload items in case prices changed
            loadItems();
        } else {
            const errorMsg = result.error || 'Failed to create order';
            setError(errorMsg);
            showError(errorMsg);
        }

        setProcessing(false);
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#FFF8F0' }}>
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Panel - Items */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>Items</h2>
                            {loading ? (
                                <div className="text-center py-8">Loading items...</div>
                            ) : items.length === 0 ? (
                                <div className="text-center py-8" style={{ color: '#777777' }}>No items available</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => addToCart(item)}
                                            className="border-2 rounded-lg p-4 text-left transition-colors min-h-[120px] flex flex-col justify-between"
                                            style={{
                                                backgroundColor: '#FFF4E6',
                                                borderColor: '#FFD4B8',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#FFE8D1';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#FFF4E6';
                                            }}
                                        >
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1" style={{ color: '#333333' }}>
                                                    {item.name}
                                                </h3>
                                                <p className="font-bold text-xl" style={{ color: '#FF6F3C' }}>
                                                    RM {item.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Cart */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                            <h2 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>Cart</h2>

                            {error && (
                                <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: '#FFE5E5', borderColor: '#FFB3B3', border: '1px solid', color: '#FF4C4C' }}>
                                    {error}
                                </div>
                            )}

                            {cart.length === 0 ? (
                                <div className="text-center py-8" style={{ color: '#777777' }}>Cart is empty</div>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                                        {cart.map((item) => (
                                            <div
                                                key={item.item_id}
                                                className="flex items-center justify-between p-3 rounded-lg"
                                                style={{ backgroundColor: '#F5F5F5' }}
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium" style={{ color: '#333333' }}>{item.name}</p>
                                                    <p className="text-sm" style={{ color: '#777777' }}>
                                                        RM {item.price.toFixed(2)} × {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.item_id, -1)}
                                                        className="w-8 h-8 rounded flex items-center justify-center font-bold transition-colors"
                                                        style={{ backgroundColor: '#e5e5e5', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d4d4'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-8 text-center font-medium" style={{ color: '#333333' }}>{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.item_id, 1)}
                                                        className="w-8 h-8 rounded flex items-center justify-center font-bold transition-colors"
                                                        style={{ backgroundColor: '#e5e5e5', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d4d4'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() => removeFromCart(item.item_id)}
                                                        className="ml-2 transition-colors"
                                                        style={{ color: '#FF4C4C', cursor: 'pointer' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#CC0000'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#FF4C4C'}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 space-y-4">
                                        <div className="flex justify-between text-lg">
                                            <span className="font-medium" style={{ color: '#777777' }}>Subtotal:</span>
                                            <span className="font-bold" style={{ color: '#333333' }}>
                                                RM {calculateSubtotal().toFixed(2)}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2" style={{ color: '#333333' }}>
                                                Payment Type
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setPaymentType('cash')}
                                                    className="p-3 rounded-lg border-2 font-medium transition-colors"
                                                    style={paymentType === 'cash' ? {
                                                        borderColor: '#FF6F3C',
                                                        backgroundColor: '#FFF4E6',
                                                        color: '#FF6F3C',
                                                        cursor: 'pointer'
                                                    } : {
                                                        borderColor: '#ddd',
                                                        color: '#333333',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (paymentType !== 'cash') {
                                                            e.currentTarget.style.borderColor = '#bbb';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (paymentType !== 'cash') {
                                                            e.currentTarget.style.borderColor = '#ddd';
                                                        }
                                                    }}
                                                >
                                                    Cash
                                                </button>
                                                <button
                                                    onClick={() => setPaymentType('touch_n_go')}
                                                    className="p-3 rounded-lg border-2 font-medium transition-colors"
                                                    style={paymentType === 'touch_n_go' ? {
                                                        borderColor: '#FF6F3C',
                                                        backgroundColor: '#FFF4E6',
                                                        color: '#FF6F3C',
                                                        cursor: 'pointer'
                                                    } : {
                                                        borderColor: '#ddd',
                                                        color: '#333333',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (paymentType !== 'touch_n_go') {
                                                            e.currentTarget.style.borderColor = '#bbb';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (paymentType !== 'touch_n_go') {
                                                            e.currentTarget.style.borderColor = '#ddd';
                                                        }
                                                    }}
                                                >
                                                    Touch 'n Go
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePay}
                                            disabled={processing || !paymentType}
                                            className="w-full disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
                                            style={{
                                                backgroundColor: (processing || !paymentType) ? '#ccc' : '#FF6F3C',
                                                cursor: (processing || !paymentType) ? 'not-allowed' : 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!processing && paymentType) {
                                                    e.currentTarget.style.backgroundColor = '#FF8F5C';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!processing && paymentType) {
                                                    e.currentTarget.style.backgroundColor = '#FF6F3C';
                                                }
                                            }}
                                        >
                                            {processing ? 'Processing...' : `Pay RM ${calculateSubtotal().toFixed(2)}`}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
