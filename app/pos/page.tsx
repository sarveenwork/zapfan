'use client';

import { useEffect, useState } from 'react';
import { getActiveItems } from '@/app/actions/items';
import { createOrder } from '@/app/actions/orders';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

interface Item {
    id: string;
    name: string;
    price: number;
    category: 'food' | 'drink';
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
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentType, setPaymentType] = useState<'cash' | 'touch_n_go' | ''>('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [companyName, setCompanyName] = useState<string>('MoodieFoodie');
    const [activeTab, setActiveTab] = useState<'food' | 'drink'>('food');

    // Prevent body scrolling on POS page
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        loadItems();
        loadCompanyName();
    }, []);

    async function loadCompanyName() {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('company_id, companies(name)')
                    .eq('id', user.id)
                    .single();

                if (profile && (profile as any).companies && (profile as any).companies.name) {
                    setCompanyName((profile as any).companies.name);
                } else {
                    setCompanyName('MoodieFoodie');
                }
            } else {
                setCompanyName('MoodieFoodie');
            }
        } catch (error) {
            // Keep default company name on error
            setCompanyName('MoodieFoodie');
        }
    }

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

    async function handleSignOut() {
        await signOut();
        router.push('/login');
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
            {/* 
                POS Layout Requirements:
                - Tablet-first: Always uses left-right layout (never top/bottom stacking)
                - Two columns at all breakpoints ≥ tablet
                - Left: Scrollable items list with category tabs
                - Right: Fixed order summary with payment (no scrolling)
                - Pay button always visible
                - Touch-friendly: All buttons ≥48px
                - No body scrolling
            */}
            {/* Fixed Header */}
            <header className="flex-shrink-0 shadow-sm border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5' }}>
                <div className="h-16 px-6 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-xl font-bold transition-colors min-h-[48px] px-4 py-2 flex items-center"
                        style={{ color: '#333333', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#FF6F3C'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#333333'}
                    >
                        {companyName}
                    </button>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[48px] flex items-center"
                        style={{ color: '#777777', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#333333'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#777777'}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content - Two Column Layout - ALWAYS side-by-side on tablet+ */}
            <div className="pos-main-grid flex-1 grid grid-cols-[2fr_1fr] gap-0 overflow-hidden min-h-0">
                {/* Left Panel - Items List (Scrollable) */}
                <div className="flex flex-col overflow-hidden min-h-0">
                    <div className="flex-shrink-0 px-6 py-4 border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5' }}>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>Items</h2>
                        {/* Category Tabs */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActiveTab('food')}
                                className="px-6 py-3 rounded-lg font-semibold text-lg transition-colors min-h-[48px] min-w-[48px]"
                                style={activeTab === 'food' ? {
                                    backgroundColor: '#FF6F3C',
                                    color: '#ffffff',
                                    cursor: 'pointer'
                                } : {
                                    backgroundColor: '#F5F5F5',
                                    color: '#777777',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'food') {
                                        e.currentTarget.style.backgroundColor = '#E5E5E5';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'food') {
                                        e.currentTarget.style.backgroundColor = '#F5F5F5';
                                    }
                                }}
                            >
                                Food
                            </button>
                            <button
                                onClick={() => setActiveTab('drink')}
                                className="px-6 py-3 rounded-lg font-semibold text-lg transition-colors min-h-[48px] min-w-[48px]"
                                style={activeTab === 'drink' ? {
                                    backgroundColor: '#FF6F3C',
                                    color: '#ffffff',
                                    cursor: 'pointer'
                                } : {
                                    backgroundColor: '#F5F5F5',
                                    color: '#777777',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeTab !== 'drink') {
                                        e.currentTarget.style.backgroundColor = '#E5E5E5';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeTab !== 'drink') {
                                        e.currentTarget.style.backgroundColor = '#F5F5F5';
                                    }
                                }}
                            >
                                Drinks
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4" style={{ backgroundColor: '#FFF8F0' }}>
                        {loading ? (
                            <div className="text-center py-8" style={{ color: '#777777' }}>Loading items...</div>
                        ) : (() => {
                            const filteredItems = items.filter(item => item.category === activeTab);
                            return filteredItems.length === 0 ? (
                                <div className="text-center py-8" style={{ color: '#777777' }}>
                                    No {activeTab === 'food' ? 'food' : 'drink'} items available
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                    {filteredItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => addToCart(item)}
                                            className="border-2 rounded-lg p-4 text-left transition-colors min-h-[140px] flex flex-col justify-between min-w-[48px]"
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
                                                <h3 className="font-semibold text-lg mb-2" style={{ color: '#333333' }}>
                                                    {item.name}
                                                </h3>
                                                <p className="font-bold text-xl" style={{ color: '#FF6F3C' }}>
                                                    RM {item.price.toFixed(2)}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Right Panel - Order Summary (Fixed, No Scroll) */}
                <div className="flex flex-col overflow-hidden border-l min-h-0" style={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5' }}>
                    <div className="flex-shrink-0 px-6 py-4 border-b" style={{ borderColor: '#e5e5e5' }}>
                        <h2 className="text-2xl font-bold" style={{ color: '#333333' }}>Order</h2>
                    </div>
                    
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Cart Items - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {error && (
                                <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: '#FFE5E5', borderColor: '#FFB3B3', border: '1px solid', color: '#FF4C4C' }}>
                                    {error}
                                </div>
                            )}

                            {cart.length === 0 ? (
                                <div className="text-center py-8" style={{ color: '#777777' }}>Cart is empty</div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map((item) => (
                                        <div
                                            key={item.item_id}
                                            className="flex items-center justify-between p-3 rounded-lg"
                                            style={{ backgroundColor: '#F5F5F5' }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate" style={{ color: '#333333' }}>{item.name}</p>
                                                <p className="text-sm" style={{ color: '#777777' }}>
                                                    RM {item.price.toFixed(2)} × {item.quantity}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-2">
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, -1)}
                                                    className="w-12 h-12 rounded flex items-center justify-center font-bold transition-colors flex-shrink-0 text-xl"
                                                    style={{ backgroundColor: '#e5e5e5', cursor: 'pointer' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d4d4'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
                                                >
                                                    −
                                                </button>
                                                <span className="w-12 text-center font-medium flex-shrink-0 text-lg" style={{ color: '#333333' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, 1)}
                                                    className="w-12 h-12 rounded flex items-center justify-center font-bold transition-colors flex-shrink-0 text-xl"
                                                    style={{ backgroundColor: '#e5e5e5', cursor: 'pointer' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d4d4'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.item_id)}
                                                    className="ml-2 transition-colors flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl font-bold"
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
                            )}
                        </div>

                        {/* Payment Section - Fixed at Bottom */}
                        <div className="flex-shrink-0 border-t px-6 py-4 space-y-4" style={{ borderColor: '#e5e5e5', backgroundColor: '#ffffff' }}>
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
                                        className="p-3 rounded-lg border-2 font-medium transition-colors min-h-[48px]"
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
                                        className="p-3 rounded-lg border-2 font-medium transition-colors min-h-[48px]"
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
                                disabled={processing || !paymentType || cart.length === 0}
                                className="w-full disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors min-h-[56px]"
                                style={{
                                    backgroundColor: (processing || !paymentType || cart.length === 0) ? '#ccc' : '#FF6F3C',
                                    cursor: (processing || !paymentType || cart.length === 0) ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (!processing && paymentType && cart.length > 0) {
                                        e.currentTarget.style.backgroundColor = '#FF8F5C';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!processing && paymentType && cart.length > 0) {
                                        e.currentTarget.style.backgroundColor = '#FF6F3C';
                                    }
                                }}
                            >
                                {processing ? 'Processing...' : `Pay RM ${calculateSubtotal().toFixed(2)}`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
