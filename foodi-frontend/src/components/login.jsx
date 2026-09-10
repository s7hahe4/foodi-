import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { API } from '../api/client';
import authBg1 from '../assets/auth-bg.png';
import authBg2 from '../assets/auth-bg-2.png';
import authBg3 from '../assets/auth-bg-3.png';

const bgImages = [authBg1, authBg2, authBg3];



const Login = () => {
    const [bgIndex, setBgIndex] = useState(0);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % bgImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const doLogin = async (username, password) => {
        setLoading(true);
        try {
            // Step 1: Get JWT Tokens
            const response = await fetch(`${API}/api/users/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const tokenData = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', tokenData.access);
                localStorage.setItem('refresh_token', tokenData.refresh);

                // Step 2: Fetch Profile to get Role and Onboarding status
                const profileResponse = await fetch(`${API}/api/users/profile/`, {
                    headers: { 'Authorization': `Bearer ${tokenData.access}` }
                });
                const profileData = await profileResponse.json();

                toast.success(`Welcome back, ${profileData.username}! 🎉`);

                // Step 3: Smart Redirection Logic
                setTimeout(() => {
                    if (profileData.role === 'admin') {
                        localStorage.setItem('user_role', 'admin');
                        window.location.href = '/admin-panel';
                    } else if (profileData.role === 'owner') {
                        localStorage.setItem('user_role', 'owner');
                        window.location.href = profileData.has_restaurant === false ? '/owner-dashboard/setup' : '/owner-dashboard';
                    } else if (profileData.role === 'rider') {
                        localStorage.setItem('user_role', 'rider');
                        window.location.href = '/rider-dashboard';
                    } else {
                        localStorage.setItem('user_role', 'customer');
                        window.location.href = '/';
                    }
                }, 800);
            } else {
                toast.error('Invalid username or password. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Connection to server failed. Make sure Django is running!');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        doLogin(credentials.username, credentials.password);
    };


    return (
        <div 
            className="auth-wrapper" 
            style={{ 
                backgroundImage: `url(${bgImages[bgIndex]})`, 
                transition: 'background-image 1.5s ease-in-out' 
            }}
        >
            <div className="auth-overlay">
                <div className="auth-card">
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">Sign in to your Foodi++ account to continue.</p>
                    
                    <form onSubmit={handleLogin}>
                        <div className="auth-input-group">
                            <label>Username</label>
                            <input
                                type="text"
                                className="auth-input"
                                placeholder="Enter your username"
                                required
                                disabled={loading}
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            />
                        </div>
                        
                        <div className="auth-input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="auth-input"
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            />
                        </div>
                        
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                    
                    <div className="auth-footer">
                        Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;