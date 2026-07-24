import { createContext, useState, useContext } from 'react';

// 1. Create the Context
const CartContext = createContext();

// 2. Create a custom hook so other files can easily grab the cart data
export const useCart = () => useContext(CartContext);

// 3. Create the Provider (the wrapper that holds the memory)
export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({});

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev[item.id];
            return {
                ...prev,
                [item.id]: {
                    item,
                    quantity: existing ? existing.quantity + 1 : 1
                }
            };
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const existing = prev[itemId];
            if (!existing || existing.quantity <= 1) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
        });
    };

    const clearCart = () => setCart({});

    // Helpful calculated values
    const cartItems = Object.values(cart);
    const cartCount = cartItems.reduce((sum, { quantity }) => sum + quantity, 0);
    const cartTotal = cartItems.reduce((sum, { item, quantity }) => {
        const price = item.discounted_price || item.price;
        return sum + parseFloat(price) * quantity;
    }, 0);

    return (
        <CartContext.Provider value={{ cart, cartItems, addToCart, removeFromCart, clearCart, cartCount, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};