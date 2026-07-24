import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

    const token = localStorage.getItem('access_token');

    // Fetch existing profile if it exists
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/restaurants/profile/', {
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
            const res = await fetch('http://127.0.0.1:8000/api/restaurants/profile/', {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });

            if (res.ok) {
                alert(isEditMode ? "Profile updated successfully!" : "Restaurant setup successful! Waiting for Admin approval.");
                navigate('/owner-dashboard');
            } else {
                const errorData = await res.json();
                console.error("Server validation errors:", errorData);
                alert("Operation failed: " + JSON.stringify(errorData));
            }
        } catch (err) {
            console.error("Network error:", err);
            alert("Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading profile data...</div>;

    return (
        <div className="setup-container">
            <h2>{isEditMode ? 'Edit Restaurant Profile' : 'Set Up Your Restaurant'}</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Restaurant Name" required value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})} />
                
                <textarea placeholder="Description" value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})} />
                
                <input type="text" placeholder="Full Street Address" required value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})} />

                <input type="text" placeholder="Area (e.g. Dhanmondi, Narsingdi)" required value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})} />

                <input type="text" placeholder="City" required value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})} />

                <div className="file-inputs">
                    <label>Logo Image {isEditMode && '(Leave blank to keep current)'}</label>
                    <input type="file" onChange={(e) => setLogo(e.target.files[0])} />
                    
                    <label>Banner Image {isEditMode && '(Leave blank to keep current)'}</label>
                    <input type="file" onChange={(e) => setBanner(e.target.files[0])} />
                </div>

                {/* Restaurant Location Pin */}
                <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>📍 Map Location</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: shopLocation ? '#27ae60' : '#e74c3c' }}>
                                {shopLocation ? `Pin Dropped! (${shopLocation.lat.toFixed(4)}, ${shopLocation.lng.toFixed(4)})` : 'Drop a pin on the map'}
                            </p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsMapOpen(true)}
                            style={{ padding: '8px 15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {shopLocation ? 'Change Pin' : 'Set on Map'}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} style={{ marginTop: '20px', width: '100%', padding: '15px', background: loading ? '#95a5a6' : '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? "Saving..." : (isEditMode ? "Save Changes" : "Complete Setup")}
                </button>
            </form>

            <MapSelector 
                isOpen={isMapOpen} 
                onClose={() => setIsMapOpen(false)} 
                onSelect={setShopLocation}
                initialPosition={shopLocation}
            />
        </div>
    );
};

export default RestaurantSetup;