import { useEffect, useState } from 'react';
import { API } from '../api/client';

const AdminUserManager = () => {
    const [users, setUsers] = useState([]);
    const [roleFilter, setRoleFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        const token = localStorage.getItem('access_token');
        let url = `${API}/api/users/admin/users/?role=${roleFilter}&search=${searchTerm}`;
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setUsers(data);
    };

    useEffect(() => { fetchUsers(); }, [roleFilter, searchTerm]);

    const toggleStatus = async (id) => {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API}/api/users/admin/users/${id}/toggle/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) { fetchUsers(); } // Refresh the list
    };

    return (
        <div className="admin-user-manager">
            <div className="admin-controls">
                <input 
                    type="text" 
                    placeholder="Search by username or email..." 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <select onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="owner">Restaurant Owners</option>
                    <option value="rider">Riders</option>
                </select>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                            <td>
                                <span className={u.is_active ? "text-success" : "text-danger"}>
                                    {u.is_active ? "● Active" : "● Restricted"}
                                </span>
                            </td>
                            <td>
                                <button 
                                    onClick={() => toggleStatus(u.id)} 
                                    className={u.is_active ? "btn-block" : "btn-unblock"}
                                >
                                    {u.is_active ? "Restrict" : "Unrestrict"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUserManager;