import React, { useState, useEffect } from 'react';
import { X, User, Mail, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Input } from './Input';
import { Button } from './Button';
import { PinInput } from './PinInput';
import { isValidPin, isValidEmail } from '../../utils/formatters';

export function AuthModal() {
  const { isOpen, mode, onSuccessCallback, closeAuthModal, switchMode } = useAuthModal();
  const { refreshSession } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [nickname, setNickname] = useState('');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [pin, setPin]           = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const reset = () => {
    setNickname(''); setName(''); setEmail('');
    setPin(''); setConfirmPin(''); setError('');
  };

  useEffect(() => { if (isOpen) reset(); }, [isOpen, mode]);

  // Tanca amb Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAuthModal(); };
    if (isOpen) document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isOpen, closeAuthModal]);

  const handleLogin = async () => {
    setError('');
    if (!nickname.trim()) { setError(t('common.required')); return; }
    if (!isValidPin(pin)) { setError(t('auth.pin_length')); return; }
    setLoading(true);
    try {
      await authService.login(nickname.trim(), pin);
      refreshSession();
      showToast(t('auth.login_success'), 'success');
      closeAuthModal();
      onSuccessCallback?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg === 'account_inactive' ? t('auth.account_inactive') : t('auth.invalid_credentials'));
      setPin('');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setError('');
    if (!nickname.trim() || !name.trim()) { setError(t('auth.fill_all')); return; }
    if (email && !isValidEmail(email)) { setError('Correu electrònic no vàlid'); return; }
    if (!isValidPin(pin)) { setError(t('auth.pin_length')); return; }
    if (pin !== confirmPin) { setError(t('auth.pin_mismatch')); return; }
    setLoading(true);
    try {
      await authService.register(nickname.trim(), name.trim(), pin, email || undefined);
      refreshSession();
      showToast(t('auth.register_success'), 'success');
      closeAuthModal();
      onSuccessCallback?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg === 'user_exists' ? t('auth.user_exists') : t('common.error_generic'));
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Fons fosc */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeAuthModal} />

      {/* Panell */}
      <div className="relative w-full sm:max-w-sm bg-[#141414] border border-[#2a2a2a] shadow-2xl rounded-t-3xl sm:rounded-2xl animate-slide-up overflow-hidden">

        {/* Franja de color a dalt */}
        <div className="h-1 bg-gradient-to-r from-accent-500 to-violet-500" />

        <div className="px-6 pt-5 pb-6">
          {/* Capçalera */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                <Wallet size={20} className="text-accent-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display">
                  {mode === 'login' ? t('auth.login') : t('auth.register')}
                </h2>
                <p className="text-xs text-gray-500">
                  {mode === 'login'
                    ? 'Per guardar cursos i veure el pressupost'
                    : 'Crea el teu compte gratuït'}
                </p>
              </div>
            </div>
            <button onClick={closeAuthModal}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/5 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <div className="flex flex-col gap-4">
              <Input label={t('auth.nickname')} placeholder={t('auth.nickname_placeholder')}
                value={nickname} onChange={(e) => setNickname(e.target.value)}
                icon={<User size={15} />} autoCapitalize="none" autoComplete="username" />
              <PinInput label={t('auth.pin')} value={pin} onChange={setPin} error={!!error} />
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <Button fullWidth onClick={handleLogin} loading={loading}
                disabled={pin.length < 6 || !nickname.trim()}>
                {t('auth.login_btn')}
              </Button>
              <p className="text-center text-xs text-gray-500">
                {t('auth.no_account')}{' '}
                <button onClick={() => switchMode('register')}
                  className="text-accent-400 hover:text-accent-300 font-medium">
                  {t('auth.register')}
                </button>
              </p>
            </div>
          )}

          {/* ── REGISTRE ── */}
          {mode === 'register' && (
            <div className="flex flex-col gap-3">
              <Input label={t('auth.nickname')} placeholder={t('auth.nickname_placeholder')}
                value={nickname} onChange={(e) => setNickname(e.target.value)}
                icon={<User size={15} />} autoCapitalize="none" required />
              <Input label={t('auth.name')} placeholder={t('auth.name_placeholder')}
                value={name} onChange={(e) => setName(e.target.value)}
                icon={<User size={15} />} required />
              <Input label={`${t('auth.email')} (opcional)`} placeholder={t('auth.email_placeholder')}
                value={email} onChange={(e) => setEmail(e.target.value)}
                icon={<Mail size={15} />} type="email" autoCapitalize="none" />
              <PinInput label={t('auth.pin')} value={pin} onChange={setPin} error={!!error} />
              <PinInput label={t('auth.confirm_pin')} value={confirmPin} onChange={setConfirmPin}
                error={confirmPin.length === 4 && pin !== confirmPin} />
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <Button fullWidth onClick={handleRegister} loading={loading}
                disabled={pin.length < 6 || !nickname.trim() || !name.trim()}>
                {t('auth.register_btn')}
              </Button>
              <p className="text-center text-xs text-gray-500">
                {t('auth.have_account')}{' '}
                <button onClick={() => switchMode('login')}
                  className="text-accent-400 hover:text-accent-300 font-medium">
                  {t('auth.login')}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
