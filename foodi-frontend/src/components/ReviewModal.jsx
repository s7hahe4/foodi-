import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { API } from '../api/client';

const RATING_LABELS = {
    1: '😡 Poor',
    2: '😕 Fair',
    3: '🙂 Good',
    4: '😊 Very Good',
    5: '🤩 Excellent!'
};

const ReviewModal = ({ isOpen, onClose, order, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (order && order.review_rating) {
            setRating(order.review_rating);
            setComment(order.review_comment || '');
        } else {
            setRating(5);
            setComment('');
        }
    }, [order]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('access_token');

        try {
            const restaurantId = order.restaurant || order.restaurant_id;
            const res = await fetch(`${API}/api/restaurants/${restaurantId}/reviews/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating,
                    comment,
                    order_id: order.id
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Thank you for rating your meal! ⭐', {
                    description: `Your ${rating}-star review for ${order.restaurant_name} has been published.`
                });
                if (onReviewSubmitted) {
                    onReviewSubmitted(data);
                }
                onClose();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Review submit error:', error);
            toast.error('Network error submitting review.');
        } finally {
            setSubmitting(false);
        }
    };

    const currentDisplayRating = hoveredRating || rating;

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
                borderRadius: '22px',
                padding: '30px 28px',
                maxWidth: '460px',
                width: '100%',
                boxShadow: '0 25px 40px -10px rgba(0, 0, 0, 0.3)',
                border: '1px solid #e2e8f0',
                boxSizing: 'border-box',
                position: 'relative'
            }}>
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '18px',
                        right: '18px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        margin: 0,
                        padding: 0
                    }}
                >
                    ✕
                </button>

                {/* Header Badge */}
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        color: '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        margin: '0 auto 12px',
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)'
                    }}>
                        ⭐
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                        Rate Your Experience
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                        How was your meal from <strong style={{ color: '#1e293b' }}>{order.restaurant_name}</strong> (Order #{order.id})?
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Star Rating Selector */}
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        fontSize: '2.5rem',
                                        cursor: 'pointer',
                                        color: star <= currentDisplayRating ? '#f59e0b' : '#cbd5e1',
                                        transition: 'transform 0.15s, color 0.15s',
                                        transform: star <= currentDisplayRating ? 'scale(1.15)' : 'scale(1)',
                                        padding: '0 4px',
                                        margin: 0,
                                        width: 'auto'
                                    }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <div style={{
                            marginTop: '8px',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: currentDisplayRating >= 4 ? '#059669' : currentDisplayRating === 3 ? '#d97706' : '#dc2626'
                        }}>
                            {RATING_LABELS[currentDisplayRating]}
                        </div>
                    </div>

                    {/* Feedback Comment */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                            Your Review (Optional)
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Share your thoughts on food taste, freshness, portion size, and delivery speed..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.88rem',
                                color: '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                margin: 0
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                borderRadius: '10px',
                                color: '#475569',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                margin: 0,
                                width: 'auto'
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                flex: 1.5,
                                padding: '12px 18px',
                                background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '0.92rem',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                boxShadow: submitting ? 'none' : '0 4px 14px rgba(217, 119, 6, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                margin: 0,
                                width: 'auto'
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Review ⭐'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
