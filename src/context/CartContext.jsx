import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

const CART_STORAGE_KEY = "fashionista_cart_items";
const WISHLIST_STORAGE_KEY = "fashionista_wishlist_items";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart to localStorage", err);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (err) {
      console.error("Failed to save wishlist to localStorage", err);
    }
  }, [wishlist]);

  // Add product to cart with quantity & stock limit checking
  const addToCart = (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, Number(quantity) || 1);
    const existingIndex = cart.findIndex((item) => item.id === product.id);

    const availableStock = typeof product.stock === "number" ? product.stock : 999;
    if (availableStock <= 0) {
      alert(`Sorry, "${product.title || product.product_name}" is currently out of stock.`);
      return false;
    }

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity || 1;
      const newQty = currentQty + qtyToAdd;
      if (newQty > availableStock) {
        alert(`Only ${availableStock} units available in stock for this item.`);
        return false;
      }
      const updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty
      };
      setCart(updated);
    } else {
      if (qtyToAdd > availableStock) {
        alert(`Only ${availableStock} units available in stock for this item.`);
        return false;
      }
      setCart([...cart, { ...product, quantity: qtyToAdd }]);
    }
    return true;
  };

  // Update specific quantity
  const updateQuantity = (id, newQty) => {
    const qty = Number(newQty);
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const maxStock = typeof item.stock === "number" ? item.stock : 999;
          return { ...item, quantity: Math.min(qty, maxStock) };
        }
        return item;
      })
    );
  };

  // Remove product from cart
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Wishlist toggle
  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    if (exists) {
      setWishlist(wishlist.filter((item) => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const isInWishlist = (id) => wishlist.some((item) => item.id === id);

  // Derived metrics
  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        wishlist,
        toggleWishlist,
        isInWishlist
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default CartProvider;
