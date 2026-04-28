import React, { type ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { RobotButton } from '../ui/RobotButton';
import { CartButton } from '../ui/CartButton';
import { ToastContainer } from '../ui/ToastContainer';
import { AuthModal } from '../ui/AuthModal';

const THRESHOLD = 70;

interface AppLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function AppLayout({ children, showBottomNav = true }: AppLayoutProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const startY = useRef(0);
  const pulling = useRef(false);
  const busy = useRef(false);
  const pullRef = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (busy.current || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || busy.current) return;
    if (window.scrollY > 0) {
      pulling.current = false;
      pullRef.current = 0;
      setPullDistance(0);
      return;
    }
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) { pullRef.current = 0; setPullDistance(0); return; }
    e.preventDefault();
    const d = dy < THRESHOLD ? dy : THRESHOLD + (dy - THRESHOLD) * 0.3;
    pullRef.current = Math.min(d, THRESHOLD * 1.5);
    setPullDistance(pullRef.current);
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    const d = pullRef.current;
    pullRef.current = 0;
    setPullDistance(0);
    if (d < THRESHOLD) return;
    busy.current = true;
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 700));
    setRefreshKey(k => k + 1);
    setRefreshing(false);
    busy.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const visible = pullDistance > 2 || refreshing;

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
    >
      <Header />

      {/* Indicador pull-to-refresh */}
      <div
        className="fixed left-0 right-0 z-30 flex justify-center pointer-events-none"
        style={{
          top: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
          opacity: visible ? (refreshing ? 1 : progress) : 0,
          transform: `translateY(${refreshing ? 10 : pullDistance * 0.4}px)`,
          transition: pulling.current ? undefined : 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <div className="w-9 h-9 rounded-full bg-accent-500/15 border border-accent-500/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <RefreshCw
            size={16}
            className={`text-accent-400 ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: refreshing ? undefined : `rotate(${progress * 210}deg)` }}
          />
        </div>
      </div>

      <main
        className="pb-20 min-h-screen max-w-lg mx-auto"
        style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
      >
        <div
          key={refreshKey}
          className="px-4 py-5 animate-fade-in"
          style={{
            transform: pullDistance > 0 ? `translateY(${pullDistance * 0.4}px)` : undefined,
            transition: pulling.current ? undefined : 'transform 0.3s ease',
          }}
        >
          {children}
        </div>
      </main>

      {showBottomNav && <BottomNav />}
      <CartButton />
      <RobotButton />
      <ToastContainer />
      <AuthModal />
    </div>
  );
}
