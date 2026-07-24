import { useNavigate } from 'react-router-dom';

const BackButton = ({ color = '#2c3e50', className }) => {
    const navigate = useNavigate();
    return (
        <button 
            onClick={() => navigate(-1)} 
            className={className}
            style={{
                background: 'transparent',
                border: 'none',
                color: color,
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '10px 0',
                marginBottom: '15px'
            }}
            onMouseEnter={(e) => e.target.style.color = '#e67e22'}
            onMouseLeave={(e) => e.target.style.color = color}
        >
            ← Back
        </button>
    );
};

export default BackButton;
