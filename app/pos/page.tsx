'use client';

import { useEffect, useState } from 'react';
import { getActiveItems } from '@/app/actions/items';
import { createOrder } from '@/app/actions/orders';
import { useToast } from '@/contexts/ToastContext';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/actions/auth';
import { useRouter, usePathname } from 'next/navigation';

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
    const pathname = usePathname();
    const [items, setItems] = useState<Item[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentType, setPaymentType] = useState<'cash' | 'touch_n_go' | ''>('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [companyName, setCompanyName] = useState<string>('ZapFan');
    const [activeTab, setActiveTab] = useState<'food' | 'drink'>('food');
    const [signingOut, setSigningOut] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Prevent body scrolling on POS page
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Fullscreen API handlers - sync state with actual fullscreen status
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(isCurrentlyFullscreen());
        };

        // Set initial state
        setIsFullscreen(isCurrentlyFullscreen());

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // Check if fullscreen is supported
    function isFullscreenSupported(): boolean {
        const element = document.documentElement;
        return !!(
            element.requestFullscreen ||
            (element as any).webkitRequestFullscreen ||
            (element as any).mozRequestFullScreen ||
            (element as any).msRequestFullscreen
        );
    }

    // Check if currently in fullscreen
    function isCurrentlyFullscreen(): boolean {
        return !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        );
    }

    async function handleEnterFullscreen() {
        if (!isFullscreenSupported()) {
            return; // Silently fail if not supported
        }

        try {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
            } else if ((element as any).mozRequestFullScreen) {
                await (element as any).mozRequestFullScreen();
            } else if ((element as any).msRequestFullscreen) {
                await (element as any).msRequestFullscreen();
            }
        } catch (error) {
            // Silently handle errors - fullscreen may not be available due to user gesture requirements
            // or browser restrictions
            console.debug('Fullscreen entry failed:', error);
        }
    }

    async function handleExitFullscreen() {
        if (!isCurrentlyFullscreen()) {
            return; // Already not in fullscreen
        }

        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
        } catch (error) {
            // Silently handle errors
            console.debug('Fullscreen exit failed:', error);
        }
    }

    // Automatic fullscreen management based on route
    useEffect(() => {
        // Only manage fullscreen if API is supported
        if (!isFullscreenSupported()) {
            return;
        }

        const isOnPOSRoute = pathname === '/pos';

        if (isOnPOSRoute) {
            // Enter fullscreen when on POS route (if not already)
            // Note: Some browsers require user gesture for fullscreen, so this may not always work
            // User can still manually click the fullscreen button if auto-entry fails
            if (!isCurrentlyFullscreen()) {
                // Small delay to ensure smooth transition and allow DOM to settle
                const timer = setTimeout(() => {
                    handleEnterFullscreen();
                }, 100);
                return () => clearTimeout(timer);
            }
        } else {
            // Exit fullscreen when leaving POS route
            if (isCurrentlyFullscreen()) {
                handleExitFullscreen();
            }
        }
    }, [pathname]);

    // Cleanup: Exit fullscreen when component unmounts (user navigates away)
    useEffect(() => {
        return () => {
            if (isCurrentlyFullscreen()) {
                handleExitFullscreen();
            }
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
                    setCompanyName('ZapFan');
                }
            } else {
                setCompanyName('ZapFan');
            }
        } catch (error) {
            // Keep default company name on error
            setCompanyName('ZapFan');
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
            // Move existing item to front and update quantity
            const updatedItem = { ...existingItem, quantity: existingItem.quantity + 1 };
            const otherItems = cart.filter((ci) => ci.item_id !== item.id);
            setCart([updatedItem, ...otherItems]);
        } else {
            // Add new item at the beginning
            setCart([{ item_id: item.id, name: item.name, price: item.price, quantity: 1 }, ...cart]);
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
        if (processing) return; // Prevent spam clicks
        
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
        if (signingOut) return; // Prevent spam clicks
        setSigningOut(true);
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            setSigningOut(false);
        }
    }

    return (
        <div className="pos-page h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
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
                    <div className="flex items-center space-x-2">
                        {/* Fullscreen Toggle */}
                        <button
                            onClick={isFullscreen ? handleExitFullscreen : handleEnterFullscreen}
                            className="px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[48px] flex items-center"
                            style={{ 
                                backgroundColor: '#F5F5F5',
                                color: '#777777', 
                                cursor: 'pointer' 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E5E5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                        >
                            {isFullscreen ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[48px] flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ 
                                color: signingOut ? '#999999' : '#777777', 
                                cursor: signingOut ? 'not-allowed' : 'pointer' 
                            }}
                            onMouseEnter={(e) => !signingOut && (e.currentTarget.style.color = '#333333')}
                            onMouseLeave={(e) => !signingOut && (e.currentTarget.style.color = '#777777')}
                        >
                            {signingOut ? 'Signing out...' : 'Sign Out'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content - Two Column Layout - ALWAYS side-by-side on tablet+ */}
            <div className="pos-main-grid flex-1 grid grid-cols-[2fr_1fr] gap-0 overflow-hidden min-h-0">
                {/* Left Panel - Items List (Scrollable) */}
                <div className="flex flex-col overflow-hidden min-h-0">
                    <div className="flex-shrink-0 px-6 py-4 border-b" style={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5' }}>
                        {/* Category Tabs - Only label, no "Items" heading */}
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
                                                {/* Item name - highest priority */}
                                                <p className="font-semibold truncate text-base mb-0.5" style={{ color: '#333333' }}>{item.name}</p>
                                                {/* Item price - secondary priority */}
                                                <p className="text-sm font-medium" style={{ color: '#777777' }}>
                                                    RM {item.price.toFixed(2)} × {item.quantity}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-1 ml-2">
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, -1)}
                                                    disabled={item.quantity <= 1}
                                                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold transition-colors flex-shrink-0 text-base disabled:opacity-40 disabled:cursor-not-allowed"
                                                    style={{ 
                                                        backgroundColor: item.quantity <= 1 ? '#f0f0f0' : '#e5e5e5', 
                                                        color: item.quantity <= 1 ? '#999999' : '#666666',
                                                        cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                                                        minWidth: '36px',
                                                        minHeight: '36px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (item.quantity > 1) {
                                                            e.currentTarget.style.backgroundColor = '#d4d4d4';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (item.quantity > 1) {
                                                            e.currentTarget.style.backgroundColor = '#e5e5e5';
                                                        }
                                                    }}
                                                    title="Decrease quantity"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center font-medium flex-shrink-0 text-sm" style={{ color: '#777777', minWidth: '32px' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.item_id, 1)}
                                                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold transition-colors flex-shrink-0 text-base"
                                                    style={{ 
                                                        backgroundColor: '#e5e5e5', 
                                                        color: '#666666',
                                                        cursor: 'pointer',
                                                        minWidth: '36px',
                                                        minHeight: '36px'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d4d4d4'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e5e5e5'}
                                                    title="Increase quantity"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => removeFromCart(item.item_id)}
                                                    className="ml-1 transition-colors flex-shrink-0 w-9 h-9 flex items-center justify-center text-lg font-semibold rounded-full"
                                                    style={{ 
                                                        backgroundColor: '#f0f0f0',
                                                        color: '#FF4C4C', 
                                                        cursor: 'pointer',
                                                        minWidth: '36px',
                                                        minHeight: '36px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#ffe5e5';
                                                        e.currentTarget.style.color = '#CC0000';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                                                        e.currentTarget.style.color = '#FF4C4C';
                                                    }}
                                                    title="Remove item"
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
