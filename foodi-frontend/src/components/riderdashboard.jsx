import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const restaurantIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const riderIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Helper component to auto-fit map bounds without jitter
const FitBounds = ({ bounds }) => {
    const map = useMap();
    const boundsKey = bounds ? JSON.stringify(bounds) : '';
    useEffect(() => {
        if (bounds && bounds.length === 2 && bounds[0] && bounds[1]) {
            map.fitBounds(bounds, { padding: [30, 30] });
        }
    }, [map, boundsKey]);
    return null;
};

// Sub-component for individual Order Card
const RiderOrderCard = ({ order, activeTab, onAccept, onComplete, onRefresh, riderLocation }) => {
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const wsRef = useRef(null);

    const hasMapCoords = order.restaurant_lat && order.restaurant_lng && order.delivery_lat && order.delivery_lng;
    const restPos = [parseFloat(order.restaurant_lat || 0), parseFloat(order.restaurant_lng || 0)];
    const custPos = [parseFloat(order.delivery_lat || 0), parseFloat(order.delivery_lng || 0)];
    
    // Dynamic map bounds: prioritizes rider-to-customer path when live GPS is active
    const mapBounds = riderLocation 
        ? [riderLocation, custPos] 
        : (hasMapCoords ? [restPos, custPos] : null);

    // Live WebSockets synchronization for active orders
    useEffect(() => {
        if (activeTab !== 'mine') return;

        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/orders/track/${order.id}/`);
        wsRef.current = ws;

        ws.onopen = () => {
            if (riderLocation) {
                ws.send(JSON.stringify({
                    type: 'rider_location_update',
                    rider_lat: riderLocation[0],
                    rider_lng: riderLocation[1]
                }));
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'order_status_update') {
                onRefresh();
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [order.id, activeTab, onRefresh]);

    // Send location updates over WebSocket when riderLocation updates
    useEffect(() => {
        if (activeTab !== 'mine' || !riderLocation) return;

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'rider_location_update',
                rider_lat: riderLocation[0],
                rider_lng: riderLocation[1]
            }));
        }
    }, [riderLocation, activeTab]);

    // Fetch driving route coordinates and metrics from OSRM Router API
    useEffect(() => {
        if (!hasMapCoords) return;

        // Draw path from Rider current position (if active) to customer, else fallback to Restaurant-to-Customer
        const startLng = riderLocation ? riderLocation[1] : order.restaurant_lng;
        const startLat = riderLocation ? riderLocation[0] : order.restaurant_lat;

        const fetchRoute = async () => {
            setRouteLoading(true);
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${order.delivery_lng},${order.delivery_lat}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const distanceKm = (route.distance / 1000).toFixed(1);
                    const durationMin = Math.ceil(route.duration / 60);

                    setRouteInfo({ distanceKm, durationMin });

                    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
                    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                    setRouteCoords(coords);
                }
            } catch (err) {
                console.error("OSRM route error:", err);
            } finally {
                setRouteLoading(false);
            }
        };

        fetchRoute();
    }, [order.id, order.restaurant_lat, order.restaurant_lng, order.delivery_lat, order.delivery_lng, riderLocation]);

    return (
        <div 
            style={{ 
                border: '1px solid #eef2f3', 
                borderRadius: '16px', 
                padding: '24px', 
                background: 'white', 
                boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.04)', 
                transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                textAlign: 'left'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: '#95a5a6', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DELIVERY OPPORTUNITY</span>
                        <h3 style={{ margin: '2px 0 0 0', color: '#2c3e50', fontSize: '1.25rem', fontWeight: 'bold' }}>Order #{order.id}</h3>
                    </div>
                    <span style={{ background: order.status === 'Ready' ? '#2ecc71' : '#3498db', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {order.status}
                    </span>
                </div>

                {/* Pickup and Destination Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', background: '#f8f9fa', padding: '12px 16px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>🏭</span>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#95a5a6', fontWeight: '600', textTransform: 'uppercase' }}>PICKUP FROM</div>
                            <div style={{ fontSize: '0.9rem', color: '#2c3e50', fontWeight: 'bold' }}>{order.restaurant_name}</div>
                        </div>
                    </div>
                    <div style={{ height: '1px', background: '#eef2f3', margin: '2px 0' }} />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>👤</span>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#95a5a6', fontWeight: '600', textTransform: 'uppercase' }}>DELIVER TO</div>
                            <div style={{ fontSize: '0.9rem', color: '#2c3e50', fontWeight: 'bold' }}>{order.customer_username}</div>
                        </div>
                    </div>
                </div>

                {/* Pricing summary */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '500' }}>Estimated Payout</span>
                    <span style={{ fontSize: '1.4rem', color: '#27ae60', fontWeight: '800' }}>৳{order.total_price}</span>
                </div>

                {/* Map Display */}
                <div style={{ margin: '15px 0', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eef2f3', position: 'relative' }}>
                    {hasMapCoords ? (
                        <MapContainer center={restPos} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <FitBounds bounds={mapBounds} />
                            
                            {/* Restaurant Marker */}
                            <Marker position={restPos} icon={restaurantIcon}>
                                <Popup>Pickup: {order.restaurant_name}</Popup>
                            </Marker>
                            
                            {/* Customer Marker */}
                            <Marker position={custPos} icon={customerIcon}>
                                <Popup>Drop-off: {order.customer_username}</Popup>
                            </Marker>

                            {/* Live Rider Marker */}
                            {riderLocation && (
                                <Marker position={riderLocation} icon={riderIcon}>
                                    <Popup>Your Live Location</Popup>
                                </Marker>
                            )}

                            {routeCoords.length > 0 && (
                                <Polyline positions={routeCoords} color="#3498db" weight={4} opacity={0.8} />
                            )}
                        </MapContainer>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#eee', color: '#aaa' }}>
                            No GPS data available
                        </div>
                    )}

                    {/* Route Details Overlay */}
                    {routeInfo && (
                        <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            fontSize: '0.75rem',
                            display: 'flex',
                            gap: '10px',
                            fontWeight: 'bold',
                            color: '#2c3e50'
                        }}>
                            <span>📍 {routeInfo.distanceKm} km</span>
                            <span style={{ color: '#7f8c8d' }}>|</span>
                            <span>⏱️ ~{routeInfo.durationMin} min</span>
                        </div>
                    )}

                    {routeLoading && (
                        <div style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px',
                            zIndex: 1000, fontSize: '0.7rem', fontWeight: 'bold', color: '#3498db'
                        }}>
                            Loading Route...
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            {activeTab === 'available' ? (
                <button 
                    onClick={() => onAccept(order.id)}
                    style={{ 
                        width: '100%', 
                        padding: '14px', 
                        background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '10px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(230, 126, 34, 0.2)',
                        transition: 'all 0.2s ease',
                        fontSize: '0.95rem',
                        marginTop: '10px'
                    }}
                    onMouseEnter={(e) => { e.target.style.boxShadow = '0 6px 14px rgba(230, 126, 34, 0.3)'; e.target.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.target.style.boxShadow = '0 4px 10px rgba(230, 126, 34, 0.2)'; e.target.style.transform = 'translateY(0)'; }}
                >
                    🛵 Accept & Pickup
                </button>
            ) : (
                <button 
                    onClick={() => onComplete(order.id)}
                    style={{ 
                        width: '100%', 
                        padding: '14px', 
                        background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '10px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(46, 204, 113, 0.2)',
                        transition: 'all 0.2s ease',
                        fontSize: '0.95rem',
                        marginTop: '10px'
                    }}
                    onMouseEnter={(e) => { e.target.style.boxShadow = '0 6px 14px rgba(46, 204, 113, 0.3)'; e.target.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.target.style.boxShadow = '0 4px 10px rgba(46, 204, 113, 0.2)'; e.target.style.transform = 'translateY(0)'; }}
                >
                    ✅ Mark as Delivered
                </button>
            )}
        </div>
    );
};

// Main Rider Dashboard Component
const RiderDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('available');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [riderLocation, setRiderLocation] = useState(null);

    const fetchOrders = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
            return;
        }

        const endpoint = activeTab === 'available' 
            ? 'http://127.0.0.1:8000/api/menu/orders/rider/available/' 
            : 'http://127.0.0.1:8000/api/menu/orders/rider/my-deliveries/';

        try {
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            } else if (res.status === 401 || res.status === 403) {
                navigate('/login');
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    // Watch browser Geolocation at the parent level (single device thread)
    useEffect(() => {
        if (activeTab !== 'mine') {
            setRiderLocation(null);
            return;
        }

        // Get initial location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setRiderLocation([position.coords.latitude, position.coords.longitude]);
            },
            (err) => console.warn("Initial location error:", err),
            { enableHighAccuracy: true }
        );

        // Continuous watch position setup
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setRiderLocation([position.coords.latitude, position.coords.longitude]);
            },
            (err) => console.error("Watch location error:", err),
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0
            }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [activeTab]);

    // Poll orders list dynamically every 8 seconds for a real-time experience
    useEffect(() => {
        setLoading(true);
        fetchOrders();

        const interval = setInterval(fetchOrders, 8000);
        return () => clearInterval(interval);
    }, [activeTab]);

    const handleAcceptOrder = async (orderId) => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/menu/orders/rider/accept/${orderId}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Order Accepted! Drive safe.");
                fetchOrders();
            } else {
                alert("Failed to accept order. Someone else might have taken it!");
            }
        } catch (err) {
            console.error("Error accepting order", err);
        }
    };

    const handleCompleteDelivery = async (orderId) => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/menu/orders/rider/complete/${orderId}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Delivery Completed! Great job.");
                fetchOrders();
            } else {
                alert("Failed to complete delivery.");
            }
        } catch (err) {
            console.error("Error completing delivery", err);
        }
    };

    return (
        <div style={{ padding: '40px 20px 80px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #e5e4e7', paddingBottom: '15px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    🛵 Rider Portal
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/rider-dashboard/account" style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'linear-gradient(135deg, #e67e22, #d35400)',
                        color: 'white', padding: '8px 16px', borderRadius: 20,
                        textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem',
                        boxShadow: '0 3px 10px rgba(230,126,34,0.3)',
                    }}>
                        👤 My Account
                    </Link>
                    <div style={{ fontSize: '0.9rem', color: '#7f8c8d', fontWeight: '600', background: '#ecf0f1', padding: '6px 12px', borderRadius: '15px' }}>
                        Active Duty
                    </div>
                </div>
            </div>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
                <button 
                    onClick={() => setActiveTab('available')}
                    style={tabStyle(activeTab === 'available')}
                >
                    Available Deliveries ({activeTab === 'available' ? orders.length : '?'})
                </button>
                <button 
                    onClick={() => setActiveTab('mine')}
                    style={tabStyle(activeTab === 'mine')}
                >
                    My Active Deliveries ({activeTab === 'mine' ? orders.length : '?'})
                </button>
            </div>

            {loading && orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <p style={{ fontSize: '2rem' }}>⏳</p>
                    <p style={{ color: '#7f8c8d' }}>Loading dashboard...</p>
                </div>
            ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', background: '#f8f9fa', borderRadius: '16px', border: '2px dashed #e2e8f0', color: '#7f8c8d' }}>
                    <p style={{ fontSize: '3rem', margin: '0 0 15px 0' }}>📦</p>
                    <h3 style={{ margin: '0 0 8px 0', color: '#475569' }}>
                        {activeTab === 'available' ? 'No deliveries waiting for pickup' : 'You have no active deliveries'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>
                        {activeTab === 'available' ? 'New orders will appear here automatically when prepared.' : 'Choose a delivery from the available tab to get started.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '25px' }}>
                    {orders.map(order => (
                        <RiderOrderCard 
                            key={order.id} 
                            order={order} 
                            activeTab={activeTab} 
                            onAccept={handleAcceptOrder} 
                            onComplete={handleCompleteDelivery} 
                            onRefresh={fetchOrders}
                            riderLocation={riderLocation}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const tabStyle = (isActive) => ({
    padding: '12px 24px',
    background: isActive ? 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)' : '#f5f0e8',
    color: isActive ? 'white' : '#7f8c8d',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: isActive ? '0 4px 10px rgba(230, 126, 34, 0.2)' : 'none',
    transition: 'all 0.3s ease',
    fontSize: '0.95rem'
});

export default RiderDashboard;
