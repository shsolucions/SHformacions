import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Sun, Moon, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { availableLanguages } from '../../i18n';
import type { Language } from '../../types';

function SenyeraFlag({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.67)} viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#FCDD09"/>
      <rect y="2.5"  width="30" height="3" fill="#DA121A"/>
      <rect y="8"    width="30" height="3" fill="#DA121A"/>
      <rect y="13.5" width="30" height="3" fill="#DA121A"/>
    </svg>
  );
}

function LangFlag({ code, size = 18 }: { code: Language; size?: number }) {
  if (code === 'ca') return <SenyeraFlag size={size} />;
  if (code === 'es') return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>🇪🇸</span>;
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>🇬🇧</span>;
}

export function Header() {
  const { session, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const btnCls = "w-10 h-10 flex items-center justify-center rounded-xl transition-colors";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b"
      style={{ backgroundColor: 'var(--bg-nav)', borderColor: 'var(--border-base)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="h-14 max-w-lg mx-auto px-3 flex items-center justify-between gap-2">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 select-none flex-shrink-0">
          <img src="/robot-icon.png" alt="SHformacions" className="w-8 h-8 rounded-xl object-cover" />
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-bold text-accent-400 font-display tracking-widest uppercase">SH</span>
            <span className="text-sm font-bold font-display -mt-0.5" style={{ color: 'var(--text-primary)' }}>formacions</span>
          </div>
        </Link>

        {/* Accions de la dreta */}
        <div className="flex items-center gap-0.5">

          {/* Toggle tema — SOL (clar) o LLUNA (fosc) */}
          <button
            onClick={toggleTheme}
            className={btnCls + " text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"}
            aria-label={theme === 'dark' ? 'Canviar a mode clar' : 'Canviar a mode fosc'}
            title={theme === 'dark' ? '☀️ Mode clar' : '🌙 Mode fosc'}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* Selector d'idioma */}
          <div ref={langRef} className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={btnCls + " text-gray-400 hover:text-white hover:bg-white/5"}
              title="Canviar idioma"
            >
              <LangFlag code={language} size={18} />
            </button>
            {showLangMenu && (
              <div
                className="absolute right-0 top-12 rounded-xl shadow-xl z-50 overflow-hidden w-40 animate-slide-down border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}
              >
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left',
                      language === lang.code
                        ? 'bg-accent-500/20 text-accent-400'
                        : 'hover:bg-black/5',
                    ].join(' ')}
                    style={{ color: language === lang.code ? undefined : 'var(--text-secondary)' }}
                  >
                    <LangFlag code={lang.code} size={18} />
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notificacions */}
          {session && (
            <Link
              to="/notificacions"
              className={btnCls + " relative text-gray-400 hover:text-white hover:bg-white/5"}
              aria-label="Notificacions"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-accent-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Accés admin */}
          {isAdmin && (
            <Link to="/dashboard"
              className={btnCls + " text-accent-400 hover:text-accent-300 hover:bg-accent-500/10"}
              title="Tauler Admin">
              <LayoutDashboard size={18} />
            </Link>
          )}

          {/* Perfil / Login */}
          {session ? (
            <>
              <Link to="/perfil"
                className={btnCls + " text-gray-400 hover:text-white hover:bg-white/5"}
                aria-label="Perfil">
                <User size={20} />
              </Link>
              <button onClick={handleLogout}
                className={btnCls + " text-gray-400 hover:text-red-400 hover:bg-red-500/10"}
                title="Tancar sessió">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent-500 hover:bg-accent-600 rounded-xl transition-colors ml-1">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
