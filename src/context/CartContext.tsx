import React, {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from 'react';

const CART_KEY = 'shformacions_cart';

interface CartItem { id: number; qty: number; }

interface CartContextValue {
  cartItems: CartItem[];
  cartIds: number[];
  cartCount: number;
  inCart: (id: number) => boolean;
  getQty: (id: number) => number;
  toggleCart: (id: number) => void;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Compatibilitat: si és array de números (versió antiga)
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'number') {
        return parsed.map((id: number) => ({ id, qty: 1 }));
      }
      return parsed as CartItem[];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const cartIds = cartItems.map(i => i.id);
  const inCart = useCallback((id: number) => cartItems.some(i => i.id === id), [cartItems]);
  const getQty = useCallback((id: number) => cartItems.find(i => i.id === id)?.qty ?? 0, [cartItems]);

  const addToCart = useCallback((id: number) => {
    setCartItems(prev => prev.some(i => i.id === id) ? prev : [...prev, { id, qty: 1 }]);
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const toggleCart = useCallback((id: number) => {
    setCartItems(prev =>
      prev.some(i => i.id === id) ? prev.filter(i => i.id !== id) : [...prev, { id, qty: 1 }]
    );
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(i => i.id !== id));
    } else {
      setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
    }
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartIds,
      cartCount: cartItems.length,
      inCart, getQty, toggleCart, addToCart, removeFromCart, setQty, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
