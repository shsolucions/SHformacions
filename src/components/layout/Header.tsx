import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, User, Sun, Moon, LayoutDashboard, X, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { availableLanguages } from '../../i18n';
import { AppUpdateIcon } from '../AppUpdateIcon';
import type { Language } from '../../types';

// Config de l'accés admin ocult
const ADMIN_TAP_COUNT = 5;            // nº de tocs seguits al logo
const ADMIN_TAP_WINDOW_MS = 2500;     // temps màxim entre primer i últim toc

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
  const flag =
    code === 'es' ? '🇪🇸' :
    code === 'en' ? '🇬🇧' :
    code === 'fr' ? '🇫🇷' :
    code === 'de' ? '🇩🇪' :
    code === 'it' ? '🇮🇹' :
    code === 'pt' ? '🇵🇹' :
    code === 'nl' ? '🇳🇱' :
    code === 'ro' ? '🇷🇴' :
    code === 'ar' ? '🇸🇦' :
    '🌐';
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{flag}</span>;
}

// ─── Modal d'accés admin ─────────────────────────────────────────────
interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (nickname: string, pin: string) => Promise<void>;
  error: string | null;
}

function AdminAccessModal({ open, onClose, onSubmit, error }: AdminModalProps) {
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNickname('');
      setPin('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(nickname.trim(), pin);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-base)' }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent-500/15 text-accent-400 flex items-center justify-center">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="font-bold text-white font-display">Accés administrador</h3>
              <p className="text-xs text-gray-500">Introdueix les credencials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400">Nom d'usuari</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="off"
              autoFocus
              className="rounded-xl px-3 py-2 text-sm border bg-transparent border-[var(--border-base)] text-white focus:outline-none focus:border-accent-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400">Contrasenya</span>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="off"
              className="rounded-xl px-3 py-2 text-sm border bg-transparent border-[var(--border-base)] text-white font-mono tracking-wider focus:outline-none focus:border-accent-500"
            />
          </label>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-[var(--border-base)]"
            >
              Cancel·lar
            </button>
            <button
              type="submit"
              disabled={submitting || !nickname || !pin}
              className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold bg-accent-500 hover:bg-accent-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Entrant...' : 'Entrar'}
            </button>
          </div>

          <p className="text-[10px] text-gray-500 text-center mt-1 italic">
            Accés restringit al personal autoritzat
          </p>
        </form>
      </div>
    </div>
  );
}

export function Header() {
  const { session, logout, isAdmin, login } = useAuth();
  const { unreadCount } = useNotifications();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // ─── Accés admin ocult: estat ─────────────────────────────────────
  const tapsRef = useRef<number[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/'); };

  // Comptador de tocs al logo — 5 tocs en ADMIN_TAP_WINDOW_MS → obre modal
  const handleLogoTap = (e: React.MouseEvent) => {
    // Si ja estàs loguejat com a admin, el logo fa l'acció normal (navegació)
    if (isAdmin) return;

    const now = Date.now();
    // Neteja tocs vells (fora de la finestra temporal)
    tapsRef.current = tapsRef.current.filter(
      (t) => now - t < ADMIN_TAP_WINDOW_MS
    );
    tapsRef.current.push(now);

    if (tapsRef.current.length >= ADMIN_TAP_COUNT) {
      // Activem el mode admin: aturem la navegació i obrim modal
      e.preventDefault();
      e.stopPropagation();
      tapsRef.current = [];
      setAdminError(null);
      setAdminOpen(true);
    }
  };

  const handleAdminSubmit = async (nickname: string, pin: string) => {
    setAdminError(null);
    try {
      await login(nickname, pin);
      setAdminOpen(false);
      navigate('/dashboard');
    } catch {
      setAdminError('Credencials incorrectes');
    }
  };

  const btnCls = "w-10 h-10 flex items-center justify-center rounded-xl transition-colors";

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b"
        style={{ backgroundColor: 'var(--bg-nav)', borderColor: 'var(--border-base)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="h-14 max-w-lg mx-auto px-3 flex items-center justify-between gap-2">

          {/* Logo — 5 tocs per accés admin ocult */}
          <Link
            to="/"
            className="flex items-center gap-2 select-none flex-shrink-0"
            onClick={handleLogoTap}
          >
            <img src="/robot-icon.png" alt="SHformacions" className="w-8 h-8 rounded-xl object-cover" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-bold text-accent-400 font-display tracking-widest uppercase">SH</span>
              <span className="text-sm font-bold font-display -mt-0.5" style={{ color: 'var(--text-primary)' }}>formacions</span>
            </div>
          </Link>

          {/* Accions de la dreta */}
          <div className="flex items-center gap-0.5">

            {/* Indicador d'actualització de l'app — visible per a tots */}
            <AppUpdateIcon />

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

            {/* Accés admin — només visible si ja estem loguejats com admin */}
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

      {/* Modal d'accés admin (activat per 5 tocs al logo) */}
      <AdminAccessModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onSubmit={handleAdminSubmit}
        error={adminError}
      />
    </>
  );
}
