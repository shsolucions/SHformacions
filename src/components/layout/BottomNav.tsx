import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, CalendarDays, Settings, LayoutDashboard, Wallet, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';

export function BottomNav() {
  const { isAdmin, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center px-2 rounded-xl transition-colors relative ${
      isActive ? 'text-accent-400' : 'text-gray-500 hover:text-gray-400'
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t pb-safe"
      style={{ backgroundColor: 'var(--bg-nav)', borderColor: 'var(--border-base)' }}
    >
      <div className="max-w-lg mx-auto h-16 flex items-center justify-around px-1">
        <NavLink to="/" end className={linkCls}>
          <Home size={22} />
          <span className="text-[10px] font-medium">Inici</span>
        </NavLink>

        <NavLink to="/cursos" className={linkCls}>
          <BookOpen size={22} />
          <span className="text-[10px] font-medium">{t('nav.courses')}</span>
        </NavLink>

        <NavLink to="/calendari" className={linkCls}>
          <CalendarDays size={22} />
          <span className="text-[10px] font-medium">{t('nav.calendar')}</span>
        </NavLink>

        {isAuthenticated && (
          <NavLink to="/pressupost" className={linkCls}>
            <Wallet size={22} />
            <span className="text-[10px] font-medium">Pressupost</span>
          </NavLink>
        )}

        {isAuthenticated && (
          <NavLink to="/diplomes" className={linkCls}>
            <Award size={22} />
            <span className="text-[10px] font-medium">Diplomes</span>
          </NavLink>
        )}

        {isAdmin ? (
          <NavLink to="/dashboard" className={linkCls}>
            <LayoutDashboard size={22} />
            <span className="text-[10px] font-medium">Admin</span>
          </NavLink>
        ) : (
          <NavLink to="/configuracio" className={linkCls}>
            <Settings size={22} />
            <span className="text-[10px] font-medium">{t('nav.settings')}</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}
