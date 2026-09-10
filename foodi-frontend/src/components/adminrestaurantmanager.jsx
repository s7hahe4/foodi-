import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { API } from '../api/client';

const AdminRestaurantManager = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRestaurants = async () => {
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API}/api/users/admin/list/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRestaurants(data);
            } else {
                console.error('Failed to fetch restaurants:', res.status);
            }
        } catch (err) {
            console.error('Network error fetching restaurants:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRestaurants(); }, []);

    const updateStatus = async (id, newStatus) => {
        const token = localStorage.getItem('access_token');
        const url = `${API}/api/users/admin/approve/${id}/`;

        console.log(`Attempting to set status="${newStatus}" on restaurant ID: ${id}`);

        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await res.json();

            if (res.ok) {
                // Update local state directly so the UI refreshes instantly
                setRestaurants(prev =>
                    prev.map(r =>
                        r.id === id
                            ? { ...r, status: data.status, is_verified: data.is_verified }
                            : r
                    )
                );
            } else {
                console.error('Server Error:', data);
                toast.error('Error: ' + (data.error || 'Could not update status.'));
            }
        } catch (err) {
            console.error('Network Error:', err);
            toast.error('Network error: Is the Django server running?');
        }
    };

    /**
     * Renders the correct action buttons based on the restaurant's current status:
     *  - pending  → [Approve] [Reject]
     *  - approved → [Suspend]
     *  - suspended→ [Reactivate] [Reject]
     *  - rejected → [Approve]
     */
    const renderActions = (r) => {
        switch (r.status) {
            case 'pending':
                return (
                    <>
                        <button onClick={() => updateStatus(r.id, 'approved')} className="btn-approve">✔ Approve</button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} className="btn-reject">✖ Reject</button>
                    </>
                );
            case 'approved':
                return (
                    <button onClick={() => updateStatus(r.id, 'suspended')} className="btn-block">⏸ Suspend</button>
                );
            case 'suspended':
                return (
                    <>
                        <button onClick={() => updateStatus(r.id, 'approved')} className="btn-approve">▶ Reactivate</button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} className="btn-reject">✖ Reject</button>
                    </>
                );
            case 'rejected':
                return (
                    <button onClick={() => updateStatus(r.id, 'approved')} className="btn-approve">↩ Approve</button>
                );
            default:
                return null;
        }
    };

    if (loading) return <p style={{ padding: '20px' }}>Loading restaurants...</p>;

    return (
        <div className="admin-table-container">
            <h3>Restaurant Approvals</h3>
            {restaurants.length === 0 ? (
                <p style={{ padding: '20px', color: '#7f8c8d' }}>No restaurants found.</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Restaurant Name</th>
                            <th>Owner</th>
                            <th>Area</th>
                            <th>City</th>
                            <th>Status</th>
                            <th>Verified</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {restaurants.map((r) => (
                            <tr key={r.id}>
                                <td><strong>{r.name}</strong></td>
                                <td>{r.owner_username}</td>
                                <td>{r.area}</td>
                                <td>{r.city}</td>
                                <td>
                                    <span className={`status-badge ${r.status}`}>{r.status}</span>
                                </td>
                                <td>{r.is_verified ? '✅' : '—'}</td>
                                <td style={{ display: 'flex', gap: '6px' }}>
                                    {renderActions(r)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminRestaurantManager;