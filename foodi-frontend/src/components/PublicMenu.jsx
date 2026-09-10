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

    const categoryRefs = useRef({});

    const { cart, addToCart, removeFromCart, cartItems, cartTotal, cartCount, clearCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRest, resMenu] = await Promise.all([
                    fetch(`${API}/api/restaurants/feed/${id}/`),
                    fetch(`${API}/api/menu/public/${id}/`)
                ]);
                if (resRest.ok) setRestaurant(await resRest.json());
                if (resMenu.ok) {
                    const data = await resMenu.json();
                    setMenuItems(Array.isArray(data) ? data : (data.results || []));
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
                            <span>
                                <span className="pm-star">★</span>{' '}
                                {restaurant.rating || '4.5'}/5
                                {restaurant.review_count && ` (${restaurant.review_count}+)`}
                            </span>
                            <span className="pm-hero-more-info">
                                ⓘ More info
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

            {/* ── 2. STICKY CATEGORY NAV ── */}
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

            {/* ── 3. TWO-COLUMN BODY ── */}
            <div className="pm-body">
                {/* LEFT: Menu Items */}
                <div className="pm-menu-col">
                    {Object.keys(groupedItems).length > 0 ? (
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
                    )}
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