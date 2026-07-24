import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import authBg1 from '../assets/auth-bg.png';
import authBg2 from '../assets/auth-bg-2.png';
import authBg3 from '../assets/auth-bg-3.png';

const bgImages = [authBg1, authBg2, authBg3];

const Login = () => {
    const [bgIndex, setBgIndex] = useState(0);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false); // Prevents double-login clicks

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % bgImages.length);
        }, 5000); // Change image every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Step 1: Get the JWT Tokens
            const response = await fetch('http://127.0.0.1:8000/api/users/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            const tokenData = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', tokenData.access);
                localStorage.setItem('refresh_token', tokenData.refresh);

                // Step 2: Fetch Profile to get Role and Onboarding status
                const profileResponse = await fetch('http://127.0.0.1:8000/api/users/profile/', {
                    headers: {
                        'Authorization': `Bearer ${tokenData.access}`
                    }
                });
                const profileData = await profileResponse.json();

                // Step 3: Smart Redirection Logic (Using window.location.href to force refresh)
                if (profileData.role === 'admin') {
                    localStorage.setItem('user_role', 'admin');
                    window.location.href = '/admin-panel';
                }
                else if (profileData.role === 'owner') {
                    localStorage.setItem('user_role', 'owner');
                    // Check if restaurant is already set up
                    if (profileData.has_restaurant === false) {
                        window.location.href = '/owner-dashboard/setup';
                    } else {
                        window.location.href = '/owner-dashboard';
                    }
                }
                else if (profileData.role === 'rider') {
                    localStorage.setItem('user_role', 'rider');
                    window.location.href = '/rider-dashboard';
                }
                else {
                    localStorage.setItem('user_role', 'customer');
                    // Route customers to the root landing page (Customer Dashboard)
                    window.location.href = '/';
                }

                console.log("Login Success:", profileData.username);
            } else {
                alert("Invalid username or password. Please try again.");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Connection to server failed. Make sure Django is running!");
        } finally {
            setLoading(false); // Stop loading regardless of success or failure
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-left-pane" style={{ backgroundImage: `url(${bgImages[bgIndex]})`, transition: 'background-image 1.5s ease-in-out' }}>
                {/* Left side image area */}
            </div>
            
            <div className="auth-right-pane">
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
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            />
                        </div>
                        
                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
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