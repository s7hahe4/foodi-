import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCart } from './cartcontext'; // <--- IMPORT THE GLOBAL BRAIN!
import FloatingChatbot from './FloatingChatbot';

const CustomerLayout = () => {
    const location = useLocation();
    
    // Grab the actual item count from the cart memory!
    const { cartCount } = useCart(); 

    const isActive = (path) => location.pathname === path ? 'active-tab' : '';

    return (
        <div className="customer-app-container" style={{ paddingBottom: '70px', minHeight: '100vh', background: '#f4f6f8' }}>
            
            <div className="customer-content">
                <Outlet /> 
            </div>

            <nav className="bottom-nav" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                background: 'white', display: 'flex', justifyContent: 'space-around',
                padding: '10px 0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 1000
            }}>
                <Link to="/" className={`nav-item ${isActive('/')}`} style={navItemStyle}>
                    <span style={{ fontSize: '1.5rem' }}>🏠</span>
                    <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Home</span>
                </Link>
                
                <Link to="/offers" className={`nav-item ${isActive('/offers')}`} style={navItemStyle}>
                    <span style={{ fontSize: '1.5rem' }}>🔥</span>
                    <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Offers</span>
                </Link>

                <Link to="/cart" className={`nav-item ${isActive('/cart')}`} style={{...navItemStyle, position: 'relative'}}>
                    <span style={{ fontSize: '1.5rem' }}>🛒</span>
                    
                    {/* THE FIX: Only show the badge if they actually have items! */}
                    {cartCount > 0 && (
                        <span style={{ position: 'absolute', top: '-5px', right: '15px', background: '#e74c3c', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {cartCount}
                        </span>
                    )}
                    
                    <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Cart</span>
                </Link>

                <Link to="/orders" className={`nav-item ${isActive('/orders')}`} style={navItemStyle}>
                    <span style={{ fontSize: '1.5rem' }}>🧾</span>
                    <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Orders</span>
                </Link>

                <Link to="/account" className={`nav-item ${isActive('/account')}`} style={navItemStyle}>
                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                    <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Account</span>
                </Link>
            </nav>

            {/* 🤖 Floating Chatbot - appears on every customer page */}
            <FloatingChatbot />
        </div>
    );
};

const navItemStyle = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: '#7f8c8d', flex: 1
};

export default CustomerLayout;