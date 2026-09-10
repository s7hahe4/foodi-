import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API } from '../api/client';
import { useCart } from './cartcontext';
import './PublicMenu.css';

const PublicMenu = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [deliveryMode, setDeliveryMode] = useState('delivery');
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'reviews'
    const [reviews, setReviews] = useState([]);

    const categoryRefs = useRef({});

    const { cart, addToCart, removeFromCart, cartItems, cartTotal, cartCount, clearCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRest, resMenu, resReviews] = await Promise.all([
                    fetch(`${API}/api/restaurants/feed/${id}/`),
                    fetch(`${API}/api/menu/public/${id}/`),
                    fetch(`${API}/api/restaurants/${id}/reviews/`)
                ]);
                if (resRest.ok) setRestaurant(await resRest.json());
                if (resMenu.ok) {
                    const data = await resMenu.json();
                    setMenuItems(Array.isArray(data) ? data : (data.results || []));
                }
                if (resReviews.ok) {
                    const revData = await resReviews.json();
                    setReviews(Array.isArray(revData) ? revData : (revData.results || []));
                }
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // ── Derived data ────────────────────────────
    const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCat;
    });

    // Group items by category
    const groupedItems = filteredItems.reduce((groups, item) => {
        const cat = item.category || 'Other';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
        return groups;
    }, {});

    // Category counts (from all items, not filtered)
    const categoryCounts = menuItems.reduce((counts, item) => {
        const cat = item.category || 'Other';
        counts[cat] = (counts[cat] || 0) + 1;
        return counts;
    }, {});

    // ── Scroll to category ──────────────────────
    const scrollToCategory = (cat) => {
        setActiveCategory(cat);
        if (cat === 'All') {
            window.scrollTo({ top: 300, behavior: 'smooth' });
            return;
        }
        const el = categoryRefs.current[cat];
        if (el) {
            const offset = 64;
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    // ── Checkout ─────────────────────────────────
    const handleGoToCheckout = () => {
        if (!localStorage.getItem('access_token')) {
            toast.error('Please login to place an order!');
            navigate('/login');
            return;
        }
        navigate('/cart');
    };

    // ── Loading / Error states ───────────────────
    if (loading) return (
        <div className="pm-loading">
            <div className="pm-spinner"></div>
            <span>Loading menu...</span>
        </div>
    );

    if (!restaurant) return (
        <div className="pm-not-found">
            <h2>Restaurant not found</h2>
            <p>The restaurant you're looking for doesn't exist.</p>
        </div>
    );

    const deliveryFee = restaurant.delivery_fee ? parseFloat(restaurant.delivery_fee) : 0;

    // ── Calculate Max Discount for Restaurant-wide Deal ──
    let maxDiscountPct = 0;
    let mainOfferTitle = '';
    
    menuItems.forEach(item => {
        if (item.active_offer_title && item.discounted_price && item.price) {
            const pct = Math.round(((item.price - item.discounted_price) / item.price) * 100);
            if (pct > maxDiscountPct) {
                maxDiscountPct = pct;
                mainOfferTitle = item.active_offer_title;
            }
        }
    });

    // Pick the first category with most items as "Popular"
    const firstCatIcon = '🔥';
    const firstCatSubtitle = 'Most ordered right now.';

    return (
        <div className="pm-page">

            {/* ── BREADCRUMB ── */}
            <div className="pm-breadcrumb">
                <Link to="/">Homepage</Link>
                <span>›</span>
                <span>{restaurant.name}</span>
            </div>

            {/* ── 1. HERO SECTION ── */}
            <section className="pm-hero">
                <div className="pm-hero-inner">
                    <img
                        className="pm-hero-logo"
                        src={restaurant.logo || restaurant.banner || ''}
                        alt={restaurant.name}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.background = '#1a1a2e';
                            e.target.style.display = 'flex';
                        }}
                    />

                    <div className="pm-hero-info">
                        <p className="pm-hero-tags">
                            {restaurant.cuisine_type || restaurant.area || 'Restaurant'}
                        </p>
                        <h1 className="pm-hero-name">{restaurant.name}</h1>

                        <div className="pm-hero-delivery-info">
                            {deliveryFee === 0 ? (
                                <span className="pm-free-delivery">🛵 Free delivery</span>
                            ) : (
                                <span>🛵 Delivery ৳{deliveryFee}</span>
                            )}
                            {restaurant.min_order && (
                                <>
                                    <span className="pm-dot">•</span>
                                    <span>Min. order ৳{restaurant.min_order}</span>
                                </>
                            )}
                        </div>

                        <div className="pm-hero-rating">
                            <span
                                onClick={() => setActiveTab('reviews')}
                                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="Click to view reviews"
                            >
                                <span className="pm-star">★</span>{' '}
                                <strong>{restaurant.rating && parseFloat(restaurant.rating) > 0 ? parseFloat(restaurant.rating).toFixed(1) : 'New'}</strong>/5
                                <span>
                                    ({restaurant.total_reviews ?? reviews.length} {(restaurant.total_reviews ?? reviews.length) === 1 ? 'review' : 'reviews'})
                                </span>
                            </span>
                            <span 
                                className="pm-hero-more-info"
                                onClick={() => setActiveTab(activeTab === 'reviews' ? 'menu' : 'reviews')}
                                style={{ cursor: 'pointer' }}
                            >
                                {activeTab === 'reviews' ? '📋 Back to Menu' : '⭐ View Customer Reviews'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── RESTAURANT-WIDE DEAL ── */}
            {maxDiscountPct > 0 && (
                <div className="pm-deals-section">
                    <h3 className="pm-deals-title">Available deals</h3>
                    <div className="pm-deal-card">
                        <div className="pm-deal-card-icon">🎁</div>
                        <div className="pm-deal-card-text">
                            <strong>{maxDiscountPct}% OFF - {mainOfferTitle}</strong>
                            <p>Enjoy up to {maxDiscountPct}% off on selected items. Applied at checkout.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── VIEW MODE TABS (MENU vs REVIEWS) ── */}
            <div style={{
                maxWidth: '1200px',
                margin: '18px auto 0',
                padding: '0 24px',
                display: 'flex',
                gap: '12px'
            }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    style={{
                        padding: '10px 22px',
                        borderRadius: '10px',
                        border: 'none',
                        background: activeTab === 'menu' ? '#2c2520' : '#e8e0d4',
                        color: activeTab === 'menu' ? '#ffffff' : '#57534e',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        width: 'auto',
                        margin: 0
                    }}
                >
                    <span>🍔</span> Menu ({menuItems.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    style={{
                        padding: '10px 22px',
                        borderRadius: '10px',
                        border: 'none',
                        background: activeTab === 'reviews' ? 'linear-gradient(135deg, #e67e22, #d35400)' : '#e8e0d4',
                        color: activeTab === 'reviews' ? '#ffffff' : '#57534e',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: activeTab === 'reviews' ? '0 2px 8px rgba(230, 126, 34, 0.25)' : 'none',
                        width: 'auto',
                        margin: 0
                    }}
                >
                    <span>⭐</span> Customer Reviews ({restaurant.total_reviews ?? reviews.length})
                </button>
            </div>

            {/* ── 2. STICKY CATEGORY NAV (Only shown in menu tab) ── */}
            {activeTab === 'menu' && (
                <nav className="pm-cat-nav">
                    <div className="pm-cat-nav-inner">
                        <input
                            type="text"
                            className="pm-search-input"
                            placeholder="Search in menu"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`pm-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => scrollToCategory(cat)}
                            >
                                {cat} ({categoryCounts[cat] || 0})
                            </button>
                        ))}
                    </div>
                </nav>
            )}

            {/* ── 3. TWO-COLUMN BODY ── */}
            <div className="pm-body" style={{ marginTop: activeTab === 'reviews' ? '20px' : '0' }}>
                {/* LEFT: Menu Items OR Reviews */}
                <div className="pm-menu-col">
                    {activeTab === 'reviews' ? (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {/* Rating Overview Summary Banner */}
                            <div style={{
                                background: 'linear-gradient(135deg, #2c2520 0%, #3d3128 100%)',
                                borderRadius: '16px',
                                padding: '24px 28px',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '20px',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: '#f59e0b' }}>
                                            {restaurant.rating && parseFloat(restaurant.rating) > 0 ? parseFloat(restaurant.rating).toFixed(1) : 'New'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#d6d3d1', marginTop: '4px' }}>out of 5.0</div>
                                    </div>
                                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '20px' }}>
                                        <div style={{ fontSize: '1.4rem', color: '#fbbf24', letterSpacing: '2px' }}>
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <span key={i}>
                                                    {(parseFloat(restaurant.rating) || 0) >= i + 1 ? '★' : ((parseFloat(restaurant.rating) || 0) > i ? '★' : '☆')}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '4px' }}>
                                            {restaurant.total_reviews ?? reviews.length} Verified Customer {(restaurant.total_reviews ?? reviews.length) === 1 ? 'Review' : 'Reviews'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#a8a29e' }}>
                                            Only customers with confirmed delivered orders can rate
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    borderRadius: '12px',
                                    padding: '10px 16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '0.85rem'
                                }}>
                                    <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                                    <div>
                                        <strong>100% Genuine</strong>
                                        <div style={{ color: '#a8a29e', fontSize: '0.78rem' }}>Authentic Diner Feedback</div>
                                    </div>
                                </div>
                            </div>

                            {/* Reviews List */}
                            {reviews.length === 0 ? (
                                <div style={{
                                    background: '#fffcf7',
                                    borderRadius: '16px',
                                    border: '1px solid #e8e0d4',
                                    padding: '50px 20px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⭐</div>
                                    <h3 style={{ color: '#2d2a26', margin: '0 0 6px', fontSize: '1.25rem' }}>
                                        No reviews yet for {restaurant.name}
                                    </h3>
                                    <p style={{ color: '#78716c', fontSize: '0.92rem', margin: '0 0 20px' }}>
                                        Be the first foodie to order and leave a review!
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('menu')}
                                        style={{
                                            background: 'linear-gradient(135deg, #e67e22, #d35400)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '10px 22px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            width: 'auto',
                                            margin: 0
                                        }}
                                    >
                                        Browse Menu Items
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '14px' }}>
                                    {reviews.map((rev) => {
                                        const moodLabel = rev.rating === 5 ? 'Exceptional 🔥' : rev.rating === 4 ? 'Great 👍' : rev.rating === 3 ? 'Good 🙂' : rev.rating === 2 ? 'Fair 😐' : 'Needs Improvement 👎';
                                        const revDate = new Date(rev.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        });
                                        const initial = (rev.customer_name || 'U').charAt(0).toUpperCase();

                                        return (
                                            <div
                                                key={rev.id}
                                                style={{
                                                    background: '#fffcf7',
                                                    borderRadius: '14px',
                                                    border: '1px solid #e8e0d4',
                                                    padding: '18px 22px',
                                                    boxShadow: '0 2px 8px rgba(44, 37, 32, 0.04)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #e67e22, #d35400)',
                                                            color: '#ffffff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 800,
                                                            fontSize: '1rem'
                                                        }}>
                                                            {initial}
                                                        </div>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <h4 style={{ margin: 0, color: '#2d2a26', fontSize: '1rem', fontWeight: 700 }}>
                                                                    {rev.customer_name || 'Foodi++ Customer'}
                                                                </h4>
                                                                <span style={{
                                                                    background: '#ecfdf5',
                                                                    color: '#059669',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 700,
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    border: '1px solid #a7f3d0'
                                                                }}>
                                                                    ✓ Verified Diner
                                                                </span>
                                                            </div>
                                                            <div style={{ color: '#a8a29e', fontSize: '0.8rem', marginTop: '2px' }}>
                                                                Reviewed on {revDate} {rev.order && `• Order #${rev.order}`}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Rating badge & Mood */}
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ color: '#f59e0b', fontSize: '1.2rem', letterSpacing: '2px' }}>
                                                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                                        </div>
                                                        <span style={{ fontSize: '0.78rem', color: '#78716c', fontWeight: 600 }}>
                                                            {moodLabel}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Comment */}
                                                {rev.comment ? (
                                                    <p style={{
                                                        margin: '10px 0 0',
                                                        color: '#44403c',
                                                        fontSize: '0.92rem',
                                                        lineHeight: 1.5,
                                                        background: '#f5f0e8',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        borderLeft: '4px solid #e67e22'
                                                    }}>
                                                        "{rev.comment}"
                                                    </p>
                                                ) : (
                                                    <p style={{ margin: '8px 0 0', color: '#a8a29e', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                        Customer rated this meal {rev.rating} out of 5 stars without written comments.
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Standard Menu Display */
                        Object.keys(groupedItems).length > 0 ? (
                        Object.entries(groupedItems).map(([category, items], catIdx) => (
                            <div key={category} ref={el => (categoryRefs.current[category] = el)}>
                                <div className="pm-cat-header">
                                    <h2 className="pm-cat-title">
                                        <span className="pm-cat-icon">{catIdx === 0 ? firstCatIcon : '📋'}</span>
                                        {category}
                                    </h2>
                                    {catIdx === 0 && (
                                        <p className="pm-cat-subtitle">{firstCatSubtitle}</p>
                                    )}
                                    {catIdx !== 0 && <div style={{ height: 10 }}></div>}
                                </div>

                                <div className="pm-items-grid">
                                    {items.map(item => {
                                        const inCart = cart[item.id];
                                        const currentPrice = item.discounted_price || item.price;

                                        return (
                                            <div key={item.id} className="pm-card">
                                                {/* Card Body (Left) */}
                                                <div className="pm-card-body">
                                                    <h3 className="pm-card-name">{item.name}</h3>
                                                    <p className="pm-card-price">
                                                        {item.discounted_price ? (
                                                            <>from ৳{currentPrice}<del>৳{item.price}</del></>
                                                        ) : (
                                                            <>from ৳{currentPrice}</>
                                                        )}
                                                    </p>
                                                    <p className="pm-card-desc">
                                                        {item.description || 'A delicious item from our kitchen.'}
                                                    </p>
                                                    {(item.calories || item.active_offer_title) && (
                                                        <div className="pm-card-badges">
                                                            {item.calories && (
                                                                <span className="pm-badge pm-badge-cal">🔥 {item.calories} kcal</span>
                                                            )}
                                                            {item.active_offer_title && (
                                                                <span className="pm-badge pm-badge-offer">🎁 {item.active_offer_title}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Image (Right) — Circular */}
                                                <div className="pm-card-img-wrap">
                                                    {item.image ? (
                                                        <img className="pm-card-img" src={item.image} alt={item.name} />
                                                    ) : (
                                                        <div className="pm-card-img-placeholder">🍽️</div>
                                                    )}

                                                    {/* Floating + or Qty Stepper */}
                                                    {inCart ? (
                                                        <div className="pm-qty-stepper">
                                                            <button className="pm-qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                                                            <span className="pm-qty-num">{inCart.quantity}</span>
                                                            <button className="pm-qty-btn" onClick={() => addToCart(item)}>+</button>
                                                        </div>
                                                    ) : (
                                                        <button className="pm-add-btn" onClick={() => addToCart(item)}>+</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="pm-items-grid">
                            <div className="pm-empty-menu">
                                <div className="pm-empty-menu-icon">🍽️</div>
                                <h3>{searchTerm ? 'No items match your search' : 'No Menu Items Yet'}</h3>
                                <p>{searchTerm ? 'Try a different keyword.' : 'This restaurant hasn\'t added any items.'}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RIGHT: Cart Panel */}
                <div className="pm-cart-col">
                    <div className="pm-cart">
                        {/* Delivery / Pickup Toggle */}
                        <div className="pm-cart-toggle">
                            <button
                                className={`pm-toggle-btn ${deliveryMode === 'delivery' ? 'active' : ''}`}
                                onClick={() => setDeliveryMode('delivery')}
                            >
                                Delivery
                            </button>
                            <button
                                className={`pm-toggle-btn ${deliveryMode === 'pickup' ? 'active' : ''}`}
                                onClick={() => setDeliveryMode('pickup')}
                            >
                                Pick-up
                            </button>
                        </div>

                        {/* Cart Body */}
                        {cartItems.length === 0 ? (
                            <div className="pm-cart-empty">
                                <div className="pm-cart-empty-icon">🧺</div>
                                <h4>Hungry?</h4>
                                <p>You haven't added anything to your cart yet!</p>
                            </div>
                        ) : (
                            <div className="pm-cart-items">
                                {cartItems.map(({ item, quantity }) => {
                                    const price = item.discounted_price || item.price;
                                    return (
                                        <div key={item.id} className="pm-cart-item">
                                            <div className="pm-cart-item-info">
                                                <p className="pm-cart-item-name">{quantity}× {item.name}</p>
                                                <p className="pm-cart-item-meta">৳{price} each</p>
                                            </div>
                                            <div className="pm-cart-item-right">
                                                <span className="pm-cart-item-price">৳{(parseFloat(price) * quantity).toFixed(0)}</span>
                                                <button className="pm-cart-item-remove" onClick={() => removeFromCart(item.id)}>×</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Cart Footer — ALWAYS visible */}
                        <div className="pm-cart-footer">
                            <div className="pm-cart-row pm-cart-row-total">
                                <span>Total <small style={{ fontWeight: 400, color: '#6b7280' }}>(incl. fees and tax)</small></span>
                                <span>৳{(cartTotal + (deliveryMode === 'delivery' ? deliveryFee : 0)).toFixed(0)}</span>
                            </div>
                            {cartItems.length > 0 && (
                                <button className="pm-cart-see-summary">See summary</button>
                            )}
                            <button
                                className="pm-checkout-btn"
                                onClick={handleGoToCheckout}
                                disabled={!restaurant.is_open || cartItems.length === 0}
                            >
                                {!restaurant.is_open
                                    ? 'Restaurant is closed'
                                    : 'Review payment and address'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicMenu;