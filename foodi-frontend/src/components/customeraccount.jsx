import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerAccount = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Profile form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone_number: '',
        password: '' // empty by default, only sent if changed
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const res = await fetch('http://127.0.0.1:8000/api/users/profile/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setFormData({
                        username: data.username || '',
                        email: data.email || '',
                        phone_number: data.phone_number || '',
                        password: ''
                    });
                }
            } catch (err) {
                console.error("Profile fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('access_token');

        // Only send password if user typed something
        const payload = { ...formData };
        if (!payload.password) {
            delete payload.password;
        }

        try {
            const res = await fetch('http://127.0.0.1:8000/api/users/profile/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Profile updated successfully!');
                const data = await res.json();
                setUser(data);
                setFormData(prev => ({ ...prev, password: '' })); // clear password field
            } else {
                const errData = await res.json();
                alert(`Error: ${JSON.stringify(errData)}`);
            }
        } catch (err) {
            console.error(err);
            alert('Network error while saving profile.');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: '👤 View Profile' },
        { id: 'orders', label: '🧾 Orders' },
        { id: 'favourites', label: '❤️ Favourites' },
        { id: 'addresses', label: '📍 Addresses' },
        { id: 'vouchers', label: '🎟️ Vouchers' },
        { id: 'help', label: '🎧 Help Center' },
        { id: 'terms', label: '📜 Terms and Policies' },
        { id: 'invite', label: '🎁 Invite Friends' },
    ];

    const handleTabClick = (tabId) => {
        if (tabId === 'orders') {
            navigate('/orders');
        } else {
            setActiveTab(tabId);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '80px', color: '#7f8c8d' }}>Loading profile...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '30px', fontFamily: '"Inter", sans-serif' }}>
            
            {/* Sidebar Navigation */}
            <div style={{ width: '280px', flexShrink: 0, background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden', height: 'fit-content' }}>
                <div style={{ padding: '20px', background: '#2c3e50', color: 'white', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: '#34495e', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{user?.username}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#bdc3c7' }}>{user?.email}</p>
                </div>
                
                <div style={{ padding: '10px 0' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '15px 20px',
                                background: activeTab === tab.id ? '#f8f9fa' : 'transparent',
                                border: 'none',
                                borderLeft: activeTab === tab.id ? '4px solid #e67e22' : '4px solid transparent',
                                color: activeTab === tab.id ? '#e67e22' : '#2c3e50',
                                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: '0.2s'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', padding: '30px' }}>
                
                {activeTab === 'profile' && (
                    <div>
                        <h2 style={{ color: '#2c3e50', margin: '0 0 20px 0', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Edit Profile</h2>
                        <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: '20px', maxWidth: '500px' }}>
                            <div>
                                <label style={labelStyle}>Username</label>
                                <input 
                                    type="text" 
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                    style={inputStyle} 
                                    required 
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Email Address</label>
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    style={inputStyle} 
                                    required 
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Mobile Number</label>
                                <input 
                                    type="tel" 
                                    value={formData.phone_number}
                                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                    style={inputStyle} 
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>New Password (leave blank to keep current)</label>
                                <input 
                                    type="password" 
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    placeholder="Enter new password"
                                    style={inputStyle} 
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={saving}
                                style={{
                                    background: '#e67e22', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', marginTop: '10px'
                                }}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'favourites' && <Placeholder title="❤️ Favourites" msg="You haven't saved any restaurants yet. Start exploring and save your top picks!" />}
                {activeTab === 'addresses' && <Placeholder title="📍 Addresses" msg="Manage your delivery addresses here for quicker checkout. (Coming soon)" />}
                {activeTab === 'vouchers' && <Placeholder title="🎟️ Vouchers" msg="No active vouchers at the moment. Keep an eye out for special promotions!" />}
                {activeTab === 'help' && <Placeholder title="🎧 Help Center" msg="Need help with an order? Our support team is here for you. (Live chat coming soon)" />}
                {activeTab === 'terms' && <Placeholder title="📜 Terms and Policies" msg="Review our Terms of Service and Privacy Policy to understand how we protect your data." />}
                {activeTab === 'invite' && <Placeholder title="🎁 Invite Friends" msg="Invite friends and earn rewards when they place their first order! (Feature coming soon)" />}

            </div>
        </div>
    );
};

const labelStyle = { display: 'block', marginBottom: '8px', color: '#7f8c8d', fontSize: '0.9rem', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };

const Placeholder = ({ title, msg }) => (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#636e72' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>{title}</h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>{msg}</p>
    </div>
);

export default CustomerAccount;
