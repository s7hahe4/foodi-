const AdminUserProfile = ({ userId, onBack }) => {
    const [details, setDetails] = useState(null);

    useEffect(() => {
        const fetchUserActivity = async () => {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://127.0.0.1:8000/api/users/admin/users/${userId}/detail/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setDetails(data);
        };
        fetchUserActivity();
    }, [userId]);

    if (!details) return <div>Analyzing user data...</div>;

    return (
        <div className="admin-profile-view">
            <button onClick={onBack}>← Back to List</button>
            
            <div className="profile-header">
                <h2>{details.profile.username}'s Activity</h2>
                <span className={`role-badge ${details.profile.role}`}>{details.profile.role}</span>
            </div>

            <div className="activity-section">
                <div className="card">
                    <h4>Current Status</h4>
                    <p>{details.profile.is_restricted ? "⚠️ Restricted" : "✅ Normal"}</p>
                    <button className="btn-restrict" onClick={() => toggleRestriction(userId)}>
                        {details.profile.is_restricted ? "Lift Restriction" : "Restrict Account"}
                    </button>
                </div>

                {details.business && (
                    <div className="card">
                        <h4>Sale Posts (Restaurant)</h4>
                        <p><strong>{details.business.restaurant_name}</strong></p>
                        <p>Menu Items: {details.business.menu_items_count}</p>
                    </div>
                )}
            </div>
        </div>
    );
};