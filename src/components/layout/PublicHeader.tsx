import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogIn, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { availableLanguages } from '../../i18n';
import type { Language } from '../../types';

function SenyeraFlag({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.67)} viewBox="0 0 30 20">
      <rect width="30" height="20" fill="#FCDD09"/>
      <rect y="2.5"  width="30" height="3" fill="#DA121A"/>
      <rect y="8"    width="30" height="3" fill="#DA121A"/>
      <rect y="13.5" width="30" height="3" fill="#DA121A"/>
    </svg>
  );
}

function LangFlag({ code, size = 18 }: { code: Language; size?: number }) {
  if (code === 'ca') return <SenyeraFlag size={size} />;
  if (code === 'es') return <span style={{ fontSize: size * 0.9 }}>🇪🇸</span>;
  return <span style={{ fontSize: size * 0.9 }}>🇬🇧</span>;
}

export function PublicHeader() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showLang, setShowLang] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#050505]/90 dark:bg-[#050505]/90 light:bg-white/90 backdrop-blur-xl border-b border-white/5">
      <div className="h-full max-w-5xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none">
          <img src="/robot-icon.png" alt="SHformacions" className="w-8 h-8 rounded-xl object-cover" />
          <div className="flex flex-col leading-none">
            <span className="text-xs font-bold text-accent-400 font-display tracking-widest uppercase">SH</span>
            <span className="text-sm font-bold text-white font-display -mt-0.5">formacions</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/cursos" className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">{t('nav.courses')}</Link>
          <Link to="/calendari" className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">{t('nav.calendar')}</Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Theme */}
          <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Language */}
          <div ref={langRef} className="relative">
            <button onClick={() => setShowLang(!showLang)} className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
              <LangFlag code={language} size={17} />
            </button>
            {showLang && (
              <div className="absolute right-0 top-11 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-50 overflow-hidden w-38 animate-slide-down">
                {availableLanguages.map((lang) => (
                  <button key={lang.code} onClick={() => { setLanguage(lang.code); setShowLang(false); }}
                    className={['w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors', language === lang.code ? 'bg-accent-500/20 text-accent-400' : 'text-gray-300 hover:bg-white/5'].join(' ')}>
                    <LangFlag code={lang.code} size={17} />
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-accent-400 border border-accent-500/30 rounded-lg hover:bg-accent-500/10 transition-colors">
                  <LayoutDashboard size={13} />
                  Admin
                </Link>
              )}
              <Link to="/perfil" className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 border border-[#2a2a2a] rounded-lg hover:bg-white/5 transition-colors">
                <User size={13} />
                {t('nav.profile')}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 rounded-xl transition-colors">
              <LogIn size={15} />
              {t('auth.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
