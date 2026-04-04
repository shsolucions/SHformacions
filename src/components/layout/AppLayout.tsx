import React, { type ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { RobotButton } from '../ui/RobotButton';
import { ToastContainer } from '../ui/ToastContainer';
import { AuthModal } from '../ui/AuthModal';

interface AppLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function AppLayout({ children, showBottomNav = true }: AppLayoutProps) {
  return (
    <div
      className="min-h-screen font-sans transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
    >
      <Header />
      <main className="pt-14 pb-20 min-h-screen max-w-lg mx-auto">
        <div className="px-4 py-5 animate-fade-in">{children}</div>
      </main>
      {showBottomNav && <BottomNav />}
      <RobotButton />
      <ToastContainer />
      <AuthModal />
    </div>
  );
}
