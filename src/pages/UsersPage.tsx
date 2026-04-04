import React, { useEffect, useState, useMemo } from 'react';
import { Users, Search, Plus, Shield, User, ToggleLeft, ToggleRight, KeyRound, Trash2, Edit } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PinInput } from '../components/ui/PinInput';
import type { User as UserType, UserRole } from '../types';
import { formatDate } from '../utils/dateUtils';
import { getInitials, isValidPin } from '../utils/formatters';

export function UsersPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { session } = useAuth();

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserType | null>(null);
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    try {
      setUsers(await userService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    users.filter((u) =>
      !search ||
      u.nickname.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    ), [users, search]);

  const handleToggleActive = async (user: UserType) => {
    await userService.toggleActive(user.id!);
    showToast(t('common.updated_success'), 'success');
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === session?.userId) {
      showToast(t('users.cant_delete_self'), 'error');
      setDeleteTarget(null);
      return;
    }
    const adminCount = await userService.countAdmins();
    if (deleteTarget.role === 'admin' && adminCount <= 1) {
      showToast(t('users.cant_delete_admin'), 'error');
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      await userService.delete(deleteTarget.id!);
      showToast(t('users.deleted'), 'success');
      load();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleResetPin = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await userService.resetPin(resetTarget.id!);
      showToast(t('users.pin_reset'), 'success');
    } finally {
      setResetting(false);
      setResetTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-display">{t('users.title')}</h1>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => { setEditUser(null); setShowForm(true); }}>
          {t('users.add')}
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[#141414] border border-[#222] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white font-display">{users.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.total_users')}</p>
        </div>
        <div className="flex-1 bg-[#141414] border border-[#222] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-accent-400 font-display">
            {users.filter((u) => u.role === 'admin').length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t('users.admin')}</p>
        </div>
        <div className="flex-1 bg-[#141414] border border-[#222] rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-400 font-display">
            {users.filter((u) => u.active).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{t('users.active')}</p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder={t('users.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={16} />}
      />

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title={t('users.no_users')} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((user) => (
            <Card key={user.id}>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={[
                  'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                  user.role === 'admin'
                    ? 'bg-accent-500/20 text-accent-400'
                    : 'bg-[#1e1e1e] text-gray-400',
                ].join(' ')}>
                  {getInitials(user.name || user.nickname)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    {user.role === 'admin' && (
                      <Shield size={13} className="text-accent-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">@{user.nickname}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge className={user.active
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                  } dot>
                    {user.active ? t('users.active') : t('users.inactive')}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e1e1e]">
                <span className="text-xs text-gray-600">
                  {t('users.created')}: {formatDate(user.createdAt)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleActive(user)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                    title={t('users.toggle_active')}
                  >
                    {user.active ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => setResetTarget(user)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
                    title={t('users.reset_pin')}
                  >
                    <KeyRound size={16} />
                  </button>
                  <button
                    onClick={() => { setEditUser(user); setShowForm(true); }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(user)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* User Form Modal */}
      {showForm && (
        <UserFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); showToast(t('users.saved'), 'success'); load(); }}
          user={editUser}
          t={t}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('users.delete')}
        message={t('common.confirm_delete')}
        loading={deleting}
      />

      {/* Reset PIN confirm */}
      <ConfirmDialog
        open={resetTarget !== null}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPin}
        title={t('users.reset_pin')}
        message={t('users.reset_pin_confirm')}
        loading={resetting}
        variant="warning"
        confirmLabel={t('users.reset_pin')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}

// ─── User Form Modal ──────────────────────────────────────────────────────────

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user: UserType | null;
  t: (k: string) => string;
}

function UserFormModal({ open, onClose, onSaved, user, t }: UserFormModalProps) {
  const isEditing = !!user;
  const [form, setForm] = useState({
    nickname: user?.nickname ?? '',
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: (user?.role ?? 'user') as UserRole,
    pin: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nickname.trim()) errs.nickname = t('common.required');
    if (!form.name.trim()) errs.name = t('common.required');
    if (!isEditing) {
      if (!isValidPin(form.pin)) errs.pin = t('auth.pin_length');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing && user?.id) {
        await userService.update(user.id, {
          nickname: form.nickname.trim(),
          name: form.name.trim(),
          email: form.email || undefined,
          role: form.role,
        });
      } else {
        await userService.create(
          form.nickname.trim(),
          form.name.trim(),
          form.pin,
          form.role,
          form.email || undefined
        );
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'user_exists') setErrors((p) => ({ ...p, nickname: t('auth.user_exists') }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? t('users.edit') : t('users.add')}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleSave} loading={loading}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('users.nickname')}
          value={form.nickname}
          onChange={set('nickname')}
          error={errors.nickname}
          autoCapitalize="none"
          required
        />
        <Input label={t('users.name')} value={form.name} onChange={set('name')} error={errors.name} required />
        <Input label={`${t('users.email')} (${t('common.optional')})`} value={form.email} onChange={set('email')} type="email" />
        <Select
          label={t('users.role')}
          value={form.role}
          onChange={set('role')}
          options={[
            { value: 'user', label: t('users.user') },
            { value: 'admin', label: t('users.admin') },
          ]}
        />
        {!isEditing && (
          <div className="flex flex-col gap-1.5">
            <PinInput
              label={t('auth.pin')}
              value={form.pin}
              onChange={(v) => setForm((prev) => ({ ...prev, pin: v }))}
              error={!!errors.pin}
            />
            {errors.pin && <p className="text-xs text-red-400 text-center">{errors.pin}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
