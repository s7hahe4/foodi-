import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../api/client';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API}/api/menu/orders/my/`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrders(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const statusColors = {
        Pending:   { color: '#e67e22', bg: '#fef9e7', icon: '⏳' },
        Preparing: { color: '#27ae60', bg: '#eafaf1', icon: '👨‍🍳' },
        Delivered: { color: '#2980b9', bg: '#eaf4fc', icon: '✅' },
        Rejected:  { color: '#c0392b', bg: '#fdedec', icon: '❌' },
    };

    if (loading) return (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <p style={{ fontSize: '2rem' }}>⏳</p>
            <p style={{ color: '#7f8c8d' }}>Loading your orders...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: '720px', margin: '30px auto', padding: '0 20px 60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h2 style={{ margin: '0 0 4px', color: '#2c3e50' }}>📦 My Orders</h2>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>All your past and current orders</p>
                </div>
                <Link to="/" style={{ textDecoration: 'none', color: '#7f8c8d', fontSize: '0.9rem' }}>← Browse Restaurants</Link>
            </div>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '70px 20px', background: '#f8f9fa', borderRadius: '16px', border: '2px dashed #ddd' }}>
                    <p style={{ fontSize: '3rem', margin: '0 0 12px' }}>🛵</p>
                    <h3 style={{ color: '#2c3e50', margin: '0 0 8px' }}>No orders yet</h3>
                    <p style={{ color: '#7f8c8d', margin: '0 0 20px' }}>Browse restaurants and place your first order!</p>
                    <Link to="/" style={{ background: '#e67e22', color: 'white', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                        Explore Restaurants
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {orders.map(order => {
                        const cfg = statusColors[order.status] || statusColors.Pending;
                        const isActive = order.status === 'Pending' || order.status === 'Preparing';
                        return (
                            <div key={order.id} style={{ border: '1px solid #eee', borderRadius: '12px', background: 'white', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#fafbfc', borderBottom: '1px solid #f0f0f0' }}>
                                    <div>
                                        <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>Order #{order.id}</span>
                                        <span style={{ marginLeft: '10px', color: '#95a5a6', fontSize: '0.85rem' }}>
                                            {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' }}>
                                        {cfg.icon} {order.status}
                                    </span>
                                </div>

                                {/* Body */}
                                <div style={{ padding: '15px 20px' }}>
                                    <p style={{ margin: '0 0 10px', fontWeight: '600', color: '#34495e' }}>🏪 {order.restaurant_name}</p>
                                    {order.items && order.items.map(item => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#5d6d7e', padding: '3px 0' }}>
                                            <span>{item.quantity}× {item.item_name}</span>
                                            <span>৳{(parseFloat(item.item_price) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0f0f0', fontWeight: 'bold' }}>
                                        <span>Total</span>
                                        <span style={{ color: '#e67e22' }}>৳{parseFloat(order.total_price).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Track button for active orders */}
                                {isActive && (
                                    <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', background: '#fafbfc' }}>
                                        <Link
                                            to={`/orders/track/${order.id}`}
                                            style={{ display: 'block', textAlign: 'center', background: '#e67e22', color: 'white', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' }}
                                        >
                                            🔴 Track Live →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyOrders;
