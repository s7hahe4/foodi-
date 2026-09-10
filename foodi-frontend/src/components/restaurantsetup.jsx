import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API } from '../api/client';
import MapSelector from './MapSelector';

const RestaurantSetup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Map State
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [shopLocation, setShopLocation] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        area: '',
        city: 'Dhaka',
    });
    
    const [logo, setLogo] = useState(null);
    const [banner, setBanner] = useState(null);
    const [existingLogoUrl, setExistingLogoUrl] = useState(null);
    const [existingBannerUrl, setExistingBannerUrl] = useState(null);

    const token = localStorage.getItem('access_token');

    // Fetch existing profile if it exists
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API}/api/restaurants/profile/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.name || '',
                        description: data.description || '',
                        address: data.address || '',
                        area: data.area || '',
                        city: data.city || 'Dhaka',
                    });
                    if (data.logo) setExistingLogoUrl(data.logo);
                    if (data.banner) setExistingBannerUrl(data.banner);
                    if (data.latitude && data.longitude) {
                        setShopLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) });
                    }
                    setIsEditMode(true);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('address', formData.address);
        data.append('area', formData.area);
        data.append('city', formData.city);
        
        if (shopLocation) {
            data.append('latitude', shopLocation.lat.toFixed(6));
            data.append('longitude', shopLocation.lng.toFixed(6));
        }

        if (logo) data.append('logo', logo);
        if (banner) data.append('banner', banner);

        try {
            const method = isEditMode ? 'PATCH' : 'POST';
            const res = await fetch(`${API}/api/restaurants/profile/`, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (res.ok) {
                toast.success(isEditMode ? 'Restaurant profile updated successfully! ✅' : 'Restaurant setup successful! Waiting for Admin approval. 🎉');
                navigate('/owner-dashboard');
            } else {
                const errorData = await res.json();
                console.error('Server validation errors:', errorData);
                toast.error('Operation failed: ' + JSON.stringify(errorData));
            }
        } catch (err) {
            console.error("Network error:", err);
            toast.error('Network error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div style={{ maxWidth: '720px', margin: '80px auto', textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
                <h3 style={{ color: '#1e293b', fontWeight: 700 }}>Loading Restaurant Profile</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Retrieving your restaurant credentials...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '760px', margin: '30px auto 80px', padding: '0 20px' }}>
            
            {/* ── Top Navigation & Back Button ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                <button
                    type="button"
                    onClick={() => navigate('/owner-dashboard')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '9px 18px',
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
                    <span>←</span> Back to Owner Dashboard
                </button>

                <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: isEditMode ? '#ecfdf5' : '#eff6ff',
                    color: isEditMode ? '#059669' : '#2563eb',
                    border: `1px solid ${isEditMode ? '#a7f3d0' : '#bfdbfe'}`
                }}>
                    {isEditMode ? '● Profile Active' : '★ New Setup'}
                </span>
            </div>

            {/* ── Main Form Container ── */}
            <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.06)',
                padding: '36px 32px',
            }}>
                
                {/* Header Title */}
                <div style={{ marginBottom: '28px', borderBottom: '1px solid #f1f5f9', paddingBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                        }}>
                            🏪
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                                {isEditMode ? 'Edit Restaurant Profile' : 'Set Up Your Restaurant'}
                            </h2>
                            <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                                Configure your restaurant branding, location address, and GPS coordinates for deliveries
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Restaurant Name */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
                            Restaurant Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Sultan Kitchen, Dominos Pizza"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.92rem',
                                color: '#0f172a',
                                background: '#f8fafc',
                                outline: 'none',
                                boxSizing: 'border-box',
                                margin: 0
                            }}
                        />
                    </div>

                    {/* Description / Cuisine Tags */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
                            Cuisine & Description
                        </label>
                        <textarea
                            placeholder="e.g. Authentic Bengali dishes, Burgers, Fast food, Biryani"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.92rem',
                                color: '#0f172a',
                                background: '#f8fafc',
                                outline: 'none',
                                boxSizing: 'border-box',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                margin: 0
                            }}
                        />
                    </div>

                    {/* Address Fields Row */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
                            Full Street Address <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. House 14, Road 5, Block D"
                            required
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.92rem',
                                color: '#0f172a',
                                background: '#f8fafc',
                                outline: 'none',
                                boxSizing: 'border-box',
                                margin: 0
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
                                Area / Neighborhood <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Shantinagar, Dhanmondi, Gulshan"
                                required
                                value={formData.area}
                                onChange={(e) => setFormData({...formData, area: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.92rem',
                                    color: '#0f172a',
                                    background: '#f8fafc',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    margin: 0
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '7px', fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
                                City <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Dhaka"
                                required
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.92rem',
                                    color: '#0f172a',
                                    background: '#f8fafc',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    margin: 0
                                }}
                            />
                        </div>
                    </div>

                    {/* ── Brand Media (Logo & Banner) ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '6px' }}>
                        <div style={{
                            background: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            borderRadius: '12px',
                            padding: '16px',
                            boxSizing: 'border-box'
                        }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.84rem', color: '#334155' }}>
                                📷 Restaurant Logo
                            </label>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '10px' }}>
                                {isEditMode ? 'Leave blank to keep existing logo' : 'Upload square logo image'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLogo(e.target.files[0])}
                                style={{ fontSize: '0.82rem', margin: 0, padding: 0, border: 'none', background: 'transparent' }}
                            />
                        </div>

                        <div style={{
                            background: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            borderRadius: '12px',
                            padding: '16px',
                            boxSizing: 'border-box'
                        }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.84rem', color: '#334155' }}>
                                🖼️ Header Banner
                            </label>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginBottom: '10px' }}>
                                {isEditMode ? 'Leave blank to keep existing banner' : 'Upload restaurant hero photo'}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setBanner(e.target.files[0])}
                                style={{ fontSize: '0.82rem', margin: 0, padding: 0, border: 'none', background: 'transparent' }}
                            />
                        </div>
                    </div>

                    {/* ── Live Map Location Card ── */}
                    <div style={{
                        marginTop: '10px',
                        padding: '18px 20px',
                        background: shopLocation ? '#ecfdf5' : '#f8fafc',
                        borderRadius: '14px',
                        border: `1px solid ${shopLocation ? '#a7f3d0' : '#e2e8f0'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: shopLocation ? '#10b981' : '#64748b',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem'
                            }}>
                                📍
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                                    GPS Delivery Coordinates
                                </h4>
                                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: shopLocation ? '#047857' : '#64748b' }}>
                                    {shopLocation
                                        ? `Pin Selected: (${shopLocation.lat.toFixed(4)}, ${shopLocation.lng.toFixed(4)})`
                                        : 'Pinpoint exact kitchen location for accurate courier routing'}
                                </p>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={() => setIsMapOpen(true)}
                            style={{
                                padding: '9px 18px',
                                background: shopLocation ? '#059669' : '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.86rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                width: 'auto',
                                margin: 0
                            }}
                        >
                            <span>🗺️</span> {shopLocation ? 'Change Pin' : 'Select on Map'}
                        </button>
                    </div>

                    {/* ── Submit & Cancel Actions ── */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/owner-dashboard')}
                            style={{
                                flex: 1,
                                padding: '13px 20px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '10px',
                                color: '#475569',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                margin: 0
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 2,
                                padding: '13px 20px',
                                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontSize: '0.98rem',
                                fontWeight: 800,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: loading ? 'none' : '0 4px 14px rgba(234, 88, 12, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                margin: 0
                            }}
                        >
                            {loading ? 'Saving Changes...' : (isEditMode ? 'Save Restaurant Profile 💾' : 'Complete Setup 🚀')}
                        </button>
                    </div>

                </form>

                <MapSelector 
                    isOpen={isMapOpen} 
                    onClose={() => setIsMapOpen(false)} 
                    onSelect={setShopLocation}
                    initialPosition={shopLocation}
                />
            </div>
        </div>
    );
};

export default RestaurantSetup;