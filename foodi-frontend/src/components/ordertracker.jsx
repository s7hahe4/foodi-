import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
});

// Custom icons for restaurant, delivery, and rider
const restaurantIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const riderIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const STATUS_STEPS = ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];

// Component to auto-fit map bounds
const FitBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length === 2 && bounds[0] && bounds[1]) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, bounds]);
    return null;
};

const OrderTracker = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [riderLat, setRiderLat] = useState(null);
    const [riderLng, setRiderLng] = useState(null);

    // Route state
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null); // { distanceKm, durationMin }
    const [routeLoading, setRouteLoading] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/menu/orders/track/${orderId}/`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);
                    if (data.rider_lat) setRiderLat(parseFloat(data.rider_lat));
                    if (data.rider_lng) setRiderLng(parseFloat(data.rider_lng));
                }
            } catch (err) {
                console.error('Track error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();

        // ⚡ REAL-TIME WEBSOCKET CONNECTION
        const ws = new WebSocket(`ws://127.0.0.1:8000/ws/orders/track/${orderId}/`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'order_status_update') {
                setOrder(prev => ({ ...prev, status: data.status }));
            } else if (data.type === 'rider_location_update') {
                setRiderLat(parseFloat(data.rider_lat));
                setRiderLng(parseFloat(data.rider_lng));
            }
        };

        return () => {
            ws.close();
        };
    }, [orderId]);

    // Fetch OSRM route when order data is loaded or rider position updates
    useEffect(() => {
        if (!order || !order.delivery_lat || !order.restaurant_lat) return;

        const startLng = riderLng !== null ? riderLng : order.restaurant_lng;
        const startLat = riderLat !== null ? riderLat : order.restaurant_lat;

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
    }, [order?.id, riderLat, riderLng]);

    if (loading) return (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <p style={{ fontSize: '2rem' }}>⏳</p>
            <p style={{ color: '#7f8c8d' }}>Loading your order...</p>
        </div>
    );

    if (!order) return (
        <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <p>Order not found.</p>
            <Link to="/">← Back to Home</Link>
        </div>
    );

    const isRejected = order.status === 'Rejected';
    const currentStep = STATUS_STEPS.indexOf(order.status);

    const statusConfig = {
        Pending:            { icon: '⏳', color: '#e67e22', bg: '#fef9e7', message: 'Waiting for the restaurant to accept your order...' },
        Preparing:          { icon: '👨‍🍳', color: '#27ae60', bg: '#eafaf1', message: 'Great news! The kitchen is preparing your meal.' },
        Ready:              { icon: '✅', color: '#2ecc71', bg: '#e8f8f5', message: 'Your food is ready! Waiting for a rider to pick it up.' },
        'Out for Delivery': { icon: '🛵', color: '#3498db', bg: '#ebf5fb', message: 'Your order is on its way! The rider is coming.' },
        Delivered:          { icon: '🎉', color: '#2980b9', bg: '#eaf4fc', message: 'Your food has been delivered. Enjoy your meal!' },
        Rejected:           { icon: '❌', color: '#c0392b', bg: '#fdedec', message: 'The restaurant could not fulfill this order right now.' },
    };
    const cfg = statusConfig[order.status] || statusConfig.Pending;

    const hasMap = order.delivery_lat && order.restaurant_lat;
    const hasRider = riderLat !== null && riderLng !== null;
    const mapBounds = hasRider 
        ? [
            [parseFloat(riderLat), parseFloat(riderLng)],
            [parseFloat(order.delivery_lat), parseFloat(order.delivery_lng)]
          ]
        : (hasMap ? [
            [parseFloat(order.restaurant_lat), parseFloat(order.restaurant_lng)],
            [parseFloat(order.delivery_lat), parseFloat(order.delivery_lng)]
          ] : null);

    return (
        <div style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px 60px' }}>

            {/* ── Header ── */}
            <Link to="/" style={{ textDecoration: 'none', color: '#7f8c8d', fontSize: '0.9rem' }}>← Back to Home</Link>
            <h2 style={{ color: '#2c3e50', margin: '15px 0 5px' }}>Order #{order.id}</h2>
            <p style={{ color: '#95a5a6', margin: '0 0 30px' }}>From <strong>{order.restaurant_name}</strong></p>

            {/* ── Status Card ── */}
            <div style={{ background: cfg.bg, border: `2px solid ${cfg.color}`, borderRadius: '16px', padding: '30px', textAlign: 'center', marginBottom: '30px' }}>
                <p style={{ fontSize: '3.5rem', margin: '0 0 10px' }}>{cfg.icon}</p>
                <h2 style={{ color: cfg.color, margin: '0 0 8px', fontSize: '1.8rem' }}>{order.status}</h2>
                <p style={{ color: '#5d6d7e', margin: 0, fontSize: '1rem' }}>{cfg.message}</p>
            </div>

            {/* ── Progress Bar (hidden if rejected) ── */}
            {!isRejected && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        {/* Progress line */}
                        <div style={{ position: 'absolute', top: '18px', left: '5%', right: '5%', height: '4px', background: '#eee', zIndex: 0 }} />
                        <div style={{ position: 'absolute', top: '18px', left: '5%', height: '4px', background: '#27ae60', zIndex: 1, width: currentStep < 0 ? '0%' : `${(currentStep / (STATUS_STEPS.length - 1)) * 90}%`, transition: 'width 0.5s ease' }} />

                        {STATUS_STEPS.map((step, i) => {
                            const done = i <= currentStep;
                            return (
                                <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: done ? '#27ae60' : '#eee', color: done ? 'white' : '#bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', border: `3px solid ${done ? '#27ae60' : '#ddd'}`, transition: '0.3s' }}>
                                        {done ? '✓' : i + 1}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', marginTop: '6px', color: done ? '#27ae60' : '#bdc3c7', fontWeight: done ? '600' : 'normal', textAlign: 'center' }}>{step}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Order Items ── */}
            <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ background: '#2c3e50', color: 'white', padding: '12px 20px' }}>
                    <h4 style={{ margin: 0 }}>📋 Order Details</h4>
                </div>
                <div style={{ padding: '20px' }}>
                    {order.items && order.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ color: '#2c3e50' }}>{item.quantity}× {item.item_name}</span>
                            <span style={{ color: '#e67e22', fontWeight: '600' }}>৳{(parseFloat(item.item_price) * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    
                    {/* Delivery fee line */}
                    {parseFloat(order.delivery_fee) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5', color: '#636e72' }}>
                            <span>🛵 Delivery Fee {routeInfo && <span style={{ fontSize: '0.8rem' }}>({routeInfo.distanceKm} km)</span>}</span>
                            <span style={{ fontWeight: '600' }}>৳{parseFloat(order.delivery_fee).toFixed(2)}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #eee', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        <span>Total Paid</span>
                        <span style={{ color: '#e67e22' }}>৳{parseFloat(order.total_price).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* ── Live Tracking Map with Route ── */}
            {hasMap && (
                <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                    <div style={{ background: '#34495e', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>🗺️ Live Delivery Map</h4>
                        {routeInfo && (
                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
                                <span>📍 {routeInfo.distanceKm} km</span>
                                <span>⏱️ ~{routeInfo.durationMin} min</span>
                            </div>
                        )}
                    </div>
                    <div style={{ height: '350px', width: '100%', position: 'relative' }}>
                        <MapContainer 
                            center={[parseFloat(order.restaurant_lat), parseFloat(order.restaurant_lng)]}
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                        >
                            <TileLayer 
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                            />
                            
                            <FitBounds bounds={mapBounds} />

                            {/* Restaurant Marker */}
                            <Marker position={[parseFloat(order.restaurant_lat), parseFloat(order.restaurant_lng)]} icon={restaurantIcon}>
                                <Popup>
                                    <strong>🍽️ {order.restaurant_name}</strong><br/>
                                    Restaurant Location
                                </Popup>
                            </Marker>

                            {/* Delivery Marker */}
                            <Marker position={[parseFloat(order.delivery_lat), parseFloat(order.delivery_lng)]} icon={deliveryIcon}>
                                <Popup>
                                    <strong>📍 Your Delivery</strong><br/>
                                    Drop-off Location
                                </Popup>
                            </Marker>

                            {/* Live Rider Marker */}
                            {hasRider && (
                                <Marker position={[riderLat, riderLng]} icon={riderIcon}>
                                    <Popup>
                                        <strong>🛵 Live Rider Location</strong><br/>
                                        Heading to your address
                                    </Popup>
                                </Marker>
                            )}

                            {/* Route Polyline */}
                            {routeCoords.length > 0 && (
                                <Polyline 
                                    positions={routeCoords} 
                                    pathOptions={{ 
                                        color: '#3498db', 
                                        weight: 5, 
                                        opacity: 0.8,
                                        dashArray: null,
                                        lineCap: 'round',
                                        lineJoin: 'round'
                                    }} 
                                />
                            )}
                        </MapContainer>

                        {/* Route info overlay */}
                        {routeInfo && (
                            <div style={{ 
                                position: 'absolute', 
                                bottom: '15px', 
                                left: '15px', 
                                background: 'rgba(255,255,255,0.95)', 
                                borderRadius: '12px', 
                                padding: '12px 18px', 
                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#95a5a6', textTransform: 'uppercase', fontWeight: 'bold' }}>Distance</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>{routeInfo.distanceKm} km</div>
                                </div>
                                <div style={{ width: '1px', height: '30px', background: '#eee' }}></div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#95a5a6', textTransform: 'uppercase', fontWeight: 'bold' }}>Est. Time</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>{routeInfo.durationMin} min</div>
                                </div>
                            </div>
                        )}

                        {routeLoading && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                background: 'rgba(255,255,255,0.9)', padding: '15px 25px', borderRadius: '10px',
                                zIndex: 1000, fontWeight: 'bold', color: '#3498db'
                            }}>
                                Loading route...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Rider info ── */}
            {order.rider_username && (
                <div style={{ background: 'white', border: '1px solid #eee', borderRadius: '12px', padding: '15px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#3498db', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                        🛵
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{order.rider_username}</div>
                        <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>{order.rider_phone || 'Your delivery rider'}</div>
                    </div>
                </div>
            )}

            {/* ── Real-time notice ── */}
            {!isRejected && order.status !== 'Delivered' && (
                <p style={{ textAlign: 'center', color: '#27ae60', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    ⚡ This page updates in real-time. No need to refresh!
                </p>
            )}
        </div>
    );
};

export default OrderTracker;