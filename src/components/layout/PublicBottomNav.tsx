import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, BookOpen, CalendarDays, LogIn, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';

export function PublicBottomNav() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050505]/95 backdrop-blur-xl border-t border-white/5 pb-safe">
      <div className="max-w-lg mx-auto h-16 flex items-center justify-around px-2">
        <NavLink to="/" end className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-3 rounded-xl transition-colors ${isActive ? 'text-accent-400' : 'text-gray-600 hover:text-gray-400'}`}>
          <Home size={22} />
          <span className="text-[10px] font-medium">{t('nav.dashboard')}</span>
        </NavLink>

        <NavLink to="/cursos" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-3 rounded-xl transition-colors ${isActive ? 'text-accent-400' : 'text-gray-600 hover:text-gray-400'}`}>
          <BookOpen size={22} />
          <span className="text-[10px] font-medium">{t('nav.courses')}</span>
        </NavLink>

        <NavLink to="/calendari" className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-3 rounded-xl transition-colors ${isActive ? 'text-accent-400' : 'text-gray-600 hover:text-gray-400'}`}>
          <CalendarDays size={22} />
          <span className="text-[10px] font-medium">{t('nav.calendar')}</span>
        </NavLink>

        {isAuthenticated ? (
          <NavLink to="/pressupost" className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-3 rounded-xl transition-colors ${isActive ? 'text-accent-400' : 'text-gray-600 hover:text-gray-400'}`}>
            <Wallet size={22} />
            <span className="text-[10px] font-medium">Pressupost</span>
          </NavLink>
        ) : (
          <Link to="/login" className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-3 rounded-xl transition-colors text-accent-400 bg-accent-500/10">
            <LogIn size={22} />
            <span className="text-[10px] font-medium">{t('auth.login')}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
