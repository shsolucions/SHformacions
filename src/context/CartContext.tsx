import React, {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from 'react';

const CART_KEY = 'shformacions_cart';

interface CartContextValue {
  cartIds: number[];
  cartCount: number;
  inCart: (id: number) => boolean;
  toggleCart: (id: number) => void;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartIds, setCartIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
  });

  // Persisteix al localStorage cada vegada que canvia
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartIds));
  }, [cartIds]);

  const inCart = useCallback((id: number) => cartIds.includes(id), [cartIds]);

  const addToCart = useCallback((id: number) => {
    setCartIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCartIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const toggleCart = useCallback((id: number) => {
    setCartIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clearCart = useCallback(() => setCartIds([]), []);

  return (
    <CartContext.Provider value={{
      cartIds,
      cartCount: cartIds.length,
      inCart, toggleCart, addToCart, removeFromCart, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
