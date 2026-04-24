import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, CreditCard, ClipboardList, TrendingUp,
  Plus, ArrowRight, CheckCircle2, Clock, Euro, Edit,
  ToggleLeft, ToggleRight, KeyRound, Shield, RefreshCw,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { dashboardService } from '../services/dashboardService';
import { courseService } from '../services/courseService';
import { requestService } from '../services/requestService';
import { userService } from '../services/userService';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AdminCloudPanel } from '../components/admin/AdminCloudPanel';
import { IssueDiplomaModal } from '../components/admin/IssueDiplomaModal';
import type { DashboardStats, Course, RequestWithDetails, User } from '../types';
import { formatCurrency, getStatusColor, getInitials } from '../utils/formatters';
import { formatDate, formatRelative } from '../utils/dateUtils';

export function DashboardPage() {
  const { session, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcoming, setUpcoming] = useState<Course[]>([]);
  const [recentRequests, setRecentRequests] = useState<RequestWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'cloud'>('overview');

  // Diploma issue modal (Entrega 3.4)
  const [issueOpen, setIssueOpen] = useState(false);
  const [diplomaReloadKey, setDiplomaReloadKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const [s, u, r, allUsers] = await Promise.all([
        dashboardService.getStats(),
        courseService.getUpcoming(),
        isAdmin ? requestService.getPending() : Promise.resolve([]),
        isAdmin ? userService.getAll() : Promise.resolve([]),
      ]);
      setStats(s);
      setUpcoming(u);
      setRecentRequests(r.slice(0, 5));
      setUsers(allUsers);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (user: User) => {
    await userService.toggleActive(user.id!);
    showToast(t('common.updated_success'), 'success');
    load();
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
  if (!isAdmin) return (
    <div className="text-center py-12">
      <p className="text-gray-500">{t('common.error')}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Capçalera Admin */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-500/20 flex items-center justify-center">
              <Shield size={14} className="text-accent-400" />
            </div>
            <span className="text-xs font-bold text-accent-400 uppercase tracking-widest">Administrador</span>
          </div>
          <h1 className="text-2xl font-black text-white font-display mt-1">
            Hola, {session?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Estadístiques */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Usuaris registrats" value={stats.totalUsers}
            icon={<Users size={18} />} color="text-blue-400" />
          <StatCard label="Cursos actius" value={stats.activeCourses}
            icon={<BookOpen size={18} />} color="text-green-400" />
          <StatCard label="Sol·licituds pendents" value={stats.pendingRequests}
            icon={<ClipboardList size={18} />} color="text-yellow-400" />
          <StatCard label="Ingressos totals" value={formatCurrency(stats.totalRevenue)}
            icon={<TrendingUp size={18} />} color="text-accent-400" />
        </div>
      )}

      {/* Resum de pagaments */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-3 text-center">
            <p className="text-base font-black text-green-400 font-display">{stats.paidPayments}</p>
            <p className="text-xs text-gray-600 mt-0.5">Pagats</p>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-3 text-center">
            <p className="text-base font-black text-yellow-400 font-display">{stats.pendingPayments}</p>
            <p className="text-xs text-gray-600 mt-0.5">Pendents</p>
          </div>
          <div className="bg-accent-500/5 border border-accent-500/20 rounded-2xl p-3 text-center">
            <p className="text-sm font-black text-accent-400 font-display">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-600 mt-0.5">Total cobrat</p>
          </div>
        </div>
      )}

      {/* Pestanyes */}
      <div className="flex gap-1 bg-[#111] rounded-xl p-1 border border-[#1e1e1e]">
        {(['overview', 'users', 'cloud'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={['flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab ? 'bg-accent-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300',
            ].join(' ')}>
            {tab === 'overview' ? '📊 Resum'
              : tab === 'users' ? `👥 Usuaris (${users.length})`
              : '☁️ Núvol'}
          </button>
        ))}
      </div>

      {/* ── PESTANYA: RESUM ── */}
      {activeTab === 'overview' && (
        <>
          {/* Accions ràpides */}
          <Card>
            <CardHeader title="Accions ràpides" />
            <div className="grid grid-cols-2 gap-2">
              <Link to="/cursos">
                <Button variant="secondary" fullWidth icon={<Plus size={15} />} size="sm">
                  Nou curs
                </Button>
              </Link>
              <Link to="/admin/pagaments">
                <Button variant="secondary" fullWidth icon={<CreditCard size={15} />} size="sm">
                  Pagaments
                </Button>
              </Link>
              <Link to="/admin/usuaris">
                <Button variant="secondary" fullWidth icon={<Users size={15} />} size="sm">
                  Gestionar usuaris
                </Button>
              </Link>
              <Link to="/configuracio">
                <Button variant="secondary" fullWidth icon={<ArrowRight size={15} />} size="sm">
                  Configuració
                </Button>
              </Link>
            </div>
          </Card>

          {/* Sol·licituds pendents */}
          <Card>
            <CardHeader title={`Sol·licituds pendents (${recentRequests.length})`}
              icon={<ClipboardList size={18} />} />
            {recentRequests.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">Cap sol·licitud pendent</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                    <Clock size={14} className="text-yellow-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{req.userName}</p>
                      <p className="text-xs text-gray-500 truncate">{req.courseName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge className={getStatusColor(req.status)}>
                        {t(`requests.${req.status}`)}
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1">{formatRelative(req.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Propers cursos */}
          <Card>
            <CardHeader title="Propers cursos" icon={<BookOpen size={18} />}
              action={<Link to="/cursos"><Button variant="ghost" size="sm">Tots <ArrowRight size={13} className="inline ml-1" /></Button></Link>} />
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">Cap curs programat</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map((c) => (
                  <Link to={`/cursos/${c.id}`} key={c.id}>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={14} className="text-accent-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{c.name}</p>
                        <p className="text-xs text-gray-600">
                          {c.startDate ? formatDate(c.startDate) : '—'} · {formatCurrency(c.price)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── PESTANYA: USUARIS ── */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Total: <span className="text-white font-semibold">{users.length}</span> usuaris registrats
            </p>
            <Link to="/admin/usuaris">
              <Button variant="outline" size="sm" icon={<Edit size={13} />}>
                Gestió completa
              </Button>
            </Link>
          </div>

          {users.map((user) => (
            <div key={user.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={['w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 font-display',
                  user.role === 'admin' ? 'bg-accent-500/20 text-accent-400' : 'bg-[#1e1e1e] text-gray-400',
                ].join(' ')}>
                  {getInitials(user.name || user.nickname)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{user.name || user.nickname}</p>
                    {user.role === 'admin' && <Shield size={12} className="text-accent-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500">@{user.nickname}</p>
                  {user.email && <p className="text-xs text-gray-600 truncate">{user.email}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={user.active
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20'} dot>
                    {user.active ? 'Actiu' : 'Inactiu'}
                  </Badge>
                  <span className="text-xs text-gray-700">{formatDate(user.createdAt)}</span>
                </div>
              </div>
              {/* Accions ràpides per usuari */}
              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-[#1a1a1a]">
                <button onClick={() => handleToggleActive(user)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                  title={t('users.toggle_active')}>
                  {user.active
                    ? <ToggleRight size={18} className="text-green-400" />
                    : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => setResetTarget(user)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
                  title="Reiniciar PIN">
                  <KeyRound size={15} />
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <p className="text-center text-gray-600 text-sm py-8">Cap usuari registrat</p>
          )}
        </div>
      )}

      {/* ── PESTANYA: NÚVOL ── */}
      {activeTab === 'cloud' && (
        <>
          <div className="flex justify-end mb-3">
            <Button onClick={() => setIssueOpen(true)} size="sm">
              <Award size={14} className="mr-1.5" />
              {t('diploma.issue')}
            </Button>
          </div>

          <AdminCloudPanel key={diplomaReloadKey} />

          <IssueDiplomaModal
            open={issueOpen}
            onClose={() => setIssueOpen(false)}
            onIssued={() => {
              setIssueOpen(false);
              setDiplomaReloadKey((k) => k + 1);
            }}
          />
        </>
      )}

      {/* Diàleg confirmació reset PIN */}
      <ConfirmDialog
        open={resetTarget !== null}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPin}
        title="Reiniciar PIN"
        message={`Estàs segur/a que vols reiniciar la contrasenya de "${resetTarget?.name}" a 123456?`}
        loading={resetting}
        variant="warning"
        confirmLabel="Sí, reiniciar"
      />
    </div>
  );
}
