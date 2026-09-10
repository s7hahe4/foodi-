import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../api/client';

const CustomerOffers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                // Public endpoint, no auth required
                const res = await fetch(`${API}/api/menu/offers/public/`);
                if (res.ok) {
                    const data = await res.json();
                    setOffers(data.results || data);
                }
            } catch (error) {
                console.error("Error fetching public offers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', marginTop: '80px', fontSize: '1.2rem', color: '#7f8c8d' }}>🔥 Loading amazing deals...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', minHeight: '80vh' }}>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h1 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' }}>🔥 Hot Deals & Offers</h1>
                <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>Enjoy massive discounts from your favorite restaurants today!</p>
            </div>

            {offers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8f9fa', borderRadius: '15px' }}>
                    <p style={{ fontSize: '3rem', margin: '0 0 15px' }}>😢</p>
                    <h2 style={{ color: '#2c3e50', margin: '0 0 10px' }}>No Offers Right Now</h2>
                    <p style={{ color: '#7f8c8d' }}>Check back later for exciting discounts!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                    {offers.map(offer => (
                        <div key={offer.id} style={{ 
                            background: 'white', 
                            borderRadius: '15px', 
                            overflow: 'hidden', 
                            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                            transition: 'transform 0.3s ease',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {/* Banner Area */}
                            <div style={{ 
                                height: '160px', 
                                background: offer.banner ? `url(${offer.banner}) center/cover` : '#34495e',
                                position: 'relative'
                            }}>
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '15px', 
                                    right: '15px', 
                                    background: '#e74c3c', 
                                    color: 'white', 
                                    padding: '8px 12px', 
                                    borderRadius: '20px', 
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 10px rgba(231,76,60,0.4)'
                                }}>
                                    {offer.discount_percentage}% OFF
                                </div>
                            </div>
                            
                            {/* Content Area */}
                            <div style={{ padding: '25px 20px' }}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.4rem' }}>{offer.title}</h3>
                                <p style={{ color: '#95a5a6', fontSize: '0.95rem', margin: '0 0 20px 0', minHeight: '40px' }}>
                                    {offer.description || `Enjoy ${offer.discount_percentage}% off all items at ${offer.restaurant_name}!`}
                                </p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600', color: '#34495e' }}>{offer.restaurant_name}</span>
                                    <Link 
                                        to={`/restaurant/${offer.restaurant_id}`} 
                                        style={{ 
                                            background: '#2ecc71', 
                                            color: 'white', 
                                            padding: '10px 20px', 
                                            borderRadius: '8px', 
                                            textDecoration: 'none', 
                                            fontWeight: 'bold',
                                            display: 'inline-block'
                                        }}
                                    >
                                        Order Now →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerOffers;
