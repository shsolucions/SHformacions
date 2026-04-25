import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PinInput } from '../components/ui/PinInput';
import { isValidPin } from '../utils/formatters';

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [pin, setPin]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!nickname.trim()) { setError(t('common.required')); return; }
    if (!isValidPin(pin)) { setError(t('auth.pin_length')); return; }
    setLoading(true);
    try {
      await login(nickname.trim(), pin);
      showToast(t('auth.login_success'), 'success');
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg === 'account_inactive' ? t('auth.account_inactive') : t('auth.invalid_credentials'));
      setPin('');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Fons decoratiu */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent-500/6 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-2xl" />
      </div>

      {/* Botó tornar */}
      <div className="relative px-5" style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}>
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 transition-colors text-sm hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={15} /> Tornar a l'inici
        </button>
      </div>

      {/* Contingut centrat */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm flex flex-col gap-7">

          {/* Logo robot */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border-2 border-accent-500/30">
                <img src="/robot-icon.png" alt="SHformacions" className="w-full h-full object-cover" />
              </div>
              {/* Anell de llum */}
              <div className="absolute -inset-1 rounded-[28px] border border-accent-500/20 animate-pulse-slow" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black font-display flex items-center justify-center gap-1.5">
                <span className="text-accent-400">SH</span>
                <span style={{ color: 'var(--text-primary)' }}>formacions</span>
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('app.tagline')}</p>
            </div>
          </div>

          {/* Formulari */}
          <div className="rounded-2xl p-6 flex flex-col gap-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-base)" }}>
            <h2 className="text-center text-base font-semibold font-display" style={{ color: 'var(--text-primary)' }}>
              {t('auth.login')}
            </h2>

            <Input
              label={t('auth.nickname')}
              placeholder={t('auth.nickname_placeholder')}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && pin.length === 4) handleSubmit(); }}
              icon={<User size={15} />}
              autoCapitalize="none"
              autoComplete="username"
            />

            <div className="flex flex-col items-center gap-1.5">
              <PinInput label={t('auth.pin')} value={pin} onChange={setPin} error={!!error} />
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <Button fullWidth onClick={handleSubmit} loading={loading}
              disabled={pin.length !== 4 || !nickname.trim()}>
              {t('auth.login_btn')}
            </Button>
          </div>

          {/* Registrar-se */}
          <p className="text-center text-sm text-gray-500">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
              {t('auth.register')} →
            </Link>
          </p>

          {/* Credencials de demo */}
          <div className="text-center">
            <p className="text-xs rounded-xl px-4 py-2 inline-block border" style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-base)" }}>
              👤 Demo: <span className="text-gray-500 font-mono">admin</span> / PIN{' '}
              <span className="text-gray-500 font-mono">1234</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
