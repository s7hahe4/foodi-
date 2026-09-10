import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { API } from '../api/client';

const MenuManagement = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Main Course',
        calories: ''
    });

    const token = localStorage.getItem('access_token');

    // Fetch existing menu items
    const fetchMenu = async () => {
        try {
            const res = await fetch(`${API}/api/menu/manage/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMenuItems(data);
            }
        } catch (err) {
            console.error("Failed to fetch menu", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    // Handle adding a new food item
    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/api/menu/manage/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newItem)
            });

            if (res.ok) {
                toast.success('Food item added successfully! 🍽️');
                setNewItem({ name: '', description: '', price: '', category: 'Main Course', calories: '' });
                fetchMenu();
            } else {
                const data = await res.json();
                toast.error('Error adding item: ' + JSON.stringify(data));
            }
        } catch (err) {
            console.error("Error:", err);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 24px 50px' }}>
            {/* Modern Top Header Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                padding: '20px 28px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid #f0ede6',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        boxShadow: '0 2px 8px rgba(230, 126, 34, 0.15)'
                    }}>
                        🍔
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#2c2520' }}>
                            Menu Management
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#7f8c8d' }}>
                            Add, update, and manage your restaurant's food offerings
                        </p>
                    </div>
                </div>

                <Link
                    to="/owner-dashboard"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        backgroundColor: '#ffffff',
                        color: '#2c3e50',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#94a3b8';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                    }}
                >
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>←</span> Back to Dashboard
                </Link>
            </div>

            <div className="dashboard-content" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>

                {/* LEFT SIDE: Add Food Form */}
                <div style={{
                    flex: '1',
                    minWidth: '320px',
                    height: 'fit-content',
                    background: '#ffffff',
                    padding: '26px 28px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #f0ede6'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#2c3e50', fontWeight: 700 }}>
                        Add New Item
                    </h3>
                    <form onSubmit={handleAddItem}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
                                Item Name
                            </label>
                            <input
                                type="text"
                                required
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="e.g., Spicy Chicken Burger"
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
                                Price (৳)
                            </label>
                            <input
                                type="number"
                                required
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                placeholder="e.g., 250"
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
                                Calories (kcal) - Optional
                            </label>
                            <input
                                type="number"
                                value={newItem.calories}
                                onChange={(e) => setNewItem({ ...newItem, calories: e.target.value })}
                                placeholder="e.g., 450"
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
                                Category
                            </label>
                            <select
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff' }}
                            >
                                <option value="Main Course">Main Course</option>
                                <option value="Appetizer">Appetizer</option>
                                <option value="Beverage">Beverage</option>
                                <option value="Dessert">Dessert</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>
                                Description (Optional)
                            </label>
                            <textarea
                                rows="3"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="What's in it?"
                                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }}
                            ></textarea>
                        </div>
                        <button 
                            type="submit" 
                            style={{ 
                                width: '100%', 
                                padding: '13px', 
                                background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)', 
                                color: '#ffffff', 
                                border: 'none', 
                                borderRadius: '10px', 
                                fontWeight: 700, 
                                fontSize: '1rem', 
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(230, 126, 34, 0.25)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(230, 126, 34, 0.35)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(230, 126, 34, 0.25)'; }}
                        >
                            + Add to Menu
                        </button>
                    </form>
                </div>

                {/* RIGHT SIDE: Current Menu List */}
                <div style={{
                    flex: '2',
                    minWidth: '380px',
                    background: '#ffffff',
                    padding: '26px 28px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #f0ede6'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#2c3e50', fontWeight: 700 }}>
                        Your Current Menu
                    </h3>
                    {loading ? <p style={{ color: '#94a3b8' }}>Loading menu...</p> : menuItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🍽️</span>
                            <p style={{ margin: 0, fontSize: '1rem', color: '#64748b' }}>You haven't added any food items yet.</p>
                            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>Use the form on the left to add your first dish.</p>
                        </div>
                    ) : (
                        <div className="menu-list">
                            {menuItems.map(item => (
                                <div key={item.id} style={{ 
                                    borderBottom: '1px solid #f1f5f9', 
                                    padding: '16px 0', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <div style={{ textAlign: 'left', flex: 1 }}>
                                        <h4 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', color: '#1e293b' }}>
                                            {item.name} 
                                            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginLeft: '8px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                                                {item.category}
                                            </span>
                                            {item.calories && (
                                                <span style={{ fontSize: '0.75rem', background: '#fff3e0', color: '#d35400', padding: '2px 8px', borderRadius: '10px', marginLeft: '6px', fontWeight: 700 }}>
                                                    🔥 {item.calories} kcal
                                                </span>
                                            )}
                                        </h4>
                                        <p style={{ margin: '0', fontSize: '0.88rem', color: '#64748b' }}>{item.description || 'No description provided.'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontWeight: 800, color: '#e67e22', fontSize: '1.25rem' }}>৳{item.price}</div>
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: 700, 
                                            padding: '2px 8px', 
                                            borderRadius: '12px',
                                            display: 'inline-block',
                                            marginTop: '4px',
                                            background: item.is_available ? '#dcfce7' : '#fee2e2',
                                            color: item.is_available ? '#15803d' : '#b91c1c'
                                        }}>
                                            {item.is_available ? '● In Stock' : '● Out of Stock'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MenuManagement;