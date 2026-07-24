import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const OwnerDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');  // 'pending' | 'history'
    const [toggling, setToggling] = useState(false);

    const token = localStorage.getItem('access_token');

    const fetchData = async () => {
        try {
            const [resOrders, resRestaurant] = await Promise.all([
                fetch('http://127.0.0.1:8000/api/menu/orders/manage/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://127.0.0.1:8000/api/restaurants/profile/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (resOrders.ok) {
                const data = await resOrders.json();
                setOrders(Array.isArray(data) ? data : []);
            }
            if (resRestaurant.ok) {
                setRestaurant(await resRestaurant.json());
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 8 seconds to catch new orders
        const interval = setInterval(fetchData, 8000);
        return () => clearInterval(interval);
    }, []);

    // Accept or reject an order
    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/menu/orders/manage/${orderId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                // Update the order in-place so UI reacts instantly
                setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
            } else {
                alert('Failed to update order status.');
            }
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    // Toggle restaurant open/closed
    const handleToggleStatus = async () => {
        setToggling(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/restaurants/profile/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ is_open: !restaurant.is_open })
            });
            if (res.ok) setRestaurant(await res.json());
        } catch (err) {
            console.error('Toggle error:', err);
        } finally {
            setToggling(false);
        }
    };

    // Active orders: waiting for action from owner
    const activeOrders  = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing');
    // History: orders that are done or out for delivery
    const historyOrders = orders.filter(o => o.status === 'Ready' || o.status === 'Out for Delivery' || o.status === 'Delivered' || o.status === 'Rejected');

    const statusStyle = {
        Pending:            { color: '#e67e22', bg: '#fef9e7' },
        Preparing:          { color: '#27ae60', bg: '#eafaf1' },
        Ready:              { color: '#2ecc71', bg: '#e8f8f5' },
        'Out for Delivery': { color: '#3498db', bg: '#ebf5fb' },
        Rejected:           { color: '#c0392b', bg: '#fdedec' },
        Delivered:          { color: '#2980b9', bg: '#eaf4fc' },
    };

    if (loading) return (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <p style={{ fontSize: '2rem' }}>⏳</p>
            <p style={{ color: '#7f8c8d' }}>Loading dashboard...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 20px 60px' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2 style={{ margin: '0 0 4px', color: '#2c3e50' }}>
                        🛎️ {restaurant?.name || 'Owner Dashboard'}
                    </h2>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>
                        Auto-refreshing every 8 seconds &nbsp;•&nbsp;
                        <span style={{ color: activeOrders.length > 0 ? '#e74c3c' : '#27ae60' }}>
                            {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}
                        </span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link to="/owner-dashboard/offers" style={actionBtn('#e67e22')}>🏷️ Manage Offers</Link>
                    <Link to="/owner-dashboard/menu" style={actionBtn('#34495e')}>🍔 Manage Menu</Link>
                    <Link to="/owner-dashboard/setup" style={actionBtn('#7f8c8d')}>⚙️ Edit Profile</Link>
                </div>
            </div>

            {/* ── Restaurant Status Card ── */}
            {restaurant && (
                <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div>
                        <p style={{ margin: '0 0 4px', color: '#7f8c8d', fontSize: '0.85rem' }}>RESTAURANT STATUS</p>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: restaurant.is_open ? '#27ae60' : '#e74c3c' }}>
                            {restaurant.is_open ? '🟢 Open for Business' : '🔴 Currently Closed'}
                        </span>
                    </div>
                    <button
                        onClick={handleToggleStatus}
                        disabled={toggling}
                        style={{ background: restaurant.is_open ? '#e74c3c' : '#27ae60', color: 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', opacity: toggling ? 0.7 : 1 }}
                    >
                        {toggling ? '...' : (restaurant.is_open ? 'Close Restaurant' : 'Open Restaurant')}
                    </button>
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
                {[['pending', `🔴 Active Orders (${activeOrders.length})`], ['history', `📋 Order History (${historyOrders.length})`]].map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: activeTab === tab ? 'bold' : 'normal', color: activeTab === tab ? '#e67e22' : '#7f8c8d', borderBottom: activeTab === tab ? '3px solid #e67e22' : '3px solid transparent', marginBottom: '-2px', transition: '0.2s', fontSize: '0.95rem' }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Pending Orders ── */}
            {activeTab === 'pending' && (
                activeOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '12px', border: '2px dashed #ddd' }}>
                        <p style={{ fontSize: '3rem', margin: '0 0 10px' }}>🍽️</p>
                        <h3 style={{ color: '#2c3e50', margin: '0 0 8px' }}>No Active Orders</h3>
                        <p style={{ color: '#7f8c8d', margin: 0 }}>Sit tight — orders will appear here automatically.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {activeOrders.map(order => (
                            <OrderCard key={order.id} order={order} onUpdate={handleUpdateStatus} statusStyle={statusStyle} showActions />
                        ))}
                    </div>
                )
            )}

            {/* ── Order History ── */}
            {activeTab === 'history' && (
                historyOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '12px', border: '2px dashed #ddd' }}>
                        <p style={{ color: '#7f8c8d' }}>No completed orders yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {historyOrders.map(order => (
                            <OrderCard key={order.id} order={order} onUpdate={handleUpdateStatus} statusStyle={statusStyle} showActions={false} />
                        ))}
                    </div>
                )
            )}

        </div>
    );
};

// ── Sub-component: Order Card ───────────────────────────────────────────────
const OrderCard = ({ order, onUpdate, statusStyle, showActions }) => {
    const s = statusStyle[order.status] || statusStyle.Pending;
    return (
        <div style={{ border: '1px solid #eee', borderRadius: '12px', background: 'white', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafbfc' }}>
                <div>
                    <span style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1.05rem' }}>Order #{order.id}</span>
                    <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#95a5a6' }}>
                        {new Date(order.created_at).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                </div>
                <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem' }}>
                    {order.status}
                </span>
            </div>

            {/* Card Body */}
            <div style={{ padding: '15px 20px' }}>
                <p style={{ margin: '0 0 12px', color: '#5d6d7e', fontSize: '0.9rem' }}>
                    👤 <strong>{order.customer_username}</strong>
                </p>

                {/* Items list */}
                {order.items && order.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '4px 0', color: '#34495e' }}>
                        <span>{item.quantity}× {item.item_name}</span>
                        <span style={{ color: '#e67e22' }}>৳{(parseFloat(item.item_price) * item.quantity).toFixed(2)}</span>
                    </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #f0f0f0', fontWeight: 'bold', fontSize: '1.05rem' }}>
                    <span>Total</span>
                    <span style={{ color: '#e67e22' }}>৳{parseFloat(order.total_price).toFixed(2)}</span>
                </div>
            </div>

            {/* Action Buttons */}
            {/* Pending → Owner can Accept or Reject */}
            {showActions && order.status === 'Pending' && (
                <div style={{ display: 'flex', gap: '12px', padding: '15px 20px', borderTop: '1px solid #f0f0f0', background: '#fafbfc' }}>
                    <button
                        onClick={() => onUpdate(order.id, 'Preparing')}
                        style={{ flex: 1, padding: '12px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                        ✅ Accept & Start Preparing
                    </button>
                    <button
                        onClick={() => onUpdate(order.id, 'Rejected')}
                        style={{ flex: 1, padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                        ❌ Reject Order
                    </button>
                </div>
            )}
            {/* Preparing → Owner marks Ready to signal riders for pickup */}
            {showActions && order.status === 'Preparing' && (
                <div style={{ padding: '15px 20px', borderTop: '1px solid #f0f0f0', background: '#fafbfc' }}>
                    <button
                        onClick={() => onUpdate(order.id, 'Ready')}
                        style={{ width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
                    >
                        🛵 Food Ready — Notify Rider
                    </button>
                </div>
            )}
        </div>
    );
};

const actionBtn = (bg) => ({
    background: bg, color: 'white', padding: '9px 18px',
    textDecoration: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem'
});

export default OwnerDashboard;