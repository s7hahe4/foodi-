import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapSelector from './MapSelector';
import { useCart } from './cartcontext';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    // Location State
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [userAddress, setUserAddress] = useState("Locating...");

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const { addToCart } = useCart();

    // Filter States
    const [selectedCategory, setSelectedCategory] = useState('Featured');
    const [sortBy, setSortBy] = useState('Nearest');
    const [hasDiscount, setHasDiscount] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const [maxDelivery, setMaxDelivery] = useState(60);

    const [promoText, setPromoText] = useState("");

    const fetchFeed = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/restaurants/feed/');
            if (res.ok) {
                const data = await res.json();
                setRestaurants(data.results || data);
            }
        } catch (err) {
            console.error("Error fetching feed:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPromoText = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/admin/settings/public/', {
                cache: 'no-store' // Fix: prevent browser from caching the old promo text
            });
            if (res.ok) {
                const data = await res.json();
                setPromoText(data.promo_banner_text || "");
            }
        } catch (err) {
            console.error("Error fetching promo:", err);
        }
    };

    // Auto-detect location on load if not set
    useEffect(() => {
        if (!userLocation && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => handleLocationSelect({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => setUserAddress("Location access denied. Please set manually.")
            );
        }
        fetchFeed();
        fetchPromoText();
    }, []);

    // Debounced Search Logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setSearchLoading(true);

        const delayDebounceFn = setTimeout(async () => {
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/menu/feed/?search=${encodeURIComponent(searchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.results || data);
                }
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setSearchLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleLocationSelect = async (pos) => {
        setUserLocation(pos);
        setUserAddress("Detecting address...");
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                // Keep it short for the sidebar
                const parts = data.display_name.split(', ');
                setUserAddress(parts.slice(0, 3).join(', '));
            } else {
                setUserAddress(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
            }
        } catch (err) {
            console.error("Geocoding error", err);
            setUserAddress(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`);
        }
    };

    // Filter and Sort Logic
    const filteredRestaurants = restaurants.filter(r => {
        if (hasDiscount && !r.active_offer_discount) return false;
        if (maxDelivery < r.delivery_fee) return false;
        // Mock rating filter (since we don't have real ratings yet, we'll pretend all verified are 4.5+)
        if (minRating > 0 && !r.is_verified) return false; 
        
        // Category filtering logic
        if (selectedCategory === 'Current Offers' && !r.active_offer_discount) return false;
        if (selectedCategory === 'Free Delivery' && parseFloat(r.delivery_fee) > 0) return false;
        if (selectedCategory === 'New on Foodi++' && r.is_verified) return false; // assuming new = not verified yet
        if (selectedCategory === 'Featured' && !r.is_verified) return false; // assuming featured = verified
        if (selectedCategory === 'After Hours' && !r.is_open) return false; 

        return true;
    }).sort((a, b) => {
        if (sortBy === 'Ratings') return b.is_verified ? 1 : -1;
        if (sortBy === 'Popularity') return b.id - a.id; 
        return 0; // Nearest (default order)
    });

    const categories = [
        { name: 'Featured', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=150', color: '#ff7675' },
        { name: 'Current Offers', img: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=150', color: '#74b9ff' },
        { name: 'Most Popular', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150', color: '#fdcb6e' },
        { name: 'New on Foodi++', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150', color: '#55efc4' },
        { name: 'Free Delivery', img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=150', color: '#00b894' },
        { name: 'After Hours', img: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=150', color: '#2d3436' },
    ];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', display: 'flex', gap: '30px', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
            
            {/* ── LEFT SIDEBAR (FILTERS) ── */}
            <div style={{ width: '280px', flexShrink: 0 }}>
                {/* Location Box */}
                <div style={{ border: '1px solid #ff7675', borderRadius: '10px', padding: '15px', marginBottom: '25px', background: '#fff5f5' }}>
                    <div style={{ color: '#d63031', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        📍 Location
                    </div>
                    <p style={{ margin: '8px 0', color: '#2d3436', fontSize: '0.95rem', lineHeight: '1.4' }}>
                        {userAddress}
                    </p>
                    <button onClick={() => setIsMapOpen(true)} style={{ color: '#d63031', background: 'none', border: 'none', padding: 0, fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold' }}>
                        Change
                    </button>
                </div>

                {/* Sort By */}
                <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#2d3436' }}>Sort by</h4>
                    {['Nearest', 'Ratings', 'Popularity'].map(opt => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer', color: '#636e72', fontSize: '0.95rem' }}>
                            <input 
                                type="radio" 
                                name="sort" 
                                checked={sortBy === opt}
                                onChange={() => setSortBy(opt)}
                                style={{ accentColor: '#d63031', width: '18px', height: '18px' }}
                            />
                            {opt}
                        </label>
                    ))}
                </div>

                {/* Filter By */}
                <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#2d3436' }}>Filter by</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#636e72', fontSize: '0.95rem' }}>
                        <input 
                            type="checkbox" 
                            checked={hasDiscount}
                            onChange={(e) => setHasDiscount(e.target.checked)}
                            style={{ accentColor: '#d63031', width: '18px', height: '18px', borderRadius: '4px' }}
                        />
                        Restaurants Offering Discounts
                    </label>
                </div>

                {/* Rating */}
                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: '#2d3436' }}>Rating</h4>
                        <button onClick={() => setMinRating(0)} style={{ background: 'none', border: 'none', color: '#d63031', fontSize: '0.8rem', cursor: 'pointer' }}>Clear</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setMinRating(4.5)}
                            style={{ flex: 1, padding: '8px', border: minRating === 4.5 ? '2px solid #d63031' : '1px solid #ddd', borderRadius: '25px', background: 'white', color: minRating === 4.5 ? '#d63031' : '#636e72', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ★ Above 4.5
                        </button>
                        <button 
                            onClick={() => setMinRating(4.0)}
                            style={{ flex: 1, padding: '8px', border: minRating === 4.0 ? '2px solid #d63031' : '1px solid #ddd', borderRadius: '25px', background: 'white', color: minRating === 4.0 ? '#d63031' : '#636e72', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ★ Above 4
                        </button>
                    </div>
                </div>

                {/* Delivery Charge */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: '#2d3436' }}>Delivery Charge</h4>
                        <button onClick={() => setMaxDelivery(60)} style={{ background: 'none', border: 'none', color: '#d63031', fontSize: '0.8rem', cursor: 'pointer' }}>Reset</button>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="150" 
                        value={maxDelivery}
                        onChange={(e) => setMaxDelivery(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#d63031' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', color: '#636e72', fontSize: '0.85rem' }}>
                        <span>Free</span>
                        <span style={{ color: '#d63031', fontWeight: 'bold' }}>৳{maxDelivery}</span>
                        <span>৳150</span>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Global Search Bar */}
                <div style={{ marginBottom: '30px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem', color: '#7f8c8d' }}>🔍</div>
                    <input 
                        type="text" 
                        placeholder="Search for pizza, burgers, or restaurants..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '18px 20px 18px 50px', borderRadius: '12px', border: '2px solid #ecf0f1', fontSize: '1.1rem', outline: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'border-color 0.3s', boxSizing: 'border-box' }}
                        onFocus={(e) => e.target.style.borderColor = '#d63031'}
                        onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                    />
                </div>

                {/* Promo Banner */}
                {promoText && (
                    <div style={{ background: '#fff5f5', borderRadius: '12px', padding: '15px 20px', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px', color: '#d63031', fontWeight: 'bold', border: '1px solid #ff7675' }}>
                        {promoText}
                    </div>
                )}

                {isSearching ? (
                    <div>
                        <h2 style={{ color: '#2d3436', marginBottom: '20px' }}>
                            Search Results for "{searchQuery}"
                        </h2>
                        {searchLoading ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#636e72' }}>Searching across all restaurants...</div>
                        ) : searchResults.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#636e72', background: '#f8f9fa', borderRadius: '15px' }}>
                                No items found matching "{searchQuery}".
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                                {searchResults.map(item => {
                                    const currentPrice = item.discounted_price || item.price;
                                    return (
                                        <div key={item.id} style={{ background: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.1rem' }}>{item.name}</h3>
                                            <p style={{ margin: '0 0 5px 0', color: '#7f8c8d', fontSize: '0.85rem' }}>from {item.restaurant_name}</p>
                                            {item.calories && (
                                                <div style={{ marginBottom: '10px' }}>
                                                    <span style={{ background: '#ffeaa7', color: '#d35400', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                        🔥 {item.calories} kcal
                                                    </span>
                                                </div>
                                            )}
                                            <p style={{ margin: '0 0 15px 0', color: '#636e72', fontSize: '0.9rem', flex: 1 }}>{item.description}</p>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2c3e50' }}>
                                                    {item.discounted_price ? (
                                                        <>
                                                            <span style={{ textDecoration: 'line-through', color: '#95a5a6', fontSize: '0.9rem', marginRight: '8px' }}>৳{item.price}</span>
                                                            <span style={{ color: '#e74c3c' }}>৳{item.discounted_price}</span>
                                                        </>
                                                    ) : (
                                                        <span>৳{item.price}</span>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        addToCart({ ...item, restaurant: item.restaurant }); // ensure restaurant id is carried
                                                        alert(`${item.name} added to cart!`);
                                                    }}
                                                    style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                                >
                                                    + Add
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Categories Row */}
                        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '30px', scrollbarWidth: 'none' }}>
                            {categories.map((cat, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                                    style={{ 
                                        minWidth: '120px', 
                                        textAlign: 'center', 
                                        cursor: 'pointer',
                                        transform: selectedCategory === cat.name ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'transform 0.2s',
                                        opacity: selectedCategory && selectedCategory !== cat.name ? 0.6 : 1
                                    }}
                                >
                                    <div style={{ 
                                        height: '140px', 
                                        borderRadius: '15px', 
                                        overflow: 'hidden', 
                                        position: 'relative',
                                        marginBottom: '10px',
                                        boxShadow: selectedCategory === cat.name ? `0 0 15px ${cat.color}` : '0 4px 10px rgba(0,0,0,0.1)',
                                        border: selectedCategory === cat.name ? `3px solid ${cat.color}` : '3px solid transparent'
                                    }}>
                                        <img src={cat.img} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {/* Overlay gradient */}
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.1))` }}></div>
                                        <h4 style={{ position: 'absolute', top: '15px', left: '0', right: '0', margin: 0, color: cat.color, textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: '900', textShadow: '1px 1px 0px rgba(255,255,255,0.8)' }}>
                                            {cat.name.split(' ')[0]}<br/>{cat.name.split(' ').slice(1).join(' ')}
                                        </h4>
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: selectedCategory === cat.name ? cat.color : '#2d3436', fontWeight: selectedCategory === cat.name ? 'bold' : '600' }}>
                                        {cat.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Section Title */}
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2d3436', marginBottom: '20px' }}>
                            <span style={{ background: '#d63031', color: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '1.2rem' }}>
                                {selectedCategory === 'Current Offers' ? '🏷️' : selectedCategory === 'Free Delivery' ? '🛵' : selectedCategory === 'New on Foodi++' ? '🎉' : selectedCategory === 'After Hours' ? '🌙' : selectedCategory === 'Most Popular' ? '🔥' : '⭐'}
                            </span>
                            {selectedCategory ? `${selectedCategory} Restaurants` : 'All Restaurants'}
                        </h2>

                        {/* Restaurant Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#636e72' }}>Loading restaurants...</div>
                ) : filteredRestaurants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#636e72', background: '#f8f9fa', borderRadius: '15px' }}>
                        No restaurants match your filters. Try adjusting them!
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                        {filteredRestaurants.map(rest => (
                            <Link to={`/restaurant/${rest.id}`} key={rest.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)' } }}>
                                <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                    
                                    {/* Banner Image Container */}
                                    <div style={{ height: '180px', position: 'relative', background: '#ecf0f1' }}>
                                        {rest.banner ? (
                                            <img src={rest.banner} alt={rest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#bdc3c7' }}>
                                                🍽️
                                            </div>
                                        )}

                                        {/* Discount Badge overlay */}
                                        {rest.active_offer_discount && (
                                            <div style={{ position: 'absolute', top: '15px', left: '15px', background: 'rgba(255,255,255,0.95)', color: '#27ae60', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                                🏷️ {rest.active_offer_discount}% Off
                                            </div>
                                        )}
                                        
                                        {!rest.is_open && (
                                            <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                Closed
                                            </div>
                                        )}
                                    </div>

                                    {/* Restaurant Info */}
                                    <div style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <h3 style={{ margin: 0, color: '#2d3436', fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {rest.name}
                                            </h3>
                                        </div>

                                        <p style={{ margin: '0 0 12px 0', color: '#636e72', fontSize: '0.85rem' }}>
                                            {rest.area} • Fast Food • Burgers
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '0.9rem', color: '#2d3436' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                                <span style={{ color: '#f39c12' }}>★</span> {rest.is_verified ? '4.7' : 'New'}
                                            </span>
                                            <span style={{ color: '#b2bec3' }}>|</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                🛵 Delivery ৳{rest.delivery_fee}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                    </>
                )}
            </div>

            <MapSelector 
                isOpen={isMapOpen} 
                onClose={() => setIsMapOpen(false)} 
                onSelect={handleLocationSelect}
                initialPosition={userLocation}
            />
        </div>
    );
};

export default CustomerDashboard;