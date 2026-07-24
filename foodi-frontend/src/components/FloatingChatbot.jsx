import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MOOD_OPTIONS = [
    { label: '🌶️ Spicy', value: 'Spicy' },
    { label: '🍰 Sweet', value: 'Sweet' },
    { label: '🍔 Fast Food', value: 'Fast Food' },
    { label: '🥗 Healthy', value: 'Healthy' },
    { label: '🍕 Pizza', value: 'Pizza' },
    { label: '🍜 Noodles', value: 'Noodles' },
    { label: '🍗 Chicken', value: 'Chicken' },
    { label: '🍛 Main Course', value: 'Main Course' },
];

const BUDGET_OPTIONS = [
    { label: '৳50 - ৳100', value: 100 },
    { label: '৳100 - ৳200', value: 200 },
    { label: '৳200 - ৳500', value: 500 },
    { label: '৳500+', value: 5000 },
];

const FloatingChatbot = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [step, setStep] = useState('greeting'); // greeting | mood | budget | calories | loading | results
    const [selectedMood, setSelectedMood] = useState(null);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [calorieLimit, setCalorieLimit] = useState('');
    const chatEndRef = useRef(null);

    // Auto-scroll to the bottom of the chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Show the greeting when opened for the first time
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                sender: 'bot',
                text: "Hi! 👋 I'm your Foodi++ Assistant. Hungry? Tell me what you're in the mood for!",
                timestamp: Date.now()
            }]);
            setStep('mood');
        }
    }, [isOpen]);

    const addBotMessage = (text, extra = {}) => {
        setMessages(prev => [...prev, { sender: 'bot', text, timestamp: Date.now(), ...extra }]);
    };

    const addUserMessage = (text) => {
        setMessages(prev => [...prev, { sender: 'user', text, timestamp: Date.now() }]);
    };

    const handleMoodSelect = (mood) => {
        addUserMessage(mood.label);
        setSelectedMood(mood.value);
        setTimeout(() => {
            addBotMessage("Got it! 💰 What is your maximum budget for today?");
            setStep('budget');
        }, 400);
    };

    const handleBudgetSelect = (budget) => {
        addUserMessage(budget.label);
        setSelectedBudget(budget.value);
        setTimeout(() => {
            addBotMessage("Awesome! Do you have a calorie limit for this meal?");
            setStep('calories');
        }, 400);
    };

    const handleCalorieSubmit = async (e, isNoLimit = false) => {
        if (e) e.preventDefault();
        
        const limitVal = isNoLimit ? 'No limit' : calorieLimit + ' kcal';
        addUserMessage(limitVal);
        setStep('loading');

        setTimeout(() => {
            addBotMessage("🔍 Searching for the best food for you...");
        }, 300);

        try {
            let url = `http://127.0.0.1:8000/api/menu/recommend/?mood=${encodeURIComponent(selectedMood)}&budget=${selectedBudget}`;
            if (!isNoLimit && calorieLimit) {
                url += `&max_calories=${calorieLimit}`;
            }

            const res = await fetch(url);

            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    setTimeout(() => {
                        addBotMessage("🎉 Here are my top picks for you!", { results: data });
                        setStep('results');
                    }, 800);
                } else {
                    setTimeout(() => {
                        addBotMessage("😔 Sorry, I couldn't find any items matching your mood and budget. Try a different combination!");
                        setStep('results');
                    }, 800);
                }
            } else {
                setTimeout(() => {
                    addBotMessage("⚠️ Oops! Something went wrong. Please try again later.");
                    setStep('results');
                }, 800);
            }
        } catch (err) {
            console.error("Bot fetch error:", err);
            setTimeout(() => {
                addBotMessage("⚠️ Network error. Please check your connection.");
                setStep('results');
            }, 800);
        }
    };

    const handleRestart = () => {
        setMessages([{
            sender: 'bot',
            text: "Hi again! 👋 What are you in the mood for this time?",
            timestamp: Date.now()
        }]);
        setStep('mood');
        setSelectedMood(null);
        setSelectedBudget(null);
        setCalorieLimit('');
    };

    const handleGoToRestaurant = (restaurantId) => {
        navigate(`/restaurant/${restaurantId}`);
        setIsOpen(false);
    };

    return (
        <>
            {/* ─── FLOATING BUTTON ─── */}
            <button
                id="chatbot-toggle"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '85px',
                    right: '25px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e67e22, #d35400)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 6px 20px rgba(230, 126, 34, 0.4)',
                    cursor: 'pointer',
                    fontSize: '1.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = isOpen ? 'rotate(90deg) scale(1.1)' : 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)'}
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* ─── CHAT WINDOW ─── */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '155px',
                    right: '25px',
                    width: '380px',
                    maxHeight: '520px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 9998,
                    overflow: 'hidden',
                    animation: 'chatSlideUp 0.3s ease-out',
                    fontFamily: '"Inter", sans-serif',
                }}>

                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #2c3e50, #34495e)',
                        color: 'white',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.3rem',
                        }}>🤖</div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>Foodi++ Assistant</div>
                            <div style={{ fontSize: '0.75rem', color: '#bdc3c7' }}>Always here to help you eat well</div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        background: '#f8f9fa',
                        maxHeight: '350px',
                    }}>
                        {messages.map((msg, idx) => (
                            <div key={idx}>
                                {/* Message Bubble */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                }}>
                                    <div style={{
                                        maxWidth: '85%',
                                        padding: '10px 14px',
                                        borderRadius: msg.sender === 'user'
                                            ? '14px 14px 4px 14px'
                                            : '14px 14px 14px 4px',
                                        background: msg.sender === 'user'
                                            ? 'linear-gradient(135deg, #e67e22, #d35400)'
                                            : 'white',
                                        color: msg.sender === 'user' ? 'white' : '#2c3e50',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.4',
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>

                                {/* Result Cards (rendered below the bot message) */}
                                {msg.results && msg.results.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                        {msg.results.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleGoToRestaurant(item.restaurant_id)}
                                                style={{
                                                    background: 'white',
                                                    borderRadius: '12px',
                                                    padding: '12px',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                    cursor: 'pointer',
                                                    border: item.has_offer ? '2px solid #e67e22' : '1px solid #eee',
                                                    transition: 'transform 0.2s',
                                                    position: 'relative',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                {/* Offer Badge */}
                                                {item.has_offer && (
                                                    <div style={{
                                                        position: 'absolute', top: '-8px', right: '10px',
                                                        background: '#e74c3c', color: 'white',
                                                        padding: '2px 8px', borderRadius: '10px',
                                                        fontSize: '0.7rem', fontWeight: 'bold',
                                                    }}>
                                                        🔥 {item.discount_percentage}% OFF
                                                    </div>
                                                )}

                                                <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem' }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#7f8c8d', margin: '4px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span>{item.restaurant_name} • {item.category}</span>
                                                    {item.calories && (
                                                        <span style={{ background: '#ffeaa7', color: '#d35400', padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                                            🔥 {item.calories} kcal
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {item.discounted_price ? (
                                                        <>
                                                            <span style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '1rem' }}>
                                                                ৳{item.discounted_price}
                                                            </span>
                                                            <del style={{ color: '#95a5a6', fontSize: '0.85rem' }}>৳{item.price}</del>
                                                        </>
                                                    ) : (
                                                        <span style={{ fontWeight: 'bold', color: '#e67e22', fontSize: '1rem' }}>
                                                            ৳{item.price}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.offer_title && (
                                                    <div style={{
                                                        marginTop: '6px', fontSize: '0.75rem',
                                                        color: '#e74c3c', fontWeight: 'bold',
                                                    }}>
                                                        🎁 {item.offer_title}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Option Buttons */}
                        {step === 'mood' && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                {MOOD_OPTIONS.map(mood => (
                                    <button
                                        key={mood.value}
                                        onClick={() => handleMoodSelect(mood)}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '20px',
                                            border: '2px solid #e67e22',
                                            background: 'white',
                                            color: '#e67e22',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#e67e22'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#e67e22'; }}
                                    >
                                        {mood.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 'budget' && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                {BUDGET_OPTIONS.map(budget => (
                                    <button
                                        key={budget.value}
                                        onClick={() => handleBudgetSelect(budget)}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '20px',
                                            border: '2px solid #27ae60',
                                            background: 'white',
                                            color: '#27ae60',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '0.85rem',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#27ae60'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#27ae60'; }}
                                    >
                                        {budget.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 'calories' && (
                            <form onSubmit={(e) => handleCalorieSubmit(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        type="number" 
                                        value={calorieLimit}
                                        onChange={(e) => setCalorieLimit(e.target.value)}
                                        placeholder="e.g. 500" 
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none' }}
                                        required
                                    />
                                    <button 
                                        type="submit"
                                        style={{ padding: '8px 14px', borderRadius: '20px', background: '#3498db', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Set
                                    </button>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => handleCalorieSubmit(null, true)}
                                    style={{ padding: '8px 14px', borderRadius: '20px', background: '#ecf0f1', color: '#7f8c8d', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                >
                                    No Limit
                                </button>
                            </form>
                        )}

                        {step === 'loading' && (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#7f8c8d' }}>
                                <div style={{
                                    display: 'inline-block',
                                    width: '30px', height: '30px',
                                    border: '3px solid #eee',
                                    borderTopColor: '#e67e22',
                                    borderRadius: '50%',
                                    animation: 'chatSpin 0.8s linear infinite',
                                }} />
                            </div>
                        )}

                        {step === 'results' && (
                            <button
                                onClick={handleRestart}
                                style={{
                                    marginTop: '4px',
                                    padding: '10px 20px',
                                    borderRadius: '20px',
                                    background: 'linear-gradient(135deg, #e67e22, #d35400)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    alignSelf: 'center',
                                }}
                            >
                                🔄 Search Again
                            </button>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                </div>
            )}

            {/* ─── ANIMATIONS ─── */}
            <style>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes chatSpin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
};

export default FloatingChatbot;
