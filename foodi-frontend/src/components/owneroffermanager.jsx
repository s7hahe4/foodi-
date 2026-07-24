import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const OwnerOfferManager = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ title: '', description: '', discount_percentage: 10 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = localStorage.getItem('access_token');

    const fetchOffers = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/menu/offers/manage/', {
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

    useEffect(() => {
        fetchOffers();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/menu/offers/manage/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormData({ title: '', description: '', discount_percentage: 10 });
                fetchOffers();
            } else {
                alert('Failed to create offer.');
            }
        } catch (error) {
            console.error("Error creating offer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleOfferStatus = async (offer) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/menu/offers/manage/${offer.id}/`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ is_active: !offer.is_active })
            });
            if (res.ok) {
                fetchOffers();
            }
        } catch (error) {
            console.error("Error toggling offer:", error);
        }
    };

    const deleteOffer = async (id) => {
        if (!window.confirm("Are you sure you want to delete this offer?")) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/menu/offers/manage/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchOffers();
            }
        } catch (error) {
            console.error("Error deleting offer:", error);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading offers...</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>🏷️ Manage Offers</h2>
                <Link to="/owner-dashboard" style={{ textDecoration: 'none', background: '#7f8c8d', color: 'white', padding: '8px 16px', borderRadius: '5px' }}>
                    ← Back to Dashboard
                </Link>
            </div>

            {/* CREATE OFFER FORM */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#34495e' }}>Create New Offer</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <input 
                        type="text" name="title" placeholder="Offer Title (e.g., 20% Off Burgers)" 
                        value={formData.title} onChange={handleChange} required 
                        style={{ flex: 1, minWidth: '200px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} 
                    />
                    <input 
                        type="number" name="discount_percentage" placeholder="Discount %" 
                        value={formData.discount_percentage} onChange={handleChange} required min="1" max="100"
                        style={{ width: '120px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} 
                    />
                    <input 
                        type="text" name="description" placeholder="Description (Optional)" 
                        value={formData.description} onChange={handleChange} 
                        style={{ flex: 2, minWidth: '250px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} 
                    />
                    <button type="submit" disabled={isSubmitting} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                        {isSubmitting ? 'Creating...' : '+ Create Offer'}
                    </button>
                </form>
            </div>

            {/* OFFERS LIST */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#34495e' }}>Your Offers</h3>
                {offers.length === 0 ? (
                    <p style={{ color: '#7f8c8d' }}>You have no offers yet.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '10px' }}>Title</th>
                                <th style={{ padding: '10px' }}>Discount</th>
                                <th style={{ padding: '10px' }}>Status</th>
                                <th style={{ padding: '10px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map(offer => (
                                <tr key={offer.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{offer.title}</td>
                                    <td style={{ padding: '10px', color: '#e74c3c', fontWeight: 'bold' }}>{offer.discount_percentage}% OFF</td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{
                                            padding: '5px 10px', borderRadius: '15px', fontSize: '0.85rem',
                                            background: offer.is_active ? '#d5f5e3' : '#fadbd8',
                                            color: offer.is_active ? '#27ae60' : '#c0392b'
                                        }}>
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => toggleOfferStatus(offer)}
                                            style={{ padding: '6px 12px', background: offer.is_active ? '#f39c12' : '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            {offer.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button 
                                            onClick={() => deleteOffer(offer.id)}
                                            style={{ padding: '6px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default OwnerOfferManager;
