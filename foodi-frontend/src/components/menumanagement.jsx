import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
            const res = await fetch('http://127.0.0.1:8000/api/menu/manage/', {
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
            const res = await fetch('http://127.0.0.1:8000/api/menu/manage/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newItem)
            });

            if (res.ok) {
                alert("Food item added successfully!");
                setNewItem({ name: '', description: '', price: '', category: 'Main Course', calories: '' }); // Reset form
                fetchMenu(); // Refresh the list
            } else {
                const data = await res.json();
                alert("Error adding item: " + JSON.stringify(data));
            }
        } catch (err) {
            console.error("Error:", err);
        }
    };

    return (
        <div className="owner-dashboard" style={{ padding: '0 30px 40px' }}>
            <header className="dashboard-header">
                <h2>🍔 Menu Management</h2>
                <Link to="/owner-dashboard" className="btn-secondary">Back to Dashboard</Link>
            </header>

            <div className="dashboard-content" style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>

                {/* LEFT SIDE: Add Food Form */}
                <div className="setup-card" style={{ flex: '1', height: 'fit-content' }}>
                    <h3>Add New Item</h3>
                    <form onSubmit={handleAddItem}>
                        <div className="form-group">
                            <label>Item Name</label>
                            <input
                                type="text"
                                required
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="e.g., Spicy Chicken Burger"
                            />
                        </div>
                        <div className="form-group">
                            <label>Price (৳)</label>
                            <input
                                type="number"
                                required
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                placeholder="e.g., 250"
                            />
                        </div>
                        <div className="form-group">
                            <label>Calories (kcal) - Optional</label>
                            <input
                                type="number"
                                value={newItem.calories}
                                onChange={(e) => setNewItem({ ...newItem, calories: e.target.value })}
                                placeholder="e.g., 450"
                            />
                        </div>
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={newItem.category}
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            >
                                <option value="Main Course">Main Course</option>
                                <option value="Appetizer">Appetizer</option>
                                <option value="Beverage">Beverage</option>
                                <option value="Dessert">Dessert</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                rows="3"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="What's in it?"
                            ></textarea>
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add to Menu</button>
                    </form>
                </div>

                {/* RIGHT SIDE: Current Menu List */}
                <div className="setup-card" style={{ flex: '2' }}>
                    <h3>Your Current Menu</h3>
                    {loading ? <p>Loading menu...</p> : menuItems.length === 0 ? (
                        <p style={{ color: '#7f8c8d' }}>You haven't added any food yet.</p>
                    ) : (
                        <div className="menu-list">
                            {menuItems.map(item => (
                                <div key={item.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'left', paddingLeft: '5px' }}>
                                        <h4 style={{ margin: '0 0 5px 0' }}>
                                            {item.name} 
                                            <span style={{ fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'normal', marginLeft: '5px' }}>({item.category})</span>
                                            {item.calories && <span style={{ fontSize: '0.75rem', background: '#ffeaa7', color: '#d35400', padding: '2px 6px', borderRadius: '10px', marginLeft: '8px', fontWeight: 'bold' }}>🔥 {item.calories} kcal</span>}
                                        </h4>
                                        <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>{item.description}</p>
                                    </div>
                                    <div style={{ textAlign: 'right', paddingRight: '15px', flexShrink: 0 }}>
                                        <div style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '1.2rem' }}>৳{item.price}</div>
                                        <span style={{ fontSize: '0.8rem', color: item.is_available ? '#2ecc71' : '#e74c3c' }}>
                                            {item.is_available ? 'In Stock' : 'Out of Stock'}
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