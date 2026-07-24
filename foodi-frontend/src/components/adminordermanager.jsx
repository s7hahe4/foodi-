import { useState, useEffect } from 'react';

const AdminOrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null); // <--- New Error State

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = localStorage.getItem('access_token');
                console.log("Admin Token:", token ? "Exists" : "Missing!");

                const res = await fetch('http://127.0.0.1:8000/api/admin/orders/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log("Django Response Status:", res.status);

                if (res.ok) {
                    const data = await res.json();
                    console.log("Raw Admin Orders:", data);
                    setOrders(data.results || data);
                } else {
                    // IF DJANGO BLOCKS US, CATCH THE ERROR!
                    const errorData = await res.text();
                    console.error("Django blocked the request:", errorData);
                    setErrorMsg(`Error ${res.status}: ${errorData}`);
                }
            } catch (error) {
                console.error("Network error:", error);
                setErrorMsg("Network error. Is the Django server running?");
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) return <div>Loading active orders...</div>;

    return (
        <div style={{ padding: '20px', background: 'white', borderRadius: '10px' }}>
            <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>Ongoing Platform Orders 🧾</h2>

            {/* Show the loud error if there is one! */}
            {errorMsg && (
                <div style={{ padding: '15px', background: '#fadbd8', color: '#c0392b', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
                    🚨 Backend Error: {errorMsg}
                </div>
            )}

            {orders.length === 0 && !errorMsg ? (
                <p style={{ color: '#7f8c8d' }}>There are no active orders on the platform right now.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '10px' }}>Order ID</th>
                            <th style={{ padding: '10px' }}>Customer Email</th>
                            <th style={{ padding: '10px' }}>Restaurant</th>
                            <th style={{ padding: '10px' }}>Total Price</th>
                            <th style={{ padding: '10px' }}>Status</th>
                            <th style={{ padding: '10px' }}>Time Placed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>#{order.id}</td>
                                <td style={{ padding: '10px' }}>{order.customer_email}</td>
                                <td style={{ padding: '10px' }}>{order.restaurant_name}</td>
                                <td style={{ padding: '10px', color: '#e67e22', fontWeight: 'bold' }}>৳{order.total_price}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '15px',
                                        fontSize: '0.85rem',
                                        background: order.status === 'Pending' ? '#fdebd0' : '#d5f5e3',
                                        color: order.status === 'Pending' ? '#d35400' : '#27ae60'
                                    }}>
                                        {order.status}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', fontSize: '0.9rem', color: '#7f8c8d' }}>
                                    {new Date(order.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminOrderManager;