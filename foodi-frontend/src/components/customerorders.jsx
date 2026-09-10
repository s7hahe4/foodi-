import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API, WS_URL } from '../api/client';
import { generateOrderInvoicePDF } from '../utils/invoiceGenerator';
import ReviewModal from './ReviewModal';

const CustomerOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
    const [reviewModalOrder, setReviewModalOrder] = useState(null);

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${API}/api/menu/orders/my-orders/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    const parsedOrders = Array.isArray(data) ? data : (data.results || []);
                    setOrders(parsedOrders);
                } else {
                    console.error("Failed to fetch orders, status:", res.status);
                }
            } catch (error) {
                console.error("Network error while fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyOrders();
    }, []);

    // REAL-TIME WEBSOCKETS FOR LIVE TRACKING
    useEffect(() => {
        const activeOrders = orders.filter(o => !['Delivered', 'Rejected'].includes(o.status));
        const sockets = [];

        activeOrders.forEach(order => {
            const ws = new WebSocket(`${WS_URL}/ws/orders/track/${order.id}/`);
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'order_status_update') {
                        setOrders(prevOrders => 
                            prevOrders.map(o => 
                                o.id === order.id ? { ...o, status: data.status } : o
                            )
                        );
                    }
                } catch (e) {
                    console.error('WS parsing error:', e);
                }
            };

            sockets.push(ws);
        });

        return () => {
            sockets.forEach(ws => ws.close());
        };
    }, [orders.length]);

    const activeOrdersList = orders.filter(o => !['Delivered', 'Rejected'].includes(o.status));
    const completedOrdersList = orders.filter(o => o.status === 'Delivered');

    const filteredOrders = filter === 'active' 
        ? activeOrdersList 
        : filter === 'completed' 
            ? completedOrdersList 
            : orders;

    const getStatusTheme = (status) => {
        switch (status) {
            case 'Pending':
                return {
                    bg: '#fff7ed',
                    border: '#ffedd5',
                    color: '#c2410c',
                    dot: '#f97316',
                    icon: '⏳',
                    label: 'Order Received'
                };
            case 'Preparing':
                return {
                    bg: '#fef3c7',
                    border: '#fde68a',
                    color: '#b45309',
                    dot: '#f59e0b',
                    icon: '🍳',
                    label: 'Preparing Meal'
                };
            case 'Ready':
                return {
                    bg: '#ecfdf5',
                    border: '#a7f3d0',
                    color: '#047857',
                    dot: '#10b981',
                    icon: '📦',
                    label: 'Ready for Pickup'
                };
            case 'Out for Delivery':
                return {
                    bg: '#eff6ff',
                    border: '#bfdbfe',
                    color: '#1d4ed8',
                    dot: '#3b82f6',
                    icon: '🛵',
                    label: 'On the Way'
                };
            case 'Delivered':
                return {
                    bg: '#f0fdf4',
                    border: '#bbf7d0',
                    color: '#15803d',
                    dot: '#22c55e',
                    icon: '🎉',
                    label: 'Delivered'
                };
            case 'Rejected':
                return {
                    bg: '#fef2f2',
                    border: '#fecaca',
                    color: '#b91c1c',
                    dot: '#ef4444',
                    icon: '❌',
                    label: 'Cancelled'
                };
            default:
                return {
                    bg: '#f8fafc',
                    border: '#e2e8f0',
                    color: '#475569',
                    dot: '#94a3b8',
                    icon: '📄',
                    label: status
                };
        }
    };

    if (loading) {
        return (
            <div style={{ maxWidth: '840px', margin: '40px auto', textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
                <h3 style={{ color: '#1e293b', fontWeight: 700, margin: '0 0 6px' }}>Fetching Your Orders</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Connecting with Foodi++ database...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 20px 100px' }}>
            
            {/* ── Top Navigation & Title Bar ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '8px 16px',
                            color: '#334155',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s',
                            width: 'auto',
                            margin: '0 0 14px 0'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                        <span>←</span> Back to Restaurants
                    </button>
                    <h1 style={{ color: '#0f172a', margin: 0, fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        My Orders 🧾
                    </h1>
                    <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.92rem' }}>
                        Track your live delivery status, view history, and download PDF receipts
                    </p>
                </div>

                {/* Quick Home action */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        padding: '9px 18px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: 'auto',
                        margin: 0
                    }}
                >
                    <span>🍔</span> Explore Menu
                </button>
            </div>

            {/* ── Filter Tabs ── */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '22px',
                background: '#ffffff',
                padding: '6px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                <button
                    onClick={() => setFilter('all')}
                    style={{
                        flex: 1,
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: filter === 'all' ? '#e67e22' : 'transparent',
                        color: filter === 'all' ? '#ffffff' : '#64748b',
                        fontWeight: filter === 'all' ? 700 : 500,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        margin: 0,
                        width: 'auto'
                    }}
                >
                    All Orders ({orders.length})
                </button>

                <button
                    onClick={() => setFilter('active')}
                    style={{
                        flex: 1,
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: filter === 'active' ? '#3b82f6' : 'transparent',
                        color: filter === 'active' ? '#ffffff' : '#64748b',
                        fontWeight: filter === 'active' ? 700 : 500,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        margin: 0,
                        width: 'auto',
                        position: 'relative'
                    }}
                >
                    Active Deliveries ({activeOrdersList.length})
                    {activeOrdersList.length > 0 && (
                        <span style={{
                            marginLeft: '6px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#10b981',
                            display: 'inline-block'
                        }}></span>
                    )}
                </button>

                <button
                    onClick={() => setFilter('completed')}
                    style={{
                        flex: 1,
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: filter === 'completed' ? '#0f172a' : 'transparent',
                        color: filter === 'completed' ? '#ffffff' : '#64748b',
                        fontWeight: filter === 'completed' ? 700 : 500,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        margin: 0,
                        width: 'auto'
                    }}
                >
                    Delivered ({completedOrdersList.length})
                </button>
            </div>

            {/* ── Orders List ── */}
            {filteredOrders.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '50px 20px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🥡</div>
                    <h3 style={{ color: '#1e293b', fontWeight: 700, margin: '0 0 6px', fontSize: '1.2rem' }}>
                        {filter === 'active' ? 'No active orders in transit' : 'No orders found'}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.92rem', margin: '0 0 20px' }}>
                        {filter === 'active' 
                            ? 'All your past orders have been completed or cancelled.' 
                            : 'Explore our restaurant partners and order your favorite meal!'}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(230, 126, 34, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: 'auto',
                            margin: 0
                        }}
                    >
                        <span>🍔</span> Order Food Now
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '18px' }}>
                    {filteredOrders.map(order => {
                        const theme = getStatusTheme(order.status);
                        const isLive = !['Delivered', 'Rejected'].includes(order.status);
                        const dateFormatted = new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });

                        return (
                            <div
                                key={order.id}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)',
                                    padding: '22px 24px',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Left accent indicator for active orders */}
                                {isLive && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: '4px',
                                        background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)'
                                    }} />
                                )}

                                {/* Top Row: Restaurant info + Status Badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '12px',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.4rem'
                                        }}>
                                            🍽️
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                                                    {order.restaurant_name || 'Restaurant Partner'}
                                                </h3>
                                                <span style={{
                                                    background: '#f1f5f9',
                                                    color: '#475569',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: '6px'
                                                }}>
                                                    #{order.id}
                                                </span>
                                            </div>
                                            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                                                📅 {dateFormatted}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        background: theme.bg,
                                        border: `1px solid ${theme.border}`,
                                        color: theme.color,
                                        fontSize: '0.84rem',
                                        fontWeight: 700
                                    }}>
                                        <span style={{
                                            width: '7px',
                                            height: '7px',
                                            borderRadius: '50%',
                                            background: theme.dot,
                                            boxShadow: isLive ? `0 0 6px ${theme.dot}` : 'none'
                                        }}></span>
                                        <span>{theme.icon} {theme.label}</span>
                                    </div>
                                </div>

                                {/* Items Summary Preview */}
                                {order.items && order.items.length > 0 && (
                                    <div style={{
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        padding: '10px 14px',
                                        marginBottom: '16px',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                            Order Items ({order.items.length})
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {order.items.map((item, idx) => (
                                                <span
                                                    key={item.id || idx}
                                                    style={{
                                                        background: '#ffffff',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '6px',
                                                        padding: '4px 9px',
                                                        fontSize: '0.82rem',
                                                        color: '#334155',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    <strong style={{ color: '#e67e22' }}>{item.quantity}×</strong> {item.item_name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Row: Price + Tracking Action & PDF Invoice */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #f1f5f9',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Total Paid</span>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                            ৳{parseFloat(order.total_price).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Action CTA & Invoice Download */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {/* Review / Rating button for Delivered Orders */}
                                        {order.status === 'Delivered' && (
                                            order.review_rating ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewModalOrder(order)}
                                                    style={{
                                                        background: '#fffbeb',
                                                        border: '1px solid #fef3c7',
                                                        borderRadius: '10px',
                                                        padding: '10px 14px',
                                                        color: '#b45309',
                                                        fontWeight: 700,
                                                        fontSize: '0.86rem',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        width: 'auto',
                                                        margin: 0,
                                                        transition: 'all 0.2s'
                                                    }}
                                                    title="Click to view or update your review"
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef3c7'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; }}
                                                >
                                                    <span style={{ color: '#f59e0b' }}>⭐</span> {order.review_rating}/5 Rated
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewModalOrder(order)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                        border: 'none',
                                                        borderRadius: '10px',
                                                        padding: '10px 16px',
                                                        color: '#ffffff',
                                                        fontWeight: 700,
                                                        fontSize: '0.86rem',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        width: 'auto',
                                                        margin: 0,
                                                        boxShadow: '0 3px 10px rgba(245, 158, 11, 0.35)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 14px rgba(245, 158, 11, 0.45)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(245, 158, 11, 0.35)'; }}
                                                >
                                                    <span>⭐</span> Rate Order
                                                </button>
                                            )
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                generateOrderInvoicePDF(order);
                                                toast.success(`Downloaded Official Invoice for Order #${order.id}! 📄`);
                                            }}
                                            style={{
                                                background: '#ffffff',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '10px',
                                                padding: '10px 15px',
                                                color: '#334155',
                                                fontWeight: 700,
                                                fontSize: '0.86rem',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                width: 'auto',
                                                margin: 0,
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                        >
                                            <span>📄</span> Invoice
                                        </button>

                                        {order.status !== 'Rejected' && (
                                            <Link
                                                to={`/orders/track/${order.id}`}
                                                style={{
                                                    textDecoration: 'none',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    padding: '10px 18px',
                                                    borderRadius: '10px',
                                                    fontWeight: 700,
                                                    fontSize: '0.88rem',
                                                    color: '#ffffff',
                                                    background: isLive
                                                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                                        : '#1e293b',
                                                    boxShadow: isLive
                                                        ? '0 4px 14px rgba(37, 99, 235, 0.28)'
                                                        : '0 2px 6px rgba(0,0,0,0.08)',
                                                    transition: 'all 0.2s',
                                                    boxSizing: 'border-box'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.opacity = '0.92';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.opacity = '1';
                                                    e.currentTarget.style.transform = 'none';
                                                }}
                                            >
                                                {isLive ? (
                                                    <>
                                                        <span>🛵 Live Track</span>
                                                        <span>➔</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>🗺️ View & Replay</span>
                                                        <span>🔁</span>
                                                    </>
                                                )}
                                            </Link>
                                        )}
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}

            {/* Review Submission Modal */}
            {reviewModalOrder && (
                <ReviewModal
                    isOpen={Boolean(reviewModalOrder)}
                    onClose={() => setReviewModalOrder(null)}
                    restaurantId={reviewModalOrder.restaurant}
                    restaurantName={reviewModalOrder.restaurant_name}
                    orderId={reviewModalOrder.id}
                    existingRating={reviewModalOrder.review_rating || 5}
                    existingComment={reviewModalOrder.review_comment || ''}
                    onSuccess={(newReview) => {
                        setOrders(prev => prev.map(o => o.id === reviewModalOrder.id ? {
                            ...o,
                            review_rating: newReview.rating,
                            review_comment: newReview.comment
                        } : o));
                    }}
                />
            )}

        </div>
    );
};

export default CustomerOrders;