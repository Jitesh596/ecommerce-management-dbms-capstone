import { createContext, useState, useEffect } from "react";
import {
    getCart,
    addToCartApi,
    updateCartItemApi,
    removeCartItemApi,
    clearCartApi,
    getWishlist,
    addToWishlistApi,
    removeFromWishlistApi
} from "../services/api";

export const CartContext = createContext();

export function CartProvider({ children }) {
    // Local storage initial state for guest or offline caching
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem("fashionista_cart");
        return saved ? JSON.parse(saved) : [];
    });

    const [wishlist, setWishlist] = useState(() => {
        const saved = localStorage.getItem("fashionista_wishlist");
        return saved ? JSON.parse(saved) : [];
    });

    const [coupon, setCoupon] = useState(() => {
        const saved = localStorage.getItem("fashionista_coupon");
        return saved ? JSON.parse(saved) : null;
    });

    const token = localStorage.getItem("fashionista_token");

    // Fetch server cart & wishlist whenever user token changes
    useEffect(() => {
        if (token) {
            syncWithServer();
        }
    }, [token]);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem("fashionista_cart", JSON.stringify(cart));
    }, [cart]);

    // Save wishlist to localStorage
    useEffect(() => {
        localStorage.setItem("fashionista_wishlist", JSON.stringify(wishlist));
    }, [wishlist]);

    const syncWithServer = async () => {
        try {
            const serverCart = await getCart();
            if (serverCart && Array.isArray(serverCart.items)) {
                // Map backend cart items to consistent format
                const formatted = serverCart.items.map(item => ({
                    cart_item_id: item.cart_item_id,
                    id: item.product_id,
                    product_id: item.product_id,
                    title: item.product_name,
                    product_name: item.product_name,
                    price: item.effective_price || item.price,
                    original_price: item.price,
                    image: item.image_url,
                    image_url: item.image_url,
                    category: item.category,
                    brand: item.brand,
                    stock: item.stock,
                    quantity: item.quantity,
                    selected_size: item.selected_size,
                    selected_color: item.selected_color
                }));
                setCart(formatted);
            }

            const serverWishlist = await getWishlist();
            if (Array.isArray(serverWishlist)) {
                setWishlist(serverWishlist);
            }
        } catch (e) {
            console.error("Cart/Wishlist sync error:", e);
        }
    };

    /* ==================== CART ACTIONS ==================== */

    // Add product to cart with optional quantity, size and color
    const addToCart = async (product, quantity = 1, size = "M", color = "Default") => {
        // Enforce sign‑in before any cart mutation
        const token = localStorage.getItem("fashionista_token");
        if (!token) {
            // Do not modify local cart for guests; UI will handle notification
            return false;
        }

        const prodId = product.product_id || product.id;
        const availableStock = product.stock !== undefined ? product.stock : 99;

        // Check if item already in cart
        const existingIndex = cart.findIndex(
            (item) => (item.product_id === prodId || item.id === prodId) &&
                      item.selected_size === size &&
                      item.selected_color === color
        );

        let newCart = [...cart];

        if (existingIndex > -1) {
            const currentQty = newCart[existingIndex].quantity || 1;
            const newQty = currentQty + quantity;

            if (newQty > availableStock) {
                alert(`Cannot add more. Maximum available stock is ${availableStock}.`);
                return false;
            }

            newCart[existingIndex] = {
                ...newCart[existingIndex],
                quantity: newQty
            };

            if (token && newCart[existingIndex].cart_item_id) {
                try {
                    await updateCartItemApi(newCart[existingIndex].cart_item_id, newQty);
                } catch (e) {
                    console.error("Backend cart update error:", e);
                }
            }
        } else {
            if (quantity > availableStock) {
                alert(`Cannot add ${quantity} units. Only ${availableStock} available in stock.`);
                return false;
            }

            const unitPrice = product.discount_price !== null && product.discount_price !== undefined
                ? Number(product.discount_price)
                : Number(product.price);

            const newItem = {
                id: prodId,
                product_id: prodId,
                title: product.product_name || product.title,
                product_name: product.product_name || product.title,
                price: unitPrice,
                original_price: Number(product.price),
                image: product.image_url || product.image,
                image_url: product.image_url || product.image,
                category: product.category,
                brand: product.brand || "Fashionista",
                stock: availableStock,
                quantity: quantity,
                selected_size: size,
                selected_color: color
            };

            newCart.push(newItem);

            if (token) {
                try {
                    await addToCartApi({
                        product_id: prodId,
                        quantity,
                        selected_size: size,
                        selected_color: color
                    });
                    // Refresh from server to get generated cart_item_id
                    syncWithServer();
                } catch (e) {
                    console.error("Backend cart add error:", e);
                }
            }
        }

        setCart(newCart);
        return true;
    };

    // Remove single item from cart
    const removeFromCart = async (cartItemIdOrProdId) => {
        const itemToRemove = cart.find(
            item => item.cart_item_id === cartItemIdOrProdId || item.id === cartItemIdOrProdId || item.product_id === cartItemIdOrProdId
        );

        const updatedCart = cart.filter(
            item => item.cart_item_id !== cartItemIdOrProdId && item.id !== cartItemIdOrProdId && item.product_id !== cartItemIdOrProdId
        );
        setCart(updatedCart);

        if (token && itemToRemove?.cart_item_id) {
            try {
                await removeCartItemApi(itemToRemove.cart_item_id);
            } catch (e) {
                console.error("Backend remove error:", e);
            }
        }
    };

    // Update quantity for cart item
    const updateQuantity = async (cartItemIdOrProdId, delta) => {
        const index = cart.findIndex(
            item => item.cart_item_id === cartItemIdOrProdId || item.id === cartItemIdOrProdId || item.product_id === cartItemIdOrProdId
        );

        if (index === -1) return;

        const currentItem = cart[index];
        const newQty = (currentItem.quantity || 1) + delta;

        if (newQty <= 0) {
            removeFromCart(cartItemIdOrProdId);
            return;
        }

        if (newQty > currentItem.stock) {
            alert(`Only ${currentItem.stock} units available in stock.`);
            return;
        }

        const updated = [...cart];
        updated[index] = { ...currentItem, quantity: newQty };
        setCart(updated);

        if (token && currentItem.cart_item_id) {
            try {
                await updateCartItemApi(currentItem.cart_item_id, newQty);
            } catch (e) {
                console.error("Backend update quantity error:", e);
            }
        }
    };

    // Clear entire cart
    const clearCart = async () => {
        setCart([]);
        setCoupon(null);
        localStorage.removeItem("fashionista_coupon");

        if (token) {
            try {
                await clearCartApi();
            } catch (e) {
                console.error("Clear cart error:", e);
            }
        }
    };

    /* ==================== COUPONS ==================== */

    const applyCoupon = (code) => {
        const cleanCode = code.toUpperCase().trim();
        if (cleanCode === "FASHION20") {
            const c = { code: "FASHION20", percent: 20, max: 1000, description: "20% OFF up to ₹1,000" };
            setCoupon(c);
            localStorage.setItem("fashionista_coupon", JSON.stringify(c));
            return { success: true, message: "Coupon 'FASHION20' applied! 20% discount granted." };
        } else if (cleanCode === "FIRST50") {
            const c = { code: "FIRST50", fixed: 50, description: "Flat ₹50 OFF" };
            setCoupon(c);
            localStorage.setItem("fashionista_coupon", JSON.stringify(c));
            return { success: true, message: "Coupon 'FIRST50' applied! Flat ₹50 discount." };
        } else if (cleanCode === "SUMMER15") {
            const c = { code: "SUMMER15", percent: 15, max: 750, description: "15% OFF up to ₹750" };
            setCoupon(c);
            localStorage.setItem("fashionista_coupon", JSON.stringify(c));
            return { success: true, message: "Coupon 'SUMMER15' applied! 15% discount granted." };
        } else {
            return { success: false, message: "Invalid coupon code. Try FASHION20, FIRST50, or SUMMER15." };
        }
    };

    const removeCoupon = () => {
        setCoupon(null);
        localStorage.removeItem("fashionista_coupon");
    };

    /* ==================== WISHLIST ==================== */

    const addToWishlist = async (product) => {
        // Enforce sign‑in before wishlist mutation
        const token = localStorage.getItem("fashionista_token");
        if (!token) {
            // UI will handle notification; do not modify local wishlist for guests
            return { added: false, message: "Please sign in to manage wishlist." };
        }
        const prodId = product.product_id || product.id;
        const exists = wishlist.some(item => (item.product_id || item.id) === prodId);

        if (exists) {
            await removeFromWishlist(prodId);
            return { added: false, message: "Removed from wishlist." };
        }

        const newWishlist = [...wishlist, product];
        setWishlist(newWishlist);

        try {
            await addToWishlistApi(prodId);
        } catch (e) {
            console.error("Wishlist add error:", e);
        }
        return { added: true, message: "Added to wishlist!" };
    };
        const prodId = product.product_id || product.id;
        const exists = wishlist.some(item => (item.product_id || item.id) === prodId);

        if (exists) {
            await removeFromWishlist(prodId);
            return { added: false, message: "Removed from wishlist." };
        }

        const newWishlist = [...wishlist, product];
        setWishlist(newWishlist);

        if (token) {
            try {
                await addToWishlistApi(prodId);
            } catch (e) {
                console.error("Wishlist add error:", e);
            }
        }
        return { added: true, message: "Added to wishlist!" };
    };

    const removeFromWishlist = async (productId) => {
        const filtered = wishlist.filter(item => (item.product_id || item.id) !== productId);
        setWishlist(filtered);

        if (token) {
            try {
                await removeFromWishlistApi(productId);
            } catch (e) {
                console.error("Wishlist remove error:", e);
            }
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => (item.product_id || item.id) === productId);
    };

    /* ==================== CALCULATIONS ==================== */

    // Subtotal
    const subtotal = cart.reduce((sum, item) => {
        const p = Number(item.price || 0);
        const q = Number(item.quantity || 1);
        return sum + (p * q);
    }, 0);

    // Discount
    let discount = 0;
    if (coupon) {
        if (coupon.percent) {
            discount = (subtotal * coupon.percent) / 100;
            if (coupon.max && discount > coupon.max) {
                discount = coupon.max;
            }
        } else if (coupon.fixed) {
            discount = Math.min(coupon.fixed, subtotal);
        }
    }

    // Delivery charge: Free above ₹999, else ₹99 (if cart has items)
    const deliveryCharge = cart.length === 0 ? 0 : (subtotal - discount >= 999 ? 0 : 99);

    // Final total
    const total = Math.max(0, subtotal - discount + deliveryCharge);

    // Total item count in cart
    const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                cartCount,
                subtotal,
                discount,
                coupon,
                deliveryCharge,
                total,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                applyCoupon,
                removeCoupon,
                wishlist,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                syncWithServer
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export default CartProvider;
