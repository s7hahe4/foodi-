import { useEffect } from 'react';

const LogoutConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
            animation: 'fadeIn 0.15s ease-out'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '28px 26px',
                maxWidth: '430px',
                width: '100%',
                boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.3)',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#e11d48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    margin: '0 auto 16px',
                    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.15)'
                }}>
                    🚪
                </div>

                <h3 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                    {title || 'Do you want to log out?'}
                </h3>
                <p style={{ margin: '0 0 24px', fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5 }}>
                    {message || 'Are you sure you want to log out of your Foodi++ account or stay on this page?'}
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '12px 18px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '10px',
                            color: '#334155',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            margin: 0,
                            width: 'auto'
                        }}
                    >
                        Stay on Page
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        style={{
                            flex: 1.2,
                            padding: '12px 18px',
                            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                            transition: 'all 0.2s',
                            margin: 0,
                            width: 'auto'
                        }}
                    >
                        Yes, Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmDialog;
