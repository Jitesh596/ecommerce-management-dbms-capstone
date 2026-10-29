import { createContext, useState } from "react";

export const CartContext = createContext();

function CartProvider({ children }) {
    const [cart, setCart] = useState([]);

    // Add product to cart (prevent duplicates)
    const addToCart = (product) => {
        const exists = cart.find((item) => item.id === product.id);
        if (exists) {
            alert("Item already in cart!");
            return;
        }
        setCart([...cart, product]);
    };

    // Remove product from cart
    const removeFromCart = (id) => {
        const updatedCart = cart.filter((item) => item.id !== id);
        setCart(updatedCart);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
            {children}
        </CartContext.Provider>
    );
}

export default CartProvider;