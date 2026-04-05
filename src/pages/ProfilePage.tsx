import React, { useEffect, useState } from 'react';
import { User, Mail, KeyRound, ClipboardList, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { requestService } from '../services/requestService';
import { paymentService } from '../services/paymentService';
import { userService } from '../services/userService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PinInput } from '../components/ui/PinInput';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { RequestWithDetails, PaymentWithDetails, User as UserType } from '../types';
import { formatDate, formatRelative } from '../utils/dateUtils';
import { formatCurrency, getStatusColor, getInitials, isValidPin } from '../utils/formatters';

export function ProfilePage() {
  const { session, logout, refreshSession } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [user, setUser] = useState<UserType | null>(null);
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);

  const load = async () => {
    if (!session) return;
    try {
      const [u, r, p] = await Promise.all([
        userService.getById(session.userId),
        requestService.getByUser(session.userId),
        paymentService.getByUser(session.userId),
      ]);
      setUser(u ?? null);
      setRequests(r);
      setPayments(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [session]);

  if (loading) return <LoadingSpinner />;
  if (!user || !session) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Profile hero */}
      <div className="bg-gradient-to-br from-accent-500/10 to-transparent border border-accent-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-500/20 flex items-center justify-center text-xl font-bold text-accent-400 font-display flex-shrink-0">
            {getInitials(user.name || user.nickname)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-white font-display truncate">{user.name}</h1>
            <p className="text-sm text-gray-500">@{user.nickname}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={session.role === 'admin'
                ? 'bg-accent-500/20 text-accent-400 border-accent-500/30'
                : 'bg-white/5 text-gray-400 border-white/10'
              }>
                {session.role === 'admin' ? t('users.admin') : t('users.user')}
              </Badge>
            </div>
          </div>
        </div>
        {user.email && (
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <Mail size={14} />
            {user.email}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
          <User size={14} />
          {t('profile.member_since')} {formatDate(user.createdAt)}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" size="sm" icon={<User size={14} />} onClick={() => setShowEditProfile(true)}>
            {t('profile.edit')}
          </Button>
          <Button variant="outline" size="sm" icon={<KeyRound size={14} />} onClick={() => setShowChangePin(true)}>
            {t('profile.change_pin')}
          </Button>
        </div>
      </div>

      {/* My requests */}
      <Card>
        <CardHeader
          title={t('profile.my_requests')}
          icon={<ClipboardList size={18} />}
        />
        {requests.length === 0 ? (
          <EmptyState icon={<ClipboardList size={24} />} title={t('profile.no_requests')} />
        ) : (
          <div className="flex flex-col gap-2">
            {requests.slice(0, 5).map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl">
                <div className={[
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  req.status === 'approved' || req.status === 'completed'
                    ? 'bg-green-500/10 text-green-400'
                    : req.status === 'rejected'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-yellow-500/10 text-yellow-400',
                ].join(' ')}>
                  {req.status === 'pending'
                    ? <Clock size={14} />
                    : req.status === 'rejected'
                    ? <XCircle size={14} />
                    : <CheckCircle2 size={14} />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{req.courseName}</p>
                  <p className="text-xs text-gray-600">{formatRelative(req.createdAt)}</p>
                </div>
                <Badge className={getStatusColor(req.status)}>
                  {t(`requests.${req.status}`)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* My payments */}
      <Card>
        <CardHeader
          title={t('profile.my_payments')}
          icon={<CreditCard size={18} />}
        />
        {payments.length === 0 ? (
          <EmptyState icon={<CreditCard size={24} />} title={t('profile.no_payments')} />
        ) : (
          <div className="flex flex-col gap-2">
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {p.concept || p.courseName || t('payments.concept_placeholder')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t(`payments.method_${p.method}`)} · {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-white font-display">
                    {formatCurrency(p.amount)}
                  </span>
                  <Badge className={getStatusColor(p.status)}>
                    {t(`payments.status_${p.status}`)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit profile modal */}
      {showEditProfile && (
        <EditProfileModal
          open={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSaved={() => { setShowEditProfile(false); load(); showToast(t('profile.saved'), 'success'); refreshSession(); }}
          user={user}
          t={t}
        />
      )}

      {/* Change PIN modal */}
      {showChangePin && (
        <ChangePinModal
          open={showChangePin}
          onClose={() => setShowChangePin(false)}
          onSaved={() => { setShowChangePin(false); showToast(t('profile.pin_changed'), 'success'); }}
          userId={session.userId}
          t={t}
        />
      )}
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({
  open, onClose, onSaved, user, t,
}: {
  open: boolean; onClose: () => void; onSaved: () => void;
  user: UserType; t: (k: string) => string;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await userService.update(user.id!, { name: name.trim(), email: email || undefined });
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('profile.edit')}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleSave} loading={loading}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('users.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label={`${t('users.email')} (${t('common.optional')})`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </Modal>
  );
}

// ─── Change PIN Modal ─────────────────────────────────────────────────────────

function ChangePinModal({
  open, onClose, onSaved, userId, t,
}: {
  open: boolean; onClose: () => void; onSaved: () => void;
  userId: number; t: (k: string) => string;
}) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!isValidPin(currentPin)) { setError(t('auth.pin_length')); return; }
    if (!isValidPin(newPin)) { setError(t('auth.pin_length')); return; }
    if (newPin !== confirmPin) { setError(t('auth.pin_mismatch')); return; }
    setLoading(true);
    try {
      await authService.changePin(userId, currentPin, newPin);
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg === 'pin_wrong' ? t('profile.pin_wrong') : t('common.error_generic'));
      setCurrentPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('profile.change_pin')}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleSave} loading={loading}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 items-center">
        <PinInput label={t('profile.current_pin')} value={currentPin} onChange={setCurrentPin} error={!!error} />
        <PinInput label={t('profile.new_pin')} value={newPin} onChange={setNewPin} />
        <PinInput label={t('profile.confirm_new_pin')} value={confirmPin} onChange={setConfirmPin} error={newPin !== confirmPin && confirmPin.length === 4} />
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
      </div>
    </Modal>
  );
}
