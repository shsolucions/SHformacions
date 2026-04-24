import React, { useEffect, useState } from 'react';
import {
  Cloud, UploadCloud, DownloadCloud, Loader2,
  CheckCircle, AlertCircle, Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { adminSyncService, type SyncResult } from '../../services/adminSyncService';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { formatRelative } from '../../utils/dateUtils';

/**
 * Panel de sincronització Dexie ↔ Supabase per a l'admin.
 *
 * Ús suggerit: dins de `SettingsPage.tsx`, condicionat a { isAdmin }:
 *
 *   import { useAuth } from '../context/AuthContext';
 *   import { SyncAdminPanel } from '../components/admin/SyncAdminPanel';
 *
 *   const { isAdmin } = useAuth();
 *   {isAdmin && <SyncAdminPanel />}
 */
export function SyncAdminPanel() {
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof adminSyncService.localSummary>
  > | null>(null);
  const [lastPush, setLastPush] = useState<string | null>(null);
  const [lastPull, setLastPull] = useState<string | null>(null);

  const [busy, setBusy] = useState<false | 'push' | 'pull'>(false);
  const [pushConfirm, setPushConfirm] = useState(false);
  const [pullConfirm, setPullConfirm] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const reload = async () => {
    try {
      const s = await adminSyncService.localSummary();
      setSummary(s);
      const times = adminSyncService.getLastSyncTimes();
      setLastPush(times.lastPush);
      setLastPull(times.lastPull);
    } catch (err) {
      console.error('[SyncAdminPanel] reload', err);
    }
  };

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const handlePush = async () => {
    setPushConfirm(false);
    setBusy('push');
    setLastResult(null);
    try {
      const r = await adminSyncService.pushCourses();
      setLastResult(r);
      showToast(`${t('sync.push_success')} (${r.count})`, 'success');
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[SyncAdminPanel] push', err);
      showToast(`${t('sync.error')}: ${msg}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePull = async () => {
    setPullConfirm(false);
    setBusy('pull');
    setLastResult(null);
    try {
      const r = await adminSyncService.pullCourses();
      setLastResult(r);
      showToast(`${t('sync.pull_success')} (${r.count})`, 'success');
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[SyncAdminPanel] pull', err);
      showToast(`${t('sync.error')}: ${msg}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title={t('sync.title')}
          subtitle={t('sync.subtitle')}
          icon={<Cloud size={18} />}
        />

        <div className="p-4 flex flex-col gap-4">
          {/* Resum local */}
          {summary && (
            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                <Database size={13} />
                <span className="uppercase tracking-wide font-semibold">Local</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Row label={t('sync.courses_count', { count: String(summary.courses) })} value={summary.courses} />
                <Row label={t('sync.users_count', { count: String(summary.users) })} value={summary.users} />
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <TimestampRow
              icon={<UploadCloud size={13} />}
              label={t('sync.last_push')}
              value={lastPush}
            />
            <TimestampRow
              icon={<DownloadCloud size={13} />}
              label={t('sync.last_pull')}
              value={lastPull}
            />
          </div>

          {/* Acció: PUSH */}
          <Button
            onClick={() => setPushConfirm(true)}
            disabled={busy !== false}
            className="w-full"
            variant="secondary"
          >
            {busy === 'push' ? (
              <>
                <Loader2 className="animate-spin mr-2" size={14} />
                {t('sync.pushing')}
              </>
            ) : (
              <>
                <UploadCloud size={14} className="mr-2" />
                {t('sync.push')}
              </>
            )}
          </Button>

          {/* Acció: PULL */}
          <Button
            onClick={() => setPullConfirm(true)}
            disabled={busy !== false}
            className="w-full"
            variant="secondary"
          >
            {busy === 'pull' ? (
              <>
                <Loader2 className="animate-spin mr-2" size={14} />
                {t('sync.pulling')}
              </>
            ) : (
              <>
                <DownloadCloud size={14} className="mr-2" />
                {t('sync.pull')}
              </>
            )}
          </Button>

          {/* Resultat de l'última operació */}
          {lastResult && (
            <div
              className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                lastResult.ok
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {lastResult.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              <div>
                <p className="font-semibold capitalize">{lastResult.entity}</p>
                <p className="opacity-80">
                  {lastResult.count} {t('sync.courses_count', { count: '' }).trim()} · {formatRelative(new Date(lastResult.at).getTime())}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Confirmació PUSH */}
      <ConfirmDialog
        open={pushConfirm}
        onClose={() => setPushConfirm(false)}
        onConfirm={handlePush}
        title={t('sync.push')}
        message={t('sync.confirm_push', { count: String(summary?.courses ?? 0) })}
        confirmLabel={t('sync.push')}
      />

      {/* Confirmació PULL */}
      <ConfirmDialog
        open={pullConfirm}
        onClose={() => setPullConfirm(false)}
        onConfirm={handlePull}
        title={t('sync.pull')}
        message={t('sync.confirm_pull')}
        confirmLabel={t('sync.pull')}
        variant="danger"
      />
    </>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-gray-300">
      <span className="truncate">{label}</span>
      <span className="font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}

function TimestampRow({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="bg-black/10 rounded-lg px-3 py-2 border border-white/5">
      <div className="flex items-center gap-1.5 text-gray-500 mb-0.5">
        {icon}
        <span className="uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="text-gray-300">
        {value ? formatRelative(new Date(value).getTime()) : (
          <span className="text-gray-500 italic">—</span>
        )}
      </p>
    </div>
  );
}
