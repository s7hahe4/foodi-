import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CustomerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const token = localStorage.getItem('access_token');

                console.log("Fetching orders with token:", token ? "Token exists" : "No token!");

                const res = await fetch('http://127.0.0.1:8000/api/menu/orders/my-orders/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log("Response status from Django:", res.status);

                if (res.ok) {
                    const data = await res.json();
                    console.log("Raw Order Data from Database:", data); // <-- The Detective Log!

                    // Safely handle arrays or paginated data
                    const parsedOrders = Array.isArray(data) ? data : (data.results || []);
                    setOrders(parsedOrders);
                } else {
                    console.error("Failed to fetch. Server responded with:", res.status);
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
        // We only want to establish websockets for active orders
        const activeOrders = orders.filter(o => !['Delivered', 'Rejected'].includes(o.status));
        const sockets = [];

        activeOrders.forEach(order => {
            const ws = new WebSocket(`ws://127.0.0.1:8000/ws/orders/track/${order.id}/`);
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'order_status_update') {
                    // Update this specific order in the state instantly!
                    setOrders(prevOrders => 
                        prevOrders.map(o => 
                            o.id === order.id ? { ...o, status: data.status } : o
                        )
                    );
                }
            };

            sockets.push(ws);
        });

        // Cleanup on unmount
        return () => {
            sockets.forEach(ws => ws.close());
        };
    }, [orders.length]); // Re-run if a new order is placed

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading your orders...</div>;

    return (
        <div style={{ padding: '20px', paddingBottom: '80px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>My Orders 🧾</h2>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
                    <h3 style={{ color: '#7f8c8d' }}>You haven't ordered anything yet!</h3>
                    <p style={{ color: '#95a5a6', fontSize: '0.9rem' }}>Go to the Home feed and add some delicious food to your cart.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {orders.map(order => (
                        <div key={order.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #f1f2f6' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <strong style={{ fontSize: '1.1rem', color: '#2c3e50' }}>Order #{order.id}</strong>
                                <span style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '1.2rem' }}>৳{order.total_price}</span>
                            </div>

                            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
                                Placed on: {new Date(order.created_at).toLocaleString()}
                            </p>

                            {/* Status Badge */}
                            <div style={{ marginBottom: '15px' }}>
                                <span style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: 'bold',
                                    background: order.status === 'Pending' ? '#fdebd0' :
                                        order.status === 'Preparing' ? '#d5f5e3' :
                                            order.status === 'Delivered' ? '#d6eaf8' : '#fadbd8',
                                    color: order.status === 'Pending' ? '#d35400' :
                                        order.status === 'Preparing' ? '#27ae60' :
                                            order.status === 'Delivered' ? '#2980b9' : '#c0392b'
                                }}>
                                    {order.status}
                                </span>
                            </div>

                            {/* Live Tracker Link */}
                            {order.status !== 'Delivered' && order.status !== 'Rejected' && (
                                <Link
                                    to={`/orders/track/${order.id}`}
                                    style={{ display: 'block', width: '100%', padding: '10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}
                                >
                                    Live Track Order 📍
                                </Link>
                            )}

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerOrders;