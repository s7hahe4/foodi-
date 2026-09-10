import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API, WS_URL } from '../api/client';
import { generateOrderInvoicePDF } from '../utils/invoiceGenerator';
import ReviewModal from './ReviewModal';
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
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [riderLat, setRiderLat] = useState(null);
    const [riderLng, setRiderLng] = useState(null);

    // Route state
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null); // { distanceKm, durationMin }
    const [routeLoading, setRouteLoading] = useState(false);

    // ⚡ Simulator & WebSocket State
    const [isSimulating, setIsSimulating] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [lastWsEvent, setLastWsEvent] = useState(null);
    const wsRef = useRef(null);

    // ⭐ Review State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`${API}/api/menu/orders/track/${orderId}/`, {
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
        const ws = new WebSocket(`${WS_URL}/ws/orders/track/${orderId}/`);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsConnected(true);
            setLastWsEvent('⚡ WebSocket Connected');
        };

        ws.onclose = () => {
            setWsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'order_status_update') {
                    setOrder(prev => ({ ...prev, status: data.status }));
                    setLastWsEvent(`⚡ Status: ${data.status}`);
                } else if (data.type === 'rider_location_update') {
                    const lat = parseFloat(data.rider_lat);
                    const lng = parseFloat(data.rider_lng);
                    setRiderLat(lat);
                    setRiderLng(lng);
                    setLastWsEvent(`📍 GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                }
            } catch (e) {
                console.error('WS parse error:', e);
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [orderId]);

    // ── Simulation API Handlers ──
    const advanceStatusApi = async (targetStatus) => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API}/api/menu/orders/simulate/${orderId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'set_status', status: targetStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setOrder(prev => ({ ...prev, ...updated, status: targetStatus }));
                return updated;
            }
        } catch (err) {
            console.error('Simulate API error:', err);
        }
    };

    const stepNextStatus = async () => {
        if (!order) return;
        const currentIdx = STATUS_STEPS.indexOf(order.status);
        if (currentIdx < STATUS_STEPS.length - 1) {
            const nextStatus = STATUS_STEPS[currentIdx + 1];
            await advanceStatusApi(nextStatus);
            toast.info(`Stage advanced to: ${nextStatus}`);
        }
    };

    const resetSimulation = async () => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API}/api/menu/orders/simulate/${orderId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action: 'reset' })
            });
            if (res.ok) {
                setOrder(prev => ({ ...prev, status: 'Pending' }));
                setRiderLat(null);
                setRiderLng(null);
                setLastWsEvent('⚡ Reset to Pending');
                toast.success('Order reset to Pending!');
            }
        } catch (err) {
            console.error('Reset error:', err);
        }
    };

    const startFullSimulation = async () => {
        if (isSimulating || !order) return;
        setIsSimulating(true);
        toast.info('🚀 Launching Live Delivery Simulation...', { duration: 3000 });

        try {
            // Stage 1: Kitchen prepares order
            await advanceStatusApi('Preparing');
            toast.success('🍳 Step 1/4: Kitchen accepted order — food is cooking!');
            await new Promise(r => setTimeout(r, 2800));

            // Stage 2: Food ready
            await advanceStatusApi('Ready');
            toast.info('📦 Step 2/4: Meal packed — notifying delivery courier...');
            await new Promise(r => setTimeout(r, 2800));

            // Stage 3: Out for Delivery
            await advanceStatusApi('Out for Delivery');
            toast.info('🛵 Step 3/4: Courier picked up package & started driving!');
            await new Promise(r => setTimeout(r, 1500));

            // Stage 4: Live GPS driving along OSRM street route
            if (routeCoords && routeCoords.length > 0) {
                const sampleCount = Math.min(25, routeCoords.length);
                const step = Math.max(1, Math.floor(routeCoords.length / sampleCount));
                const sampled = [];
                for (let i = 0; i < routeCoords.length; i += step) {
                    sampled.push(routeCoords[i]);
                }
                if (sampled[sampled.length - 1] !== routeCoords[routeCoords.length - 1]) {
                    sampled.push(routeCoords[routeCoords.length - 1]);
                }

                for (let i = 0; i < sampled.length; i++) {
                    const [lat, lng] = sampled[i];
                    setRiderLat(lat);
                    setRiderLng(lng);

                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                            type: 'rider_location_update',
                            rider_lat: lat,
                            rider_lng: lng
                        }));
                    }
                    await new Promise(r => setTimeout(r, 450));
                }
            } else {
                await new Promise(r => setTimeout(r, 2500));
            }

            // Stage 5: Delivery complete
            await advanceStatusApi('Delivered');
            toast.success('🎉 Step 4/4: Order successfully delivered to customer!', { duration: 6000 });
        } catch (err) {
            console.error('Simulation execution failed:', err);
            toast.error('Simulation interrupted: ' + err.message);
        } finally {
            setIsSimulating(false);
        }
    };

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
        <div style={{ maxWidth: '780px', margin: '60px auto', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</p>
            <h3 style={{ color: '#1e293b', fontWeight: 700 }}>Tracking your order...</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading live dispatch and GPS telemetry</p>
        </div>
    );

    if (!order) return (
        <div style={{ maxWidth: '780px', margin: '60px auto', textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '2.5rem' }}>🔍</p>
            <h3 style={{ color: '#1e293b', fontWeight: 700 }}>Order not found</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>We couldn't locate this order in our system.</p>
            <button
                onClick={() => navigate('/orders')}
                style={{
                    background: '#e67e22',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    width: 'auto',
                    margin: 0
                }}
            >
                ← Back to Orders
            </button>
        </div>
    );

    const isRejected = order.status === 'Rejected';
    const currentStep = STATUS_STEPS.indexOf(order.status);

    const statusHeroConfig = {
        Pending: {
            icon: '⏳',
            title: 'Order Placed & Received',
            subtitle: 'Waiting for the kitchen to accept and review your order.',
            gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '#fed7aa',
            accent: '#ea580c'
        },
        Preparing: {
            icon: '🍳',
            title: 'Preparing Your Meal',
            subtitle: 'The chef is cooking your dishes with fresh ingredients!',
            gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '#fcd34d',
            accent: '#d97706'
        },
        Ready: {
            icon: '📦',
            title: 'Meal Packed & Ready',
            subtitle: 'Your food is bagged and waiting for courier dispatch.',
            gradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '#a7f3d0',
            accent: '#059669'
        },
        'Out for Delivery': {
            icon: '🛵',
            title: 'Courier is On the Way!',
            subtitle: 'Your delivery rider has collected your package and is navigating to your address.',
            gradient: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '#bfdbfe',
            accent: '#2563eb'
        },
        Delivered: {
            icon: '🎉',
            title: 'Delivered! Enjoy Your Meal',
            subtitle: 'Order completed. Thank you for ordering with Foodi++!',
            gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '#bbf7d0',
            accent: '#16a34a'
        },
        Rejected: {
            icon: '❌',
            title: 'Order Cancelled',
            subtitle: 'The restaurant was unable to accept this order.',
            gradient: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '#fecaca',
            accent: '#dc2626'
        }
    };
    const hero = statusHeroConfig[order.status] || statusHeroConfig.Pending;

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

    const setExplicitStatus = async (s) => {
        await advanceStatusApi(s);
        toast.info(`Switched to: ${s}`);
    };

    return (
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 20px 80px' }}>

            {/* ── Top Navigation Bar ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <button
                    onClick={() => navigate('/orders')}
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
                        margin: 0
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                    <span>←</span> Back to My Orders
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => {
                            generateOrderInvoicePDF(order);
                            toast.success('Downloaded PDF Invoice! 📄');
                        }}
                        style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            color: '#0f172a',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: 'auto',
                            margin: 0
                        }}
                    >
                        <span>📄</span> Download Invoice
                    </button>

                    <Link
                        to="/"
                        style={{
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            color: '#475569',
                            fontSize: '0.85rem',
                            fontWeight: 600
                        }}
                    >
                        <span>🏠</span> Home
                    </Link>
                </div>
            </div>

            {/* ── Header Title & Meta Card ── */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px 24px',
                marginBottom: '20px',
                boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)'
                    }}>
                        🍽️
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                                Order #{order.id}
                            </h2>
                            <span style={{
                                background: '#f1f5f9',
                                color: '#475569',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '6px'
                            }}>
                                Foodi++ Live
                            </span>
                        </div>
                        <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                            From <strong style={{ color: '#1e293b' }}>{order.restaurant_name}</strong>
                        </p>
                    </div>
                </div>

                {/* Live Telemetry Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: wsConnected ? '#ecfdf5' : '#fef2f2',
                        border: `1px solid ${wsConnected ? '#a7f3d0' : '#fecaca'}`,
                        color: wsConnected ? '#059669' : '#dc2626',
                        fontSize: '0.82rem',
                        fontWeight: 700
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: wsConnected ? '#10b981' : '#ef4444',
                            boxShadow: wsConnected ? '0 0 8px #10b981' : 'none'
                        }}></span>
                        <span>{wsConnected ? 'Live Connection Active' : 'Connecting WS...'}</span>
                    </div>
                </div>
            </div>

            {/* ── ⚡ PORTFOLIO & RECRUITER SHOWCASE SIMULATOR ── */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '20px 22px',
                marginBottom: '24px',
                boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>⚡</span>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                                Live Order Lifecycle Simulator
                            </h4>
                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Recruiter Showcase • WebSocket State Dispatch + Live GPS Street Routing
                            </p>
                        </div>
                    </div>

                    <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {lastWsEvent || '⚡ Real-Time Engine Ready'}
                    </span>
                </div>

                {/* Simulator Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={startFullSimulation}
                        disabled={isSimulating}
                        style={{
                            flex: '1.4',
                            minWidth: '170px',
                            padding: '11px 16px',
                            background: isSimulating ? '#475569' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: isSimulating ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: isSimulating ? 'none' : '0 4px 14px rgba(249, 115, 22, 0.35)',
                            transition: 'all 0.2s',
                            margin: 0,
                            width: 'auto'
                        }}
                    >
                        {isSimulating ? '⏳ Simulation Running...' : '▶ Auto-Play Full Demo (18s)'}
                    </button>

                    <button
                        onClick={stepNextStatus}
                        disabled={isSimulating || order.status === 'Delivered'}
                        style={{
                            flex: '1',
                            minWidth: '120px',
                            padding: '11px 14px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255, 255, 255, 0.16)',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: (isSimulating || order.status === 'Delivered') ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            margin: 0,
                            width: 'auto'
                        }}
                    >
                        Next Stage ➔
                    </button>

                    <button
                        onClick={resetSimulation}
                        disabled={isSimulating}
                        style={{
                            padding: '11px 16px',
                            background: 'transparent',
                            color: '#94a3b8',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: isSimulating ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            margin: 0,
                            width: 'auto'
                        }}
                        title="Reset order back to Pending"
                    >
                        ↺ Reset
                    </button>
                </div>

                {/* Stage Quick-Jump Pills */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {STATUS_STEPS.map((s, idx) => {
                        const isPassed = STATUS_STEPS.indexOf(order.status) >= idx;
                        const isCurrent = order.status === s;
                        return (
                            <button
                                key={s}
                                onClick={() => setExplicitStatus(s)}
                                disabled={isSimulating}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    border: 'none',
                                    cursor: isSimulating ? 'default' : 'pointer',
                                    background: isCurrent ? '#f97316' : isPassed ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                    color: isCurrent ? '#ffffff' : isPassed ? '#fdba74' : '#94a3b8',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    margin: 0,
                                    width: 'auto'
                                }}
                            >
                                {idx + 1}. {s}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Dynamic Hero Status Banner ── */}
            <div style={{
                background: hero.gradient,
                border: `1px solid ${hero.border}`,
                borderRadius: '18px',
                padding: '28px 24px',
                textAlign: 'center',
                marginBottom: '24px',
                boxShadow: '0 6px 20px -3px rgba(0,0,0,0.05)',
                position: 'relative'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: `2px solid ${hero.border}`,
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                    {hero.icon}
                </div>
                <h2 style={{ color: hero.accent, margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800 }}>
                    {hero.title}
                </h2>
                <p style={{ color: '#475569', margin: '0 0 12px', fontSize: '0.96rem', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
                    {hero.subtitle}
                </p>

                {/* ⭐ Rating / Review Section on Delivered Order */}
                {order.status === 'Delivered' && (
                    <div style={{ marginTop: '14px' }}>
                        {order.review_rating ? (
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#ffffff',
                                padding: '8px 18px',
                                borderRadius: '20px',
                                border: '1px solid #bbf7d0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                            }}>
                                <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>
                                    {'★'.repeat(order.review_rating)}{'☆'.repeat(5 - order.review_rating)}
                                </span>
                                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#166534' }}>
                                    You rated this order ({order.review_rating}/5)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsReviewModalOpen(true)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2563eb',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        padding: '0 4px',
                                        margin: 0,
                                        width: 'auto'
                                    }}
                                >
                                    Edit
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsReviewModalOpen(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '10px 22px',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '0.92rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    margin: 0,
                                    width: 'auto',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span>⭐</span> Rate Your Meal & Service
                            </button>
                        )}
                    </div>
                )}

                {/* Live route estimate badge if active */}
                {routeInfo && order.status === 'Out for Delivery' && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: '#ffffff',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        marginTop: '12px'
                    }}>
                        <span>🛵 Estimated Arrival: <strong style={{ color: '#2563eb' }}>~{routeInfo.durationMin} mins</strong></span>
                        <span>•</span>
                        <span>Distance: {routeInfo.distanceKm} km</span>
                    </div>
                )}
            </div>

            {/* ── Modern Stepper Timeline ── */}
            {!isRejected && (
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '22px 20px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        {/* Background track line */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '6%',
                            right: '6%',
                            height: '3px',
                            background: '#e2e8f0',
                            zIndex: 0
                        }} />
                        
                        {/* Active fill line */}
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            left: '6%',
                            height: '3px',
                            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                            zIndex: 1,
                            width: currentStep < 0 ? '0%' : `${(currentStep / (STATUS_STEPS.length - 1)) * 88}%`,
                            transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }} />

                        {STATUS_STEPS.map((step, i) => {
                            const isDone = i <= currentStep;
                            const isCurrent = i === currentStep;

                            return (
                                <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                                    <div style={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '50%',
                                        background: isDone ? '#10b981' : '#f8fafc',
                                        color: isDone ? '#ffffff' : '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        border: `2px solid ${isDone ? '#10b981' : '#cbd5e1'}`,
                                        boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {isDone ? '✓' : i + 1}
                                    </div>
                                    <span style={{
                                        fontSize: '0.72rem',
                                        marginTop: '8px',
                                        color: isCurrent ? '#0f172a' : isDone ? '#059669' : '#94a3b8',
                                        fontWeight: isCurrent ? 800 : isDone ? 600 : 500,
                                        textAlign: 'center'
                                    }}>
                                        {step}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Live Tracking Map Card ── */}
            {hasMap && (
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05)'
                }}>
                    <div style={{
                        background: '#0f172a',
                        color: '#f8fafc',
                        padding: '14px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>🗺️</span>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Live Courier Navigation</h4>
                        </div>
                        {routeInfo && (
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                                <span>📍 {routeInfo.distanceKm} km route</span>
                                <span>•</span>
                                <span>⏱️ ~{routeInfo.durationMin} mins</span>
                            </div>
                        )}
                    </div>

                    <div style={{ height: '360px', width: '100%', position: 'relative' }}>
                        <MapContainer 
                            center={[parseFloat(order.restaurant_lat), parseFloat(order.restaurant_lng)]}
                            zoom={13} 
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                        >
                            <TileLayer 
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap'
                            />
                            
                            <FitBounds bounds={mapBounds} />

                            {/* Restaurant Marker */}
                            <Marker position={[parseFloat(order.restaurant_lat), parseFloat(order.restaurant_lng)]} icon={restaurantIcon}>
                                <Popup>
                                    <strong>🍽️ {order.restaurant_name}</strong><br/>
                                    Kitchen Location
                                </Popup>
                            </Marker>

                            {/* Delivery Dropoff Marker */}
                            <Marker position={[parseFloat(order.delivery_lat), parseFloat(order.delivery_lng)]} icon={deliveryIcon}>
                                <Popup>
                                    <strong>📍 Delivery Location</strong><br/>
                                    Customer Destination
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
                                        color: '#2563eb', 
                                        weight: 5, 
                                        opacity: 0.85,
                                        lineCap: 'round',
                                        lineJoin: 'round'
                                    }} 
                                />
                            )}
                        </MapContainer>

                        {/* Floating Route Info Overlay */}
                        {routeInfo && (
                            <div style={{ 
                                position: 'absolute', 
                                bottom: '15px', 
                                left: '15px', 
                                background: 'rgba(255, 255, 255, 0.95)', 
                                backdropFilter: 'blur(6px)',
                                borderRadius: '12px', 
                                padding: '10px 16px', 
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                zIndex: 1000,
                                display: 'flex',
                                gap: '18px',
                                alignItems: 'center',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Distance</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{routeInfo.distanceKm} km</div>
                                </div>
                                <div style={{ width: '1px', height: '26px', background: '#e2e8f0' }}></div>
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Est. Time</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2563eb' }}>{routeInfo.durationMin} mins</div>
                                </div>
                            </div>
                        )}

                        {routeLoading && (
                            <div style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                background: 'rgba(255,255,255,0.92)', padding: '12px 20px', borderRadius: '10px',
                                zIndex: 1000, fontWeight: 700, color: '#2563eb', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}>
                                Calculating optimal street route...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Assigned Courier Card ── */}
            {order.rider_username && (
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            border: '1px solid #bfdbfe'
                        }}>
                            🛵
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                                {order.rider_username}
                            </div>
                            <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                                Foodi++ Verified Delivery Courier • {order.rider_phone || 'Protected Contact'}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => toast.info(`Calling courier ${order.rider_username} (${order.rider_phone || 'Simulated'})`)}
                        style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#1e293b',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: 'auto',
                            margin: 0
                        }}
                    >
                        <span>📞</span> Contact Courier
                    </button>
                </div>
            )}

            {/* ── Itemized Receipt Card ── */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '24px',
                boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)'
            }}>
                <div style={{
                    background: '#f8fafc',
                    padding: '14px 20px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                            📋 Order Receipt & Bill Breakdown
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verified Settlement</span>
                    </div>

                    <button
                        onClick={() => {
                            generateOrderInvoicePDF(order);
                            toast.success('Downloaded Official PDF Invoice! 📄');
                        }}
                        style={{
                            background: '#ffffff',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            color: '#0f172a',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            width: 'auto',
                            margin: 0,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                    >
                        <span>📄</span> Download Tax Invoice
                    </button>
                </div>

                <div style={{ padding: '20px' }}>
                    {order.items && order.items.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 0',
                                borderBottom: '1px solid #f1f5f9'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    background: '#fff7ed',
                                    color: '#ea580c',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #ffedd5'
                                }}>
                                    {item.quantity}×
                                </span>
                                <span style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.92rem' }}>
                                    {item.item_name}
                                </span>
                            </div>
                            <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>
                                ৳{(parseFloat(item.item_price) * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                    
                    {/* Delivery fee line */}
                    {parseFloat(order.delivery_fee) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.9rem' }}>
                            <span>🛵 Delivery Courier Fee {routeInfo && <span style={{ fontSize: '0.78rem' }}>({routeInfo.distanceKm} km route)</span>}</span>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>৳{parseFloat(order.delivery_fee).toFixed(2)}</span>
                        </div>
                    )}

                    {/* Total */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop: '2px solid #e2e8f0',
                        fontSize: '1.2rem',
                        fontWeight: 800
                    }}>
                        <span style={{ color: '#0f172a' }}>Total Paid</span>
                        <span style={{ color: '#e67e22' }}>৳{parseFloat(order.total_price).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* ── Footer Return Action ── */}
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button
                    onClick={() => navigate('/orders')}
                    style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '10px 22px',
                        color: '#334155',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: 'auto',
                        margin: 0
                    }}
                >
                    <span>←</span> Return to All Orders
                </button>
            </div>

            {/* ⭐ Interactive Review Modal */}
            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                order={order}
                onReviewSubmitted={(newReview) => {
                    setOrder(prev => ({
                        ...prev,
                        review_rating: newReview.rating,
                        review_comment: newReview.comment
                    }));
                }}
            />

        </div>
    );
};

export default OrderTracker;