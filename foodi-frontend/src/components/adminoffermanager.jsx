import { useState, useEffect } from 'react';
import { API } from '../api/client';

const AdminOfferManager = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${API}/api/admin/offers/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setOffers(data.results || data);
                }
            } catch (error) {
                console.error("Error fetching offers:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    const toggleOfferStatus = async (offer) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${API}/api/admin/offers/${offer.id}/`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ is_active: !offer.is_active })
            });
            if (res.ok) {
                setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: !offer.is_active } : o));
            }
        } catch (error) {
            console.error("Error toggling offer:", error);
        }
    };

    if (loading) return <div>Loading active offers...</div>;

    return (
        <div style={{ padding: '20px', background: 'white', borderRadius: '10px' }}>
            <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>Global Restaurant Offers 🔥</h2>
            
            {offers.length === 0 ? (
                <p style={{ color: '#7f8c8d' }}>No restaurants have created any special offers yet.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '10px' }}>Offer ID</th>
                            <th style={{ padding: '10px' }}>Restaurant</th>
                            <th style={{ padding: '10px' }}>Title</th>
                            <th style={{ padding: '10px' }}>Discount</th>
                            <th style={{ padding: '10px' }}>Status</th>
                            <th style={{ padding: '10px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers.map(offer => (
                            <tr key={offer.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>#{offer.id}</td>
                                <td style={{ padding: '10px' }}>{offer.restaurant_name}</td>
                                <td style={{ padding: '10px' }}>{offer.title}</td>
                                <td style={{ padding: '10px', color: '#e74c3c', fontWeight: 'bold' }}>{offer.discount_percentage}% OFF</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '5px 10px',
                                        borderRadius: '15px',
                                        fontSize: '0.85rem',
                                        background: offer.is_active ? '#d5f5e3' : '#fadbd8',
                                        color: offer.is_active ? '#27ae60' : '#c0392b'
                                    }}>
                                        {offer.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <button 
                                        onClick={() => toggleOfferStatus(offer)}
                                        style={{ padding: '6px 12px', background: offer.is_active ? '#f39c12' : '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {offer.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminOfferManager;