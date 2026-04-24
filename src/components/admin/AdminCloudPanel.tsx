import React, { useEffect, useState } from 'react';
import {
  Cloud, RefreshCw, Users, FileText, Award,
  CloudOff, TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { adminCloudService, type AdminCloudStats } from '../../services/adminCloudService';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency } from '../../utils/formatters';
import { formatRelative } from '../../utils/dateUtils';

type CloudBudgetStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

/**
 * Panel del dashboard admin que mostra dades del núvol (Supabase).
 * Crida l'Edge Function `admin-stats` via `adminCloudService`.
 *
 * Ús: afegir-lo al DashboardPage.tsx just a dins del tab 'overview'
 * o com a secció separada, condicionat a { isAdmin }.
 */

function statusBadgeColor(status: CloudBudgetStatus): string {
  switch (status) {
    case 'draft':    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'sent':     return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:         return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function AdminCloudPanel() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [stats, setStats] = useState<AdminCloudStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await adminCloudService.summary();
      setStats(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      if (!silent) showToast(t('admin.cloud.error'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    if (refreshing) return;
    fetchStats(true);
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <Card>
        <div className="p-6 flex flex-col items-center text-center gap-3">
          <CloudOff className="text-red-400" size={32} />
          <div>
            <p className="font-semibold text-white">{t('admin.cloud.error')}</p>
            <p className="text-xs text-gray-500 mt-1 font-mono break-all">{error}</p>
          </div>
          <Button onClick={() => fetchStats()} size="sm">
            <RefreshCw size={14} className="mr-1.5" />
            {t('admin.cloud.refresh')}
          </Button>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header amb acció refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-accent-500/15 flex items-center justify-center">
            <Cloud size={18} className="text-accent-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-display">
              {t('admin.cloud.title')}
            </h2>
            <p className="text-xs text-gray-500">{t('admin.cloud.subtitle')}</p>
          </div>
        </div>
        <Button onClick={handleRefresh} size="sm" variant="secondary" disabled={refreshing}>
          <RefreshCw size={14} className={`mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('admin.cloud.refreshing') : t('admin.cloud.refresh')}
        </Button>
      </div>

      {/* Comptadors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={<Users size={18} />}
          label={t('admin.cloud.total_users')}
          value={stats.total_users}
          tone="blue"
        />
        <StatTile
          icon={<FileText size={18} />}
          label={t('admin.cloud.total_budgets')}
          value={stats.total_budgets}
          tone="accent"
        />
        <StatTile
          icon={<Award size={18} />}
          label={t('admin.cloud.total_diplomas')}
          value={stats.total_diplomas}
          tone="yellow"
        />
        <StatTile
          icon={<TrendingUp size={18} />}
          label={t('nav.courses')}
          value={stats.total_enrollments}
          tone="green"
        />
      </div>

      {/* Últims pressuposts */}
      <Card>
        <CardHeader title={t('admin.cloud.recent_budgets')} />
        <div className="px-4 pb-4">
          {stats.recent_budgets.length === 0 ? (
            <p className="text-sm text-gray-500 py-3">{t('admin.cloud.none')}</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {stats.recent_budgets.map((b) => (
                <li key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                    <p className="text-xs text-gray-500">
                      {formatRelative(new Date(b.created_at).getTime())}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={statusBadgeColor(b.status)}>
                      {t(`admin.cloud.status_${b.status}`)}
                    </Badge>
                    <span className="text-sm font-bold text-accent-400 tabular-nums">
                      {formatCurrency(b.total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Últims usuaris + Últims diplomes (2 columnes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title={t('admin.cloud.recent_users')} />
          <div className="px-4 pb-4">
            {stats.recent_users.length === 0 ? (
              <p className="text-sm text-gray-500 py-3">{t('admin.cloud.none')}</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {stats.recent_users.map((u) => (
                  <li key={u.id} className="py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-500/20 text-accent-400 font-bold flex items-center justify-center text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-500">@{u.nickname}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatRelative(new Date(u.created_at).getTime())}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={t('admin.cloud.recent_diplomas')} />
          <div className="px-4 pb-4">
            {stats.recent_diplomas.length === 0 ? (
              <p className="text-sm text-gray-500 py-3">{t('admin.cloud.none')}</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {stats.recent_diplomas.map((d) => (
                  <li key={d.id} className="py-3 flex items-center gap-3">
                    <Award size={18} className="text-yellow-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{d.course_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {d.student_name ?? '—'} · {formatRelative(new Date(d.issued_at).getTime())}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Subcomponent: targeta de comptador
// ─────────────────────────────────────────────────────────────────────

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'blue' | 'accent' | 'yellow' | 'green';
}

const TONE_CLASSES: Record<StatTileProps['tone'], string> = {
  blue:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  accent: 'bg-accent-500/15 text-accent-400 border-accent-500/20',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  green:  'bg-green-500/15 text-green-400 border-green-500/20',
};

function StatTile({ icon, label, value, tone }: StatTileProps) {
  return (
    <div
      className="rounded-2xl p-4 border flex flex-col gap-2 transition-colors"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}
    >
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${TONE_CLASSES[tone]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-display leading-none tabular-nums">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}
