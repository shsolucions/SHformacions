import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export function CartButton() {
  const { cartCount } = useCart();
  if (cartCount === 0) return null;

  return (
    <Link
      to="/pressupost"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2.5 px-4 h-12 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95"
      style={{
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        boxShadow: '0 4px 20px rgba(14,165,233,0.4)',
      }}
    >
      <div className="relative">
        <ShoppingCart size={20} className="text-white" />
        <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-white text-accent-600 text-[10px] font-black flex items-center justify-center px-1 leading-none">
          {cartCount}
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-white text-xs font-bold">El meu cistell</span>
        <span className="text-white/75 text-[10px]">{cartCount} {cartCount === 1 ? 'curs' : 'cursos'}</span>
      </div>
    </Link>
  );
}
