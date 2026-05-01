import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus, Search, CreditCard, CheckCircle2, Clock, XCircle, TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import { userService } from '../services/userService';
import { courseService } from '../services/courseService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { PaymentWithDetails, PaymentFormData, User, Course, PaymentStatus } from '../types';
import { formatCurrency, getStatusColor } from '../utils/formatters';
import { formatDate, timestampToDateString } from '../utils/dateUtils';

export function PaymentsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isAdmin, session } = useAuth();

  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editPayment, setEditPayment] = useState<PaymentWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const [p, u, c] = await Promise.all([
        isAdmin ? paymentService.getAll() : paymentService.getByUser(session!.userId),
        isAdmin ? userService.getAll() : Promise.resolve([]),
        courseService.getAll(),
      ]);
      setPayments(p);
      setUsers(u);
      setCourses(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesSearch =
        !search ||
        (p.userName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.courseName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.concept ?? '').toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [payments, search, statusFilter]);

  const summary = useMemo(() => ({
    totalPaid: payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    totalPending: payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    countPending: payments.filter((p) => p.status === 'pending').length,
    countPaid: payments.filter((p) => p.status === 'paid').length,
  }), [payments]);

  const handleMarkPaid = async (id: number) => {
    await paymentService.markAsPaid(id);
    showToast(t('payments.marked_paid'), 'success');
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentService.delete(deleteTarget);
      showToast(t('payments.deleted'), 'success');
      load();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const statusOptions = [
    { value: 'all', label: t('payments.filter_all') },
    { value: 'pending', label: t('payments.status_pending') },
    { value: 'paid', label: t('payments.status_paid') },
    { value: 'cancelled', label: t('payments.status_cancelled') },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-display">{t('payments.title')}</h1>
        {isAdmin && (
          <Button size="sm" icon={<Plus size={16} />} onClick={() => { setEditPayment(null); setShowForm(true); }}>
            {t('payments.add')}
          </Button>
        )}
      </div>

      {/* Summary cards */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-xs text-gray-500">{t('payments.total_paid')}</span>
            </div>
            <p className="text-xl font-bold text-green-400 font-display">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-xs text-gray-600 mt-0.5">{summary.countPaid} {t('payments.status_paid').toLowerCase()}</p>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-yellow-400" />
              <span className="text-xs text-gray-500">{t('payments.total_pending')}</span>
            </div>
            <p className="text-xl font-bold text-yellow-400 font-display">{formatCurrency(summary.totalPending)}</p>
            <p className="text-xs text-gray-600 mt-0.5">{summary.countPending} {t('payments.status_pending').toLowerCase()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <Input
          placeholder={t('courses.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={16} />}
        />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={[
                'flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors border',
                statusFilter === opt.value
                  ? 'bg-accent-500 text-white border-accent-500'
                  : 'bg-[#141414] text-gray-400 border-[#2a2a2a] hover:border-[#333]',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment list */}
      {filtered.length === 0 ? (
        <EmptyState icon={<CreditCard size={32} />} title={t('payments.no_payments')} />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              t={t}
              isAdmin={isAdmin}
              onMarkPaid={() => handleMarkPaid(payment.id!)}
              onEdit={() => { setEditPayment(payment); setShowForm(true); }}
              onDelete={() => setDeleteTarget(payment.id!)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <PaymentFormModal
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); showToast(t('payments.saved'), 'success'); load(); }}
          payment={editPayment}
          users={users}
          courses={courses}
          t={t}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('payments.delete')}
        message={t('common.confirm_delete')}
        loading={deleting}
      />
    </div>
  );
}

// ─── Payment Card ─────────────────────────────────────────────────────────────

interface PaymentCardProps {
  payment: PaymentWithDetails;
  t: (k: string) => string;
  isAdmin: boolean;
  onMarkPaid: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PaymentCard({ payment, t, isAdmin, onMarkPaid, onEdit, onDelete }: PaymentCardProps) {
  const statusIcons: Record<string, React.ReactNode> = {
    paid: <CheckCircle2 size={16} className="text-green-400" />,
    pending: <Clock size={16} className="text-yellow-400" />,
    cancelled: <XCircle size={16} className="text-red-400" />,
  };

  const methodLabels: Record<string, string> = {
    cash: t('payments.method_cash'),
    card: t('payments.method_card'),
    transfer: t('payments.method_transfer'),
    bizum: t('payments.method_bizum'),
    paypal: t('payments.method_paypal'),
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#1e1e1e] flex items-center justify-center flex-shrink-0">
            {statusIcons[payment.status]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {payment.concept || payment.courseName || t('payments.concept_placeholder')}
            </p>
            {isAdmin && (
              <p className="text-xs text-gray-500 truncate">{payment.userName}</p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-white font-display">
            {formatCurrency(payment.amount)}
          </p>
          <Badge className={getStatusColor(payment.status)}>
            {t(`payments.status_${payment.status}`)}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">{methodLabels[payment.method]}</span>
          {payment.dueDate && payment.status === 'pending' && (
            <span className="text-xs text-yellow-500">
              {t('payments.due_date')}: {formatDate(payment.dueDate)}
            </span>
          )}
          {payment.paidAt && (
            <span className="text-xs text-green-600">{formatDate(payment.paidAt)}</span>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            {payment.status === 'pending' && (
              <Button variant="ghost" size="sm" icon={<CheckCircle2 size={14} />} onClick={onMarkPaid}>
                {t('payments.mark_paid')}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onEdit}>{t('common.edit')}</Button>
            <Button variant="danger" size="sm" onClick={onDelete}>{t('common.delete')}</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Payment Form Modal ───────────────────────────────────────────────────────

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  payment: PaymentWithDetails | null;
  users: User[];
  courses: Course[];
  t: (k: string) => string;
}

function PaymentFormModal({ open, onClose, onSaved, payment, users, courses, t }: PaymentFormModalProps) {
  const [form, setForm] = useState<PaymentFormData>(() => ({
    userId: payment?.userId ?? '',
    courseId: payment?.courseId ?? '',
    amount: payment?.amount ?? 0,
    status: payment?.status ?? 'pending',
    method: payment?.method ?? 'cash',
    concept: payment?.concept ?? '',
    notes: payment?.notes ?? '',
    dueDate: payment?.dueDate ? timestampToDateString(payment.dueDate) : '',
  }));
  const [loading, setLoading] = useState(false);

  const set = (field: keyof PaymentFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.userId) return;
    setLoading(true);
    try {
      if (payment?.id) {
        await paymentService.update(payment.id, form);
      } else {
        await paymentService.create(form);
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  const userOptions = users.map((u) => ({ value: u.id!, label: u.name || u.nickname }));
  const courseOptions = [
    { value: '', label: t('common.none') },
    ...courses.map((c) => ({ value: c.id!, label: c.name })),
  ];
  const statusOptions = ['pending', 'paid', 'cancelled'].map((s) => ({
    value: s, label: t(`payments.status_${s}`),
  }));
  const methodOptions = ['cash', 'card', 'transfer', 'bizum', 'paypal'].map((m) => ({
    value: m, label: t(`payments.method_${m}`),
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={payment ? t('payments.edit') : t('payments.add')}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={handleSave} loading={loading}>{t('common.save')}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label={t('payments.user')}
          value={String(form.userId)}
          onChange={set('userId')}
          options={userOptions}
          placeholder={t('common.select_option')}
          required
        />
        <Select
          label={t('payments.course')}
          value={String(form.courseId ?? '')}
          onChange={set('courseId')}
          options={courseOptions}
        />
        <Input
          label={t('payments.amount')}
          type="number"
          value={form.amount}
          onChange={set('amount')}
          min={0}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t('payments.status')} value={form.status} onChange={set('status')} options={statusOptions} />
          <Select label={t('payments.method')} value={form.method} onChange={set('method')} options={methodOptions} />
        </div>
        <Input label={t('payments.concept')} value={form.concept ?? ''} onChange={set('concept')} placeholder={t('payments.concept_placeholder')} />
        <Input label={`${t('payments.due_date')} (${t('common.optional')})`} type="date" value={form.dueDate ?? ''} onChange={set('dueDate')} />
      </div>
    </Modal>
  );
}
