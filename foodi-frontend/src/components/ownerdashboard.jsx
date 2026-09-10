import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
import { API } from '../api/client';

const OwnerDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');  // 'pending' | 'history' | 'analytics'
    const [toggling, setToggling] = useState(false);

    const token = localStorage.getItem('access_token');

    const fetchData = async () => {
        try {
            const [resOrders, resRestaurant] = await Promise.all([
                fetch(`${API}/api/menu/orders/manage/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API}/api/restaurants/profile/`, {
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
            const res = await fetch(`${API}/api/menu/orders/manage/${orderId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                // Update the order in-place so UI reacts instantly
                setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
            } else {
                toast.error('Failed to update order status.');
            }
        } catch (err) {
            console.error('Update error:', err);
        }
    };

    // Toggle restaurant open/closed
    const handleToggleStatus = async () => {
        setToggling(true);
        try {
            const res = await fetch(`${API}/api/restaurants/profile/`, {
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

    // ── Analytics & Business Intelligence Computations ──
    const validOrders = orders.filter(o => o.status !== 'Rejected' && o.status !== 'Payment Pending');
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');

    const totalRevenue = validOrders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? (totalRevenue / validOrders.length) : 0;
    const completedRatio = orders.length > 0 
        ? Math.round((deliveredOrders.length / (orders.filter(o => o.status !== 'Payment Pending').length || 1)) * 100) 
        : 0;

    // Daily Revenue Breakdown
    const dailyMap = {};
    orders.forEach(o => {
        if (o.status === 'Rejected' || o.status === 'Payment Pending') return;
        const d = new Date(o.created_at);
        const dateKey = isNaN(d) ? 'Recent' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyMap[dateKey]) {
            dailyMap[dateKey] = { date: dateKey, revenue: 0, orders: 0, rawDate: isNaN(d) ? new Date() : d };
        }
        dailyMap[dateKey].revenue += parseFloat(o.total_price || 0);
        dailyMap[dateKey].orders += 1;
    });

    const revenueTrendData = Object.values(dailyMap)
        .sort((a, b) => a.rawDate - b.rawDate)
        .map(item => ({
            date: item.date,
            revenue: Math.round(item.revenue),
            orders: item.orders
        }));

    // Top Selling Dishes Breakdown
    const itemMap = {};
    validOrders.forEach(o => {
        if (Array.isArray(o.items)) {
            o.items.forEach(it => {
                const name = it.item_name || 'Delicious Item';
                const qty = parseInt(it.quantity || 1, 10);
                const price = parseFloat(it.item_price || 0);
                if (!itemMap[name]) {
                    itemMap[name] = { name, quantity: 0, revenue: 0 };
                }
                itemMap[name].quantity += qty;
                itemMap[name].revenue += (qty * price);
            });
        }
    });

    const topDishesData = Object.values(itemMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const bestSellingItemName = topDishesData.length > 0 ? topDishesData[0].name : 'None yet';

    // Order Status Distribution for Donut Chart
    const statusCounts = {
        Delivered: orders.filter(o => o.status === 'Delivered').length,
        'In Progress': orders.filter(o => ['Preparing', 'Ready', 'Out for Delivery'].includes(o.status)).length,
        Pending: orders.filter(o => o.status === 'Pending').length,
        Rejected: orders.filter(o => o.status === 'Rejected').length,
    };

    const statusColors = {
        Delivered: '#10b981',
        'In Progress': '#3b82f6',
        Pending: '#f59e0b',
        Rejected: '#ef4444'
    };

    const statusPieData = [
        { name: 'Delivered', value: statusCounts.Delivered, color: statusColors.Delivered },
        { name: 'In Progress', value: statusCounts['In Progress'], color: statusColors['In Progress'] },
        { name: 'Pending', value: statusCounts.Pending, color: statusColors.Pending },
        { name: 'Rejected', value: statusCounts.Rejected, color: statusColors.Rejected },
    ].filter(item => item.value > 0);

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
        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 20px 70px' }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2 style={{ margin: '0 0 4px', color: '#2c3e50', fontSize: '1.65rem', fontWeight: 800 }}>
                        🛎️ {restaurant?.name || 'Owner Dashboard'}
                    </h2>
                    <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>
                        Auto-refreshing every 8 seconds &nbsp;•&nbsp;
                        <span style={{ color: activeOrders.length > 0 ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>
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
                <div style={{ background: 'white', border: '1px solid #f0ede6', borderRadius: '16px', padding: '20px 24px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                    <div>
                        <p style={{ margin: '0 0 4px', color: '#7f8c8d', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px' }}>RESTAURANT STATUS</p>
                        <span style={{ fontWeight: 700, fontSize: '1.15rem', color: restaurant.is_open ? '#10b981' : '#ef4444' }}>
                            {restaurant.is_open ? '🟢 Open for Business' : '🔴 Currently Closed'}
                        </span>
                    </div>
                    <button
                        onClick={handleToggleStatus}
                        disabled={toggling}
                        style={{ 
                            background: restaurant.is_open ? '#ef4444' : '#10b981', 
                            color: 'white', 
                            border: 'none', 
                            padding: '11px 24px', 
                            borderRadius: '10px', 
                            cursor: 'pointer', 
                            fontWeight: 700, 
                            fontSize: '0.95rem', 
                            opacity: toggling ? 0.7 : 1,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {toggling ? '...' : (restaurant.is_open ? 'Close Restaurant' : 'Open Restaurant')}
                    </button>
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #eee', paddingBottom: '2px' }}>
                {[
                    ['pending', `🔴 Active Orders (${activeOrders.length})`],
                    ['history', `📋 Order History (${historyOrders.length})`],
                    ['analytics', `📈 Analytics & Reports`]
                ].map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '11px 22px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab ? 700 : 500,
                            color: activeTab === tab ? '#e67e22' : '#64748b',
                            borderBottom: activeTab === tab ? '3px solid #e67e22' : '3px solid transparent',
                            marginBottom: '-4px',
                            transition: 'all 0.2s ease',
                            fontSize: '0.98rem'
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Pending Orders ── */}
            {activeTab === 'pending' && (
                activeOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '14px', border: '2px dashed #cbd5e1' }}>
                        <p style={{ fontSize: '3rem', margin: '0 0 10px' }}>🍽️</p>
                        <h3 style={{ color: '#2c3e50', margin: '0 0 8px', fontWeight: 700 }}>No Active Orders</h3>
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
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '14px', border: '2px dashed #cbd5e1' }}>
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

            {/* ── Analytics & Business Intelligence Dashboard ── */}
            {activeTab === 'analytics' && (
                <div>
                    {/* KPI Metric Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                        gap: '18px',
                        marginBottom: '30px'
                    }}>
                        <KpiCard
                            icon="💰"
                            title="Total Revenue"
                            value={`৳${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            subtitle={`${validOrders.length} processed orders`}
                            accentColor="#e67e22"
                        />
                        <KpiCard
                            icon="📦"
                            title="Total Orders"
                            value={orders.length}
                            subtitle={`${completedRatio}% completion rate`}
                            accentColor="#3b82f6"
                        />
                        <KpiCard
                            icon="🏷️"
                            title="Avg. Order Value"
                            value={`৳${avgOrderValue.toFixed(2)}`}
                            subtitle="Per customer checkout"
                            accentColor="#10b981"
                        />
                        <KpiCard
                            icon="🏆"
                            title="Best Seller"
                            value={bestSellingItemName}
                            subtitle={topDishesData.length > 0 ? `${topDishesData[0].quantity} orders sold` : 'No sales yet'}
                            accentColor="#8b5cf6"
                        />
                    </div>

                    {/* Chart 1: Revenue Over Time Area Chart */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px 28px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        border: '1px solid #f0ede6',
                        marginBottom: '30px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: 700 }}>
                                    📈 Revenue & Order Trends
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                                    Daily sales performance and incoming order volumes
                                </p>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, background: '#fff7ed', color: '#c2410c', padding: '5px 12px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
                                Live Metrics
                            </span>
                        </div>

                        {revenueTrendData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                No sales data recorded yet to graph.
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#e67e22" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#e67e22" stopOpacity={0.0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} />
                                        <Tooltip
                                            formatter={(value, name) => [name === 'revenue' ? `৳${value.toLocaleString()}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '0.85rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                            itemStyle={{ color: '#fed7aa' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#e67e22" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Charts Grid: Top Selling Dishes + Status Breakdown */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                        gap: '24px'
                    }}>
                        {/* Top 5 Dishes Bar Chart */}
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            border: '1px solid #f0ede6'
                        }}>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#1e293b', fontWeight: 700 }}>
                                🍔 Top Selling Dishes
                            </h3>
                            <p style={{ margin: '0 0 20px', fontSize: '0.86rem', color: '#64748b' }}>
                                Customer favorites ranked by quantity ordered
                            </p>

                            {topDishesData.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                    No item sales recorded yet.
                                </div>
                            ) : (
                                <div style={{ width: '100%', height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topDishesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                            <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} tickLine={false} width={100} />
                                            <Tooltip
                                                formatter={(val) => [`${val} orders`, 'Units Sold']}
                                                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '0.85rem' }}
                                            />
                                            <Bar dataKey="quantity" fill="#f97316" radius={[0, 8, 8, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Order Status Distribution Donut Chart */}
                        <div style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                            border: '1px solid #f0ede6'
                        }}>
                            <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#1e293b', fontWeight: 700 }}>
                                🍩 Fulfillment Breakdown
                            </h3>
                            <p style={{ margin: '0 0 20px', fontSize: '0.86rem', color: '#64748b' }}>
                                Distribution of all incoming customer orders
                            </p>

                            {statusPieData.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                                    No order history available.
                                </div>
                            ) : (
                                <div>
                                    <div style={{ width: '100%', height: 200 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusPieData}
                                                    innerRadius={55}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {statusPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(val, name) => [`${val} orders`, name]}
                                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '0.85rem' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        {statusPieData.map((s, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569' }}>
                                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color }}></span>
                                                <span>{s.name}: <strong>{s.value}</strong></span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// ── Sub-component: KPI Metric Card ──────────────────────────────────────────
const KpiCard = ({ icon, title, value, subtitle, accentColor }) => (
    <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
        border: '1px solid #f0ede6',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transition: 'transform 0.2s ease',
    }}>
        <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: `${accentColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            flexShrink: 0
        }}>
            {icon}
        </div>
        <div>
            <p style={{ margin: '0 0 4px', fontSize: '0.84rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {title}
            </p>
            <h4 style={{ margin: '0 0 2px', fontSize: '1.45rem', color: '#0f172a', fontWeight: 800 }}>
                {value}
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {subtitle}
            </p>
        </div>
    </div>
);

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