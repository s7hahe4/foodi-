import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authBg1 from '../assets/auth-bg.png';
import authBg2 from '../assets/auth-bg-2.png';
import authBg3 from '../assets/auth-bg-3.png';

const bgImages = [authBg1, authBg2, authBg3];

const Register = () => {
    const navigate = useNavigate();
    const [bgIndex, setBgIndex] = useState(0);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        role: 'customer' // Default role
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % bgImages.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/users/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                alert("Registration Successful! Please login.");
                navigate('/login');
            } else {
                console.error(data);
                alert("Error: " + JSON.stringify(data));
            }
        } catch (error) {
            console.error("Connection failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-left-pane" style={{ backgroundImage: `url(${bgImages[bgIndex]})`, transition: 'background-image 1.5s ease-in-out' }}>
                {/* Left side image area */}
            </div>
            
            <div className="auth-right-pane">
                <div className="auth-card">
                    <h2>Create an Account</h2>
                    <p className="auth-subtitle">Join Foodi++ to start your journey.</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="auth-input-group">
                            <label>Username</label>
                            <input 
                                type="text" 
                                className="auth-input"
                                placeholder="Choose a username" 
                                required
                                disabled={loading}
                                onChange={(e) => setFormData({...formData, username: e.target.value})} 
                            />
                        </div>

                        <div className="auth-input-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                className="auth-input"
                                placeholder="Enter your email" 
                                required
                                disabled={loading}
                                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                            />
                        </div>

                        <div className="auth-input-group">
                            <label>Password</label>
                            <input 
                                type="password" 
                                className="auth-input"
                                placeholder="Create a password" 
                                required
                                disabled={loading}
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            />
                        </div>

                        <div className="auth-input-group">
                            <label>Phone Number</label>
                            <input 
                                type="text" 
                                className="auth-input"
                                placeholder="Enter your phone number" 
                                required
                                disabled={loading}
                                onChange={(e) => setFormData({...formData, phone_number: e.target.value})} 
                            />
                        </div>
                        
                        <div className="auth-input-group">
                            <label>I am a...</label>
                            <select 
                                className="auth-input auth-select"
                                value={formData.role} 
                                disabled={loading}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="customer">Customer</option>
                                <option value="owner">Restaurant Owner</option>
                                <option value="rider">Delivery Rider</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </form>
                    
                    <div className="auth-footer">
                        Already have an account? <Link to="/login" className="auth-link">Login here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;