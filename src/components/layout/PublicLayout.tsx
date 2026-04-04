import React, { type ReactNode } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicBottomNav } from './PublicBottomNav';
import { RobotButton } from '../ui/RobotButton';
import { ToastContainer } from '../ui/ToastContainer';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <PublicHeader />
      <main className="pt-14 pb-20 max-w-5xl mx-auto">
        <div className="animate-fade-in">{children}</div>
      </main>
      <PublicBottomNav />
      <RobotButton />
      <ToastContainer />
    </div>
  );
}
