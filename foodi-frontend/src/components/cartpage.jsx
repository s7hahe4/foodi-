import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from './cartcontext';
import MapSelector from './MapSelector';
import BackButton from './BackButton';

const RATE_PER_KM = 15; // ৳15 per kilometer

const CartPage = () => {
    const { cartItems, cartTotal, removeFromCart, addToCart, clearCart } = useCart();
    const navigate = useNavigate();
    const [placingOrder, setPlacingOrder] = useState(false);
    
    // Map State
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [deliveryLocation, setDeliveryLocation] = useState(null);

    // OSRM delivery fee state
    const [deliveryFee, setDeliveryFee] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null); // { distanceKm, durationMin }
    const [feeLoading, setFeeLoading] = useState(false);
    const [feeError, setFeeError] = useState(null);

    // Restaurant coordinates (fetched from API)
    const [restaurantCoords, setRestaurantCoords] = useState(null);

    // Fetch the restaurant's lat/lng when cart has items
    useEffect(() => {
        if (cartItems.length === 0) return;

        const restaurantId = cartItems[0].item.restaurant;
        const fetchRestaurant = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/restaurants/feed/`);
                if (res.ok) {
                    const data = await res.json();
                    const restaurants = Array.isArray(data) ? data : (data.results || []);
                    const rest = restaurants.find(r => r.id === restaurantId);
                    if (rest && rest.latitude && rest.longitude) {
                        setRestaurantCoords({
                            lat: parseFloat(rest.latitude),
                            lng: parseFloat(rest.longitude)
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch restaurant coordinates:", err);
            }
        };
        fetchRestaurant();
    }, [cartItems]);

    // Auto-detect user location on mount
    useEffect(() => {
        if (!deliveryLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setDeliveryLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    console.log("Geolocation denied or unavailable:", err.message);
                }
            );
        }
    }, []);

    // Calculate OSRM route whenever both coords are available
    const calculateRoute = useCallback(async () => {
        if (!deliveryLocation || !restaurantCoords) return;

        setFeeLoading(true);
        setFeeError(null);

        try {
            // OSRM public demo server (free, no API key needed)
            const url = `https://router.project-osrm.org/route/v1/driving/${restaurantCoords.lng},${restaurantCoords.lat};${deliveryLocation.lng},${deliveryLocation.lat}?overview=false`;
            
            const res = await fetch(url);
            const data = await res.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const distanceKm = (route.distance / 1000).toFixed(1);
                const durationMin = Math.ceil(route.duration / 60);
                const fee = Math.round(parseFloat(distanceKm) * RATE_PER_KM);

                setRouteInfo({ distanceKm, durationMin });
                setDeliveryFee(fee);
            } else {
                setFeeError("Could not calculate route. The OSRM server may be unavailable.");
                setDeliveryFee(null);
            }
        } catch (err) {
            console.error("OSRM route error:", err);
            setFeeError("Route calculation failed. Check your internet connection.");
            setDeliveryFee(null);
        } finally {
            setFeeLoading(false);
        }
    }, [deliveryLocation, restaurantCoords]);

    useEffect(() => {
        calculateRoute();
    }, [calculateRoute]);

    const grandTotal = cartTotal + (deliveryFee || 0);

    const handleCheckout = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Please login to checkout!');
            navigate('/login');
            return;
        }

        if (cartItems.length === 0) return;
        
        if (!deliveryLocation) {
            alert("Please set a delivery location first!");
            setIsMapOpen(true);
            return;
        }

        if (deliveryFee === null) {
            alert("Please wait for delivery fee to be calculated.");
            return;
        }

        setPlacingOrder(true);
        try {
            const restaurantId = cartItems[0].item.restaurant;

            const payload = {
                restaurant_id: restaurantId,
                items: cartItems.map(({ item, quantity }) => ({
                    menu_item_id: item.id,
                    quantity
                })),
                delivery_lat: deliveryLocation.lat,
                delivery_lng: deliveryLocation.lng,
                delivery_fee: deliveryFee
            };

            const res = await fetch('http://127.0.0.1:8000/api/menu/orders/place/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const orderData = await res.json();
                navigate(`/checkout/pay/${orderData.id}`);
            } else {
                alert('Failed to place order. Try again.');
            }
        } catch (err) {
            console.error('Order error:', err);
            alert('Network error.');
        } finally {
            setPlacingOrder(false);
        }
    };

    return (
        <div style={{ padding: '20px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
            <BackButton />
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>Your Shopping Cart 🛒</h2>

            {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <p style={{ fontSize: '3rem', margin: '0 0 15px 0' }}>🧺</p>
                    <h3 style={{ color: '#7f8c8d' }}>Your cart is totally empty!</h3>
                    <button onClick={() => navigate('/')} style={{ marginTop: '15px', padding: '10px 20px', background: '#e67e22', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Go find some food
                    </button>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    {cartItems.map(({ item, quantity }) => {
                        const currentPrice = item.discounted_price || item.price;
                        return (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{item.name}</h4>
                                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '0.9rem' }}>
                                    {item.discounted_price && <span style={{color: '#e74c3c'}}>🔥</span>} ৳{currentPrice} each
                                </p>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fa', padding: '5px', borderRadius: '8px' }}>
                                    <button onClick={() => removeFromCart(item.id)} style={btnStyle('#e74c3c')}>−</button>
                                    <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{quantity}</span>
                                    <button onClick={() => addToCart(item)} style={btnStyle('#2ecc71')}>+</button>
                                </div>
                                <span style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '1.1rem', minWidth: '60px', textAlign: 'right' }}>
                                    ৳{(parseFloat(currentPrice) * quantity).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )})}

                    {/* ── Price Breakdown ── */}
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #eee' }}>
                        {/* Subtotal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1rem', color: '#636e72' }}>
                            <span>Subtotal</span>
                            <span>৳{cartTotal.toFixed(2)}</span>
                        </div>

                        {/* Delivery Fee Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1rem', color: '#636e72' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🛵 Delivery Fee
                                {routeInfo && (
                                    <span style={{ fontSize: '0.75rem', color: '#95a5a6' }}>
                                        ({routeInfo.distanceKm} km • ~{routeInfo.durationMin} min)
                                    </span>
                                )}
                            </span>
                            <span>
                                {feeLoading ? (
                                    <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>Calculating...</span>
                                ) : feeError ? (
                                    <span style={{ color: '#e74c3c', fontSize: '0.85rem' }}>Error</span>
                                ) : deliveryFee !== null ? (
                                    <span style={{ color: deliveryFee === 0 ? '#27ae60' : 'inherit', fontWeight: 'bold' }}>
                                        {deliveryFee === 0 ? 'FREE' : `৳${deliveryFee.toFixed(2)}`}
                                    </span>
                                ) : (
                                    <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>Set location</span>
                                )}
                            </span>
                        </div>

                        {/* OSRM route info pill */}
                        {routeInfo && (
                            <div style={{ 
                                background: '#eaf8f0', 
                                border: '1px solid #b8e6cc', 
                                borderRadius: '10px', 
                                padding: '10px 15px', 
                                marginBottom: '15px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.85rem'
                            }}>
                                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                    📍 {routeInfo.distanceKm} km driving distance
                                </span>
                                <span style={{ color: '#636e72' }}>
                                    ⏱️ ~{routeInfo.durationMin} min estimated
                                </span>
                                <span style={{ color: '#95a5a6', fontSize: '0.75rem' }}>
                                    @৳{RATE_PER_KM}/km
                                </span>
                            </div>
                        )}

                        {feeError && (
                            <div style={{ background: '#fdedec', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '10px', marginBottom: '15px', fontSize: '0.85rem', color: '#c0392b' }}>
                                ⚠️ {feeError}
                                <button onClick={calculateRoute} style={{ marginLeft: '10px', background: '#e74c3c', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '15px', borderTop: '2px solid #2c3e50', fontSize: '1.3rem', fontWeight: 'bold' }}>
                            <span>Total to Pay</span>
                            <span style={{ color: '#e67e22' }}>৳{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Delivery Location Section */}
                    <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>📍 Delivery Location</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: deliveryLocation ? '#27ae60' : '#e74c3c' }}>
                                    {deliveryLocation ? `Location Set! (${deliveryLocation.lat.toFixed(4)}, ${deliveryLocation.lng.toFixed(4)})` : 'No location selected'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsMapOpen(true)}
                                style={{ padding: '8px 15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {deliveryLocation ? 'Change' : 'Set Location'}
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckout} 
                        disabled={placingOrder || deliveryFee === null}
                        style={{ width: '100%', marginTop: '25px', padding: '15px', background: (placingOrder || deliveryFee === null) ? '#95a5a6' : '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: (placingOrder || deliveryFee === null) ? 'not-allowed' : 'pointer' }}
                    >
                        {placingOrder ? 'Processing...' : `Secure Checkout 🛵 — ৳${grandTotal.toFixed(2)}`}
                    </button>
                </div>
            )}

            {/* Render the Map Modal */}
            <MapSelector 
                isOpen={isMapOpen} 
                onClose={() => setIsMapOpen(false)} 
                onSelect={setDeliveryLocation}
                initialPosition={deliveryLocation}
            />
        </div>
    );
};

const btnStyle = (bg) => ({
    background: bg, 
    color: 'white', 
    border: 'none', 
    width: '28px', 
    height: '28px', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    fontSize: '1.2rem', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center'
});

export default CartPage;