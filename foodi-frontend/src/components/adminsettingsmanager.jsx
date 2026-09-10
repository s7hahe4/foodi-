import { useState, useEffect } from 'react';
import { API } from '../api/client';

const AdminSettingsManager = () => {
    const [promoText, setPromoText] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            const token = localStorage.getItem('access_token');
            try {
                const res = await fetch(`${API}/api/admin/settings/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPromoText(data.promo_banner_text || '');
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        setMessage('');
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API}/api/admin/settings/`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ promo_banner_text: promoText })
            });
            if (res.ok) {
                setMessage('Settings saved successfully!');
            } else {
                setMessage('Failed to save settings.');
            }
        } catch (err) {
            console.error("Error saving settings:", err);
            setMessage('Network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2>Global Settings</h2>
            
            <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Promo Banner Text (Customer Dashboard)</label>
                <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '15px' }}>
                    This text will be displayed at the top of the customer dashboard. Leave it blank to hide the banner.
                </p>
                <textarea 
                    value={promoText}
                    onChange={(e) => setPromoText(e.target.value)}
                    rows="3"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', fontFamily: 'inherit' }}
                    placeholder="e.g. ✨ Use code LUNCH50 to get Tk 60 off..."
                />
            </div>

            {message && <p style={{ color: message.includes('success') ? '#27ae60' : '#c0392b', fontWeight: 'bold', marginTop: '15px' }}>{message}</p>}

            <button 
                onClick={handleSave} 
                disabled={loading}
                style={{ marginTop: '20px', padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
                {loading ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
};

export default AdminSettingsManager;
