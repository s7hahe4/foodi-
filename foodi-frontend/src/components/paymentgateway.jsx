import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API } from '../api/client';
import { useCart } from './cartcontext';

const PaymentGateway = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { cartTotal, clearCart } = useCart();
    
    const [method, setMethod] = useState('card'); // 'card' or 'mobile'
    const [loading, setLoading] = useState(false);

    // Mock form states
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    
    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('access_token');

        try {
            // Simulate network delay for realism
            await new Promise(resolve => setTimeout(resolve, 1500));

            const res = await fetch(`${API}/api/menu/orders/pay/${orderId}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                clearCart();
                toast.success('Payment Successful! 🎉 Your order has been sent to the restaurant. Track it in Orders.');
                navigate('/orders');
            } else {
                toast.error('Payment verification failed.');
            }
        } catch (err) {
            console.error('Payment error:', err);
            toast.error('Payment network error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexWrap: 'wrap', gap: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                
                {/* ── LEFT SIDE: Order Summary ── */}
                <div style={{ flex: '1 1 300px', background: '#2c3e50', color: 'white', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '2rem' }}>Foodi++ Checkout</h2>
                    <p style={{ color: '#bdc3c7', marginBottom: '40px' }}>Complete your payment to finalize Order #{orderId}.</p>
                    
                    <div style={{ borderTop: '1px solid #34495e', borderBottom: '1px solid #34495e', padding: '20px 0', margin: '20px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                            <span>Total Amount</span>
                            <span style={{ fontWeight: 'bold', color: '#e67e22' }}>৳{cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <p style={{ fontSize: '0.8rem', color: '#7f8c8d', textAlign: 'center', marginTop: 'auto' }}>
                        🔒 Secure 256-bit SSL Encryption
                    </p>
                </div>

                {/* ── RIGHT SIDE: Payment Form ── */}
                <div style={{ flex: '1 1 400px', padding: '40px' }}>
                    <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Select Payment Method</h3>
                    
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                        <button 
                            type="button"
                            onClick={() => setMethod('card')}
                            style={{ flex: 1, padding: '15px', border: method === 'card' ? '2px solid #3498db' : '1px solid #ddd', background: method === 'card' ? '#ebf5fb' : 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50', transition: '0.2s' }}
                        >
                            💳 Credit/Debit Card
                        </button>
                        <button 
                            type="button"
                            onClick={() => setMethod('mobile')}
                            style={{ flex: 1, padding: '15px', border: method === 'mobile' ? '2px solid #e67e22' : '1px solid #ddd', background: method === 'mobile' ? '#fdf2e9' : 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50', transition: '0.2s' }}
                        >
                            📱 Mobile Banking
                        </button>
                    </div>

                    <form onSubmit={handlePayment}>
                        {method === 'card' ? (
                            <div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#7f8c8d', fontSize: '0.9rem' }}>Card Number</label>
                                    <input 
                                        type="text" 
                                        placeholder="0000 0000 0000 0000" 
                                        required 
                                        maxLength="19"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#7f8c8d', fontSize: '0.9rem' }}>Expiry Date</label>
                                        <input 
                                            type="text" 
                                            placeholder="MM/YY" 
                                            required 
                                            maxLength="5"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#7f8c8d', fontSize: '0.9rem' }}>CVC</label>
                                        <input 
                                            type="password" 
                                            placeholder="•••" 
                                            required 
                                            maxLength="3"
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value)}
                                            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '30px', textAlign: 'center', padding: '20px', background: '#fdf2e9', borderRadius: '8px', border: '1px dashed #e67e22' }}>
                                <p style={{ color: '#e67e22', margin: '0 0 10px 0', fontWeight: 'bold' }}>bKash / Nagad / Rocket</p>
                                <input 
                                    type="text" 
                                    placeholder="Enter Mobile Number" 
                                    required 
                                    style={{ width: '100%', padding: '12px', border: '1px solid #e67e22', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', textAlign: 'center' }}
                                />
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ width: '100%', padding: '16px', background: loading ? '#95a5a6' : '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.3s' }}
                        >
                            {loading ? 'Processing Payment... 🔄' : `Pay ৳${cartTotal.toFixed(2)}`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
