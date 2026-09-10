import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { API } from './api/client';

// --- ALL COMPONENT IMPORTS ---
import Login from './components/login';
import Register from './components/register';
import RestaurantSetup from './components/restaurantsetup';
import OwnerDashboard from './components/ownerdashboard';
import OwnerOfferManager from './components/owneroffermanager';
import MenuManagement from './components/menumanagement';
import AdminDashboard from './components/admindashboard';
import AdminUserManager from './components/adminusermanager';

// CUSTOMER APP IMPORTS
import CustomerLayout from './components/customerlayout'; 
import CustomerDashboard from './components/customerdashboard';
import PublicMenu from './components/PublicMenu';
import CustomerOrders from './components/customerorders';
import CustomerOffers from './components/customeroffers';
import CartPage from './components/cartpage'; 
import CustomerAccount from './components/customeraccount';

import RiderDashboard from './components/riderdashboard';
import RiderAccount from './components/rideraccount';

import PaymentGateway from './components/paymentgateway';
import OrderTracker from './components/ordertracker';
import LogoutConfirmDialog from './components/LogoutConfirmDialog';

// THE CART CONTEXT
import { CartProvider } from './components/cartcontext'; 

import './App.css';

// ─── NEW: THE LOGIN GUARD ─────────────────────────────────────────
const RequireAuth = ({ children }) => {
    const isLoggedIn = !!localStorage.getItem('access_token');
    if (!isLoggedIn) {
        // If they aren't logged in, redirect them immediately to the login page!
        return <Navigate to="/login" replace />;
    }
    return children;
};
// ──────────────────────────────────────────────────────────────────

const AuthEnforcer = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await fetch(`${API}/api/users/profile/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const userData = await res.json();
          if (userData.is_restricted) {
            toast.error(`🚫 Access Denied: ${userData.restriction_reason || 'Your account is restricted. Contact Admin.'}`, { duration: 6000 });
            setTimeout(() => { localStorage.clear(); navigate('/login'); }, 2000);
          }
        } else if (res.status === 401) {
          localStorage.clear();
          navigate('/login');
        }
      } catch (err) {
        console.error("Connection lost to server");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  return children;
};

const MainPageBackGuard = ({ onOpenLogout }) => {
  const location = useLocation();

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('access_token');
    // Main dashboards & account pages across Customer, Owner, Rider, and Admin
    const mainRoutes = [
      '/',
      '/account',
      '/owner-dashboard',
      '/rider-dashboard',
      '/rider-dashboard/account',
      '/admin-panel'
    ];
    const isMainPage = mainRoutes.includes(location.pathname);

    if (!isLoggedIn || !isMainPage) return;

    // Push dummy history entry so browser back button triggers popstate
    window.history.pushState({ page: 'foodi_main_page_guard' }, '', window.location.href);

    const handlePopState = () => {
      // Re-push immediately so URL stays on current page
      window.history.pushState({ page: 'foodi_main_page_guard' }, '', window.location.href);

      // Trigger notification & modal
      toast.warning('Do you want to log out?', {
        description: 'You clicked the back button from the main page.',
        duration: 4000
      });
      onOpenLogout({
        title: 'Do you want to log out?',
        message: 'You clicked the browser back button. Would you like to log out of your Foodi++ account or stay on this page?'
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, onOpenLogout]);

  return null;
};

const Navbar = ({ onOpenLogout }) => {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('access_token');

  // Resolve the correct home route based on the logged-in user's role
  const roleHomeMap = {
    admin:    '/admin-panel',
    owner:    '/owner-dashboard',
    rider:    '/rider-dashboard',
    customer: '/',
  };
  const userRole = localStorage.getItem('user_role') || 'customer';
  const homeRoute = isLoggedIn ? (roleHomeMap[userRole] || '/') : '/';

  // Determine if we should show the buttons based on current route
  const isLoginPage    = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  return (
    <nav className="navbar">
      <Link to={homeRoute} className="nav-brand">
        <span className="brand-text">Foodi<span className="brand-highlight">++</span></span>
        <span className="brand-icon">🍔</span>
      </Link>
      <div>
        {!isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {!isLoginPage    && <Link to="/login"    className="nav-link-login">Login</Link>}
            {!isRegisterPage && <Link to="/register" className="nav-btn-signup">Sign Up</Link>}
          </div>
        ) : (
          <button
            onClick={() => onOpenLogout({
              title: 'Confirm Logout',
              message: 'Are you sure you want to log out of your Foodi++ session?'
            })}
            style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '6px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

function App() {
  const [logoutModalConfig, setLogoutModalConfig] = useState({
    isOpen: false,
    title: 'Do you want to log out?',
    message: 'Are you sure you want to log out of your Foodi++ account?'
  });

  const openLogoutModal = (custom = {}) => {
    setLogoutModalConfig({
      isOpen: true,
      title: custom.title || 'Do you want to log out?',
      message: custom.message || 'Are you sure you want to log out of your Foodi++ account or stay on this page?'
    });
  };

  const closeLogoutModal = () => {
    setLogoutModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    window.openFoodiLogoutModal = openLogoutModal;
    return () => {
      delete window.openFoodiLogoutModal;
    };
  }, []);

  const confirmLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <CartProvider>
      <Router>
        <AuthEnforcer>
          <Toaster position="top-right" richColors closeButton />
          <MainPageBackGuard onOpenLogout={openLogoutModal} />
          <Navbar onOpenLogout={openLogoutModal} />
          <LogoutConfirmDialog
            isOpen={logoutModalConfig.isOpen}
            title={logoutModalConfig.title}
            message={logoutModalConfig.message}
            onConfirm={confirmLogout}
            onCancel={closeLogoutModal}
          />
          <Routes>
            {/* Auth routes (Public) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/owner-dashboard/setup" element={<RestaurantSetup />} />
            <Route path="/owner-dashboard/menu" element={<MenuManagement />} />
            <Route path="/owner-dashboard/offers" element={<OwnerOfferManager />} />

            {/* Admin Panel Routes */}
            <Route path="/admin-panel" element={<AdminDashboard />} />

            {/* Rider Routes */}
            <Route path="/rider-dashboard" element={<RiderDashboard />} />
            <Route path="/rider-dashboard/account" element={<RiderAccount />} />

            {/* Simulated Payment Gateway */}
            <Route path="/checkout/pay/:orderId" element={<PaymentGateway />} />

            {/* ─── LOCKED DOWN CUSTOMER ROUTES ─── */}
            {/* Notice how <RequireAuth> wraps the CustomerLayout now! */}
            <Route element={<RequireAuth><CustomerLayout /></RequireAuth>}>
                <Route path="/" element={<CustomerDashboard />} />
                <Route path="/restaurant/:id" element={<PublicMenu />} />
                <Route path="/offers" element={<CustomerOffers />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<CustomerOrders />} />
                <Route path="/orders/track/:orderId" element={<OrderTracker />} />
                <Route path="/account" element={<CustomerAccount />} />
            </Route>

          </Routes>
        </AuthEnforcer>
      </Router>
    </CartProvider>
  );
}

export default App;