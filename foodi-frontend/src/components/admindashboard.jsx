import { useState, useEffect } from 'react';
import AdminUserManager from './adminusermanager';
import AdminRestaurantManager from './adminrestaurantmanager';
import AdminOrderManager from './adminordermanager';
import AdminOfferManager from './adminoffermanager';
import AdminSettingsManager from './adminsettingsmanager';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ total_users: 0, total_restaurants: 0, pending_approvals: 0 });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch('http://127.0.0.1:8000/api/admin/stats/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="admin-layout">
            {/* --- SIDEBAR --- */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>Foodi++ Admin</h2>
                </div>
                <ul className="sidebar-menu">
                    <li className={activeTab === 'overview' ? 'active' : ''} 
                        onClick={() => setActiveTab('overview')}>📊 Dashboard</li>
                    
                    <li className={activeTab === 'users' ? 'active' : ''} 
                        onClick={() => setActiveTab('users')}>👥 Manage Users</li>
                    
                    <li className={activeTab === 'restaurants' ? 'active' : ''} 
                        onClick={() => setActiveTab('restaurants')}>🏠 Restaurant Approvals</li>

                    {/* NEW TABS */}
                    <li className={activeTab === 'orders' ? 'active' : ''} 
                        onClick={() => setActiveTab('orders')}>🧾 Ongoing Orders</li>
                    
                    <li className={activeTab === 'offers' ? 'active' : ''} 
                        onClick={() => setActiveTab('offers')}>🔥 Offers</li>
                    
                    <li className={activeTab === 'settings' ? 'active' : ''} 
                        onClick={() => setActiveTab('settings')}>⚙️ Settings</li>
                    
                    <li className="logout-item" onClick={() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }}>🚪 Logout</li>
                </ul>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="admin-content">
                <header className="content-header">
                    <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                    <div className="admin-profile">Logged in as: <strong>Admin</strong></div>
                </header>

                <div className="content-body">
                    {activeTab === 'overview' && (
                        <div className="stats-grid">
                            <div className="card">
                                <h3>Total Users</h3>
                                <p className="number">{stats.total_users}</p>
                            </div>
                            <div className="card">
                                <h3>Restaurants</h3>
                                <p className="number">{stats.total_restaurants}</p>
                            </div>
                            <div className="card highlight">
                                <h3>Pending Approvals</h3>
                                <p className="number">{stats.pending_approvals}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && <AdminUserManager />}
                    {activeTab === 'restaurants' && <AdminRestaurantManager />}
                    
                    {/* NEW COMPONENTS */}
                    {activeTab === 'orders' && <AdminOrderManager />}
                    {activeTab === 'offers' && <AdminOfferManager />}
                    {activeTab === 'settings' && <AdminSettingsManager />}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;