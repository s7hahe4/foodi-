import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// ── Tiny shared helpers ───────────────────────────────────────────────────────
const API = 'http://127.0.0.1:8000/api';
const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
});

// ── Sub-sections ──────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, color }) => (
    <div style={{
        background: 'white', borderRadius: 16, padding: '22px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', flex: '1 1 180px',
        borderTop: `4px solid ${color}`, minWidth: 160,
    }}>
        <div style={{ fontSize: '2rem', marginBottom: 6 }}>{icon}</div>
        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1e293b' }}>{value}</div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sub}</div>}
    </div>
);

const EarningBar = ({ label, amount, max, color }) => (
    <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>{label}</span>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>৳{amount.toFixed(2)}</span>
        </div>
        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99 }}>
            <div style={{
                height: 8, borderRadius: 99, background: color,
                width: max > 0 ? `${Math.min((amount / max) * 100, 100)}%` : '0%',
                transition: 'width 0.6s ease',
            }} />
        </div>
    </div>
);

// ── SECTION: Overview (Stats) ─────────────────────────────────────────────────
const OverviewSection = ({ stats }) => {
    if (!stats) return <div style={{ textAlign: 'center', padding: 60 }}>⏳ Loading stats...</div>;
    const maxEarn = Math.max(stats.today_earned, stats.week_earned, stats.month_earned, 1);
    return (
        <div>
            {/* Earnings Cards */}
            <h3 style={sectionTitle}>💰 Earnings</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
                <StatCard icon="📅" label="Today" value={`৳${stats.today_earned.toFixed(0)}`} sub={`${stats.today_deliveries} deliver${stats.today_deliveries !== 1 ? 'ies' : 'y'}`} color="#f59e0b" />
                <StatCard icon="📆" label="This Week" value={`৳${stats.week_earned.toFixed(0)}`} sub={`${stats.week_deliveries} deliveries`} color="#3b82f6" />
                <StatCard icon="🗓️" label="This Month" value={`৳${stats.month_earned.toFixed(0)}`} color="#8b5cf6" />
                <StatCard icon="💼" label="All-Time" value={`৳${stats.total_earned.toFixed(0)}`} sub={`${stats.total_deliveries} total`} color="#10b981" />
            </div>

            {/* Earning Breakdown Bar */}
            <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 32 }}>
                <h4 style={{ margin: '0 0 20px', color: '#1e293b' }}>📊 Earnings Breakdown</h4>
                <EarningBar label="Today" amount={stats.today_earned} max={maxEarn} color="#f59e0b" />
                <EarningBar label="This Week" amount={stats.week_earned} max={maxEarn} color="#3b82f6" />
                <EarningBar label="This Month" amount={stats.month_earned} max={maxEarn} color="#8b5cf6" />
            </div>

            {/* Performance Metrics */}
            <h3 style={sectionTitle}>⚡ Performance</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <StatCard icon="🏆" label="Total Deliveries" value={stats.total_deliveries} color="#e67e22" />
                <StatCard icon="✅" label="Acceptance Rate" value={`${stats.acceptance_rate}%`} sub="based on assigned orders" color="#27ae60" />
                <StatCard icon="🛵" label="Active Now" value={stats.active_deliveries} sub="out for delivery" color="#e74c3c" />
            </div>
        </div>
    );
};

// ── SECTION: Delivery History ─────────────────────────────────────────────────
const HistorySection = ({ history }) => {
    if (!history) return <div style={{ textAlign: 'center', padding: 60 }}>⏳ Loading...</div>;
    if (history.length === 0) return (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
            <p style={{ fontSize: '3rem', margin: '0 0 10px' }}>📦</p>
            <h3 style={{ color: '#475569', margin: 0 }}>No completed deliveries yet</h3>
            <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>Your delivered orders will appear here.</p>
        </div>
    );
    return (
        <div>
            <h3 style={sectionTitle}>📋 Delivery History ({history.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.map(order => (
                    <div key={order.id} style={{
                        background: 'white', borderRadius: 12, padding: '16px 20px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        flexWrap: 'wrap', gap: 12,
                    }}>
                        <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                                Order #{order.id} — {order.restaurant_name}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                📍 To: <strong>{order.customer_username}</strong>
                                &nbsp;•&nbsp;
                                🕐 {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#10b981' }}>
                                +৳{parseFloat(order.delivery_fee).toFixed(2)}
                            </div>
                            <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                                ✅ Delivered
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── SECTION: Profile & Settings ───────────────────────────────────────────────
const ProfileSection = ({ profile, onSaved }) => {
    const [form, setForm] = useState({ username: '', email: '', phone_number: '', address: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (profile) setForm({
            username: profile.username || '',
            email: profile.email || '',
            phone_number: profile.phone_number || '',
            address: profile.address || '',
        });
    }, [profile]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch(`${API}/users/profile/`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setMsg({ type: 'success', text: 'Profile updated successfully!' });
                onSaved();
            } else {
                const err = await res.json();
                setMsg({ type: 'error', text: JSON.stringify(err) });
            }
        } catch {
            setMsg({ type: 'error', text: 'Network error. Try again.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <h3 style={sectionTitle}>👤 My Profile</h3>
            <div style={card}>
                {/* Avatar banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, padding: '20px 24px', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: 12, color: 'white' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>
                        🛵
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{profile?.username}</div>
                        <div style={{ opacity: 0.75, fontSize: '0.85rem', marginTop: 3 }}>Delivery Rider · Member since {new Date(profile?.date_joined).getFullYear()}</div>
                    </div>
                </div>

                {msg && (
                    <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.9rem' }}>
                        {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
                    </div>
                )}

                <form onSubmit={handleSave}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, marginBottom: 20 }}>
                        {[
                            { key: 'username', label: 'Username', icon: '👤', type: 'text' },
                            { key: 'email', label: 'Email Address', icon: '📧', type: 'email' },
                            { key: 'phone_number', label: 'Phone Number', icon: '📱', type: 'tel' },
                            { key: 'address', label: 'Home Address', icon: '🏠', type: 'text' },
                        ].map(({ key, label, icon, type }) => (
                            <div key={key}>
                                <label style={inputLabel}>{icon} {label}</label>
                                <input
                                    type={type}
                                    value={form[key]}
                                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                        ))}
                    </div>
                    <button type="submit" disabled={saving} style={primaryBtn('#f59e0b')}>
                        {saving ? 'Saving...' : '💾 Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ── SECTION: Password Reset ───────────────────────────────────────────────────
const PasswordSection = () => {
    const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const strength = (pw) => {
        if (!pw) return { score: 0, label: '', color: '#e2e8f0' };
        let s = 0;
        if (pw.length >= 8) s++;
        if (/[A-Z]/.test(pw)) s++;
        if (/[0-9]/.test(pw)) s++;
        if (/[^A-Za-z0-9]/.test(pw)) s++;
        const map = [
            { score: 0, label: '', color: '#e2e8f0' },
            { score: 1, label: 'Weak', color: '#ef4444' },
            { score: 2, label: 'Fair', color: '#f97316' },
            { score: 3, label: 'Good', color: '#eab308' },
            { score: 4, label: 'Strong', color: '#22c55e' },
        ];
        return map[s];
    };

    const pw = strength(form.new_password);

    const handleChange = async (e) => {
        e.preventDefault();
        if (form.new_password !== form.confirm) {
            setMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (form.new_password.length < 8) {
            setMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
            return;
        }
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch(`${API}/users/change-password/`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg({ type: 'success', text: 'Password changed successfully! Please log in again.' });
                setForm({ current_password: '', new_password: '', confirm: '' });
            } else {
                setMsg({ type: 'error', text: data.error || 'Failed to change password.' });
            }
        } catch {
            setMsg({ type: 'error', text: 'Network error.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <h3 style={sectionTitle}>🔐 Change Password</h3>
            <div style={card}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: '0.9rem', color: '#475569' }}>
                    💡 <strong>Tip:</strong> Use a mix of uppercase letters, numbers, and symbols for a strong password.
                </div>

                {msg && (
                    <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: '0.9rem' }}>
                        {msg.type === 'success' ? '✅' : '⚠️'} {msg.text}
                    </div>
                )}

                <form onSubmit={handleChange}>
                    {/* Current Password */}
                    <div style={{ marginBottom: 18 }}>
                        <label style={inputLabel}>🔑 Current Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showCurrent ? 'text' : 'password'} value={form.current_password}
                                onChange={e => setForm(p => ({ ...p, current_password: e.target.value }))}
                                style={{ ...inputStyle, paddingRight: 44 }} required
                                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <button type="button" onClick={() => setShowCurrent(s => !s)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                                {showCurrent ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div style={{ marginBottom: 8 }}>
                        <label style={inputLabel}>🆕 New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input type={showNew ? 'text' : 'password'} value={form.new_password}
                                onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))}
                                style={{ ...inputStyle, paddingRight: 44 }} required
                                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <button type="button" onClick={() => setShowNew(s => !s)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                                {showNew ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Strength Meter */}
                    {form.new_password && (
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                                <div style={{ height: 6, borderRadius: 99, background: pw.color, width: `${(pw.score / 4) * 100}%`, transition: 'all 0.3s' }} />
                            </div>
                            <div style={{ fontSize: '0.78rem', color: pw.color, fontWeight: 700 }}>
                                {pw.label && `Password strength: ${pw.label}`}
                            </div>
                        </div>
                    )}

                    {/* Confirm */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={inputLabel}>🔁 Confirm New Password</label>
                        <input type="password" value={form.confirm}
                            onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                            style={{
                                ...inputStyle,
                                borderColor: form.confirm && form.confirm !== form.new_password ? '#ef4444' : '#e2e8f0',
                            }} required
                            onFocus={e => e.target.style.borderColor = form.confirm !== form.new_password ? '#ef4444' : '#f59e0b'}
                            onBlur={e => e.target.style.borderColor = form.confirm !== form.new_password ? '#ef4444' : '#e2e8f0'}
                        />
                        {form.confirm && form.confirm !== form.new_password && (
                            <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: '4px 0 0' }}>⚠️ Passwords don't match</p>
                        )}
                    </div>

                    <button type="submit" disabled={saving} style={primaryBtn('#ef4444')}>
                        {saving ? 'Changing...' : '🔐 Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ── SECTION: Settings & Preferences ──────────────────────────────────────────
const SettingsSection = ({ onLogout }) => {
    const [notifications, setNotifications] = useState({
        new_order: true,
        earnings_update: true,
        system_alerts: true,
    });
    const [vehicle, setVehicle] = useState(localStorage.getItem('rider_vehicle') || 'motorcycle');
    const [saved, setSaved] = useState(false);

    const handleSaveSettings = () => {
        localStorage.setItem('rider_vehicle', vehicle);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const ToggleRow = ({ label, desc, stateKey }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{desc}</div>
            </div>
            <button
                onClick={() => setNotifications(p => ({ ...p, [stateKey]: !p[stateKey] }))}
                style={{
                    width: 48, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: notifications[stateKey] ? '#f59e0b' : '#e2e8f0',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
            >
                <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: 'white',
                    position: 'absolute', top: 3, left: notifications[stateKey] ? 24 : 4,
                    transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }} />
            </button>
        </div>
    );

    return (
        <div>
            <h3 style={sectionTitle}>⚙️ Settings & Preferences</h3>

            {/* Vehicle Type */}
            <div style={card}>
                <h4 style={{ margin: '0 0 16px', color: '#1e293b' }}>🛵 Vehicle Type</h4>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                    {[
                        { value: 'motorcycle', label: '🏍️ Motorcycle' },
                        { value: 'bicycle', label: '🚲 Bicycle' },
                        { value: 'car', label: '🚗 Car' },
                        { value: 'scooter', label: '🛵 Scooter' },
                    ].map(v => (
                        <button key={v.value} onClick={() => setVehicle(v.value)} style={{
                            padding: '10px 18px', borderRadius: 8, border: `2px solid ${vehicle === v.value ? '#f59e0b' : '#e2e8f0'}`,
                            background: vehicle === v.value ? '#fef3c7' : 'white', cursor: 'pointer',
                            fontWeight: 600, color: vehicle === v.value ? '#92400e' : '#64748b',
                            transition: 'all 0.2s', fontSize: '0.9rem',
                        }}>
                            {v.label}
                        </button>
                    ))}
                </div>

                {/* Notification Toggles */}
                <h4 style={{ margin: '24px 0 8px', color: '#1e293b' }}>🔔 Notification Preferences</h4>
                <ToggleRow label="New Order Alerts" desc="Get notified when a new delivery is available" stateKey="new_order" />
                <ToggleRow label="Earnings Updates" desc="Daily summary of your earnings" stateKey="earnings_update" />
                <ToggleRow label="System Alerts" desc="App updates and important notices" stateKey="system_alerts" />

                <div style={{ marginTop: 24 }}>
                    <button onClick={handleSaveSettings} style={primaryBtn('#f59e0b')}>
                        {saved ? '✅ Saved!' : '💾 Save Preferences'}
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div style={{ ...card, borderColor: '#fee2e2', background: '#fff5f5', marginTop: 24 }}>
                <h4 style={{ margin: '0 0 12px', color: '#dc2626' }}>⚠️ Account Actions</h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 16px' }}>
                    Logging out will end your current session. Any active deliveries will remain tracked.
                </p>
                <button onClick={onLogout} style={{
                    padding: '12px 24px', borderRadius: 8, border: '2px solid #ef4444',
                    background: 'white', color: '#ef4444', fontWeight: 700, cursor: 'pointer',
                    fontSize: '0.95rem', transition: 'all 0.2s',
                }}
                    onMouseEnter={e => { e.target.style.background = '#ef4444'; e.target.style.color = 'white'; }}
                    onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.color = '#ef4444'; }}
                >
                    🚪 Log Out
                </button>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const RiderAccount = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        try {
            const [profRes, statsRes] = await Promise.all([
                fetch(`${API}/users/profile/`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/menu/orders/rider/stats/`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (profRes.ok) setProfile(await profRes.json());
            if (statsRes.ok) {
                const d = await statsRes.json();
                setStats(d.stats);
                setHistory(d.history);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    const TABS = [
        { id: 'overview', label: '📊 Overview', },
        { id: 'history', label: '📋 History', },
        { id: 'profile', label: '👤 Profile', },
        { id: 'password', label: '🔐 Password', },
        { id: 'settings', label: '⚙️ Settings', },
    ];

    if (loading) return (
        <div style={{ textAlign: 'center', paddingTop: 100 }}>
            <p style={{ fontSize: '2.5rem' }}>⏳</p>
            <p style={{ color: '#64748b' }}>Loading your account...</p>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
            {/* ── Top Header ── */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <Link to="/rider-dashboard" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ← Back to Deliveries
                </Link>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <h1 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>
                        🛵 Rider Account
                    </h1>
                    {profile && <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>{profile.username} · {profile.email}</p>}
                </div>
                <div style={{ width: 120 }} />
            </div>

            {/* ── Tab Navigation ── */}
            <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                <div style={{ display: 'flex', maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            color: activeTab === tab.id ? '#f59e0b' : '#64748b',
                            borderBottom: activeTab === tab.id ? '3px solid #f59e0b' : '3px solid transparent',
                            fontSize: '0.9rem', whiteSpace: 'nowrap', transition: 'all 0.2s',
                        }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Section Content ── */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>
                {activeTab === 'overview'  && <OverviewSection stats={stats} />}
                {activeTab === 'history'   && <HistorySection history={history} />}
                {activeTab === 'profile'   && <ProfileSection profile={profile} onSaved={fetchAll} />}
                {activeTab === 'password'  && <PasswordSection />}
                {activeTab === 'settings'  && <SettingsSection onLogout={handleLogout} />}
            </div>
        </div>
    );
};

// ── Shared Style Tokens ───────────────────────────────────────────────────────
const sectionTitle = { margin: '0 0 16px', color: '#1e293b', fontSize: '1.1rem', fontWeight: 700 };
const card = { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 24, border: '1px solid #f1f5f9' };
const inputLabel = { display: 'block', marginBottom: 6, color: '#475569', fontSize: '0.85rem', fontWeight: 600 };
const inputStyle = {
    width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0',
    borderRadius: 8, fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s', background: '#fafafa', color: '#1e293b',
};
const primaryBtn = (bg) => ({
    padding: '12px 28px', background: bg, color: 'white', border: 'none',
    borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem',
    boxShadow: `0 4px 12px ${bg}44`, transition: 'all 0.2s',
});

export default RiderAccount;
