import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PinInput } from '../components/ui/PinInput';
import { isValidPin, isValidEmail } from '../utils/formatters';

export function RegisterPage() {
  const { refreshSession } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nickname: '', name: '', email: '', pin: '', confirmPin: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nickname.trim()) errs.nickname = t('common.required');
    if (!form.name.trim())     errs.name     = t('common.required');
    if (form.email && !isValidEmail(form.email)) errs.email = 'Correu no vàlid';
    if (!isValidPin(form.pin))                   errs.pin   = t('auth.pin_length');
    if (form.pin !== form.confirmPin)            errs.confirmPin = t('auth.pin_mismatch');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.register(form.nickname.trim(), form.name.trim(), form.pin, form.email || undefined);
      refreshSession();
      showToast(t('auth.register_success'), 'success');
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'user_exists') setErrors((p) => ({ ...p, nickname: t('auth.user_exists') }));
      else showToast(t('common.error_generic'), 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative px-5" style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}>
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 transition-colors text-sm hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={15} /> Tornar
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-accent-500/30 shadow-xl">
              <img src="/robot-icon.png" alt="SHformacions" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black font-display" style={{ color: 'var(--text-primary)' }}>Crear compte</h1>
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              Gratuït · Guarda els teus cursos i rep el pressupost per WhatsApp
            </p>
          </div>

          {/* Formulari */}
          <div className="rounded-2xl p-5 flex flex-col gap-3.5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-base)" }}>
            <Input label={t('auth.nickname')} placeholder={t('auth.nickname_placeholder')}
              value={form.nickname} onChange={set('nickname')} error={errors.nickname}
              icon={<User size={15} />} autoCapitalize="none" required />
            <Input label={t('auth.name')} placeholder={t('auth.name_placeholder')}
              value={form.name} onChange={set('name')} error={errors.name}
              icon={<User size={15} />} required />
            <Input label={`${t('auth.email')} (opcional)`} placeholder={t('auth.email_placeholder')}
              value={form.email} onChange={set('email')} error={errors.email}
              icon={<Mail size={15} />} type="email" autoCapitalize="none" />

            <div className="flex flex-col items-center gap-1">
              <PinInput label={t('auth.pin')} value={form.pin}
                onChange={(v) => setForm((p) => ({ ...p, pin: v }))} error={!!errors.pin} />
              {errors.pin && <p className="text-xs text-red-400">{errors.pin}</p>}
            </div>
            <div className="flex flex-col items-center gap-1">
              <PinInput label={t('auth.confirm_pin')} value={form.confirmPin}
                onChange={(v) => setForm((p) => ({ ...p, confirmPin: v }))}
                error={!!errors.confirmPin} />
              {errors.confirmPin && <p className="text-xs text-red-400">{errors.confirmPin}</p>}
            </div>

            <Button fullWidth onClick={handleSubmit} loading={loading} className="mt-1">
              {t('auth.register_btn')}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
              {t('auth.login')} →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
