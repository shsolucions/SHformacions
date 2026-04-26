import React, { useRef, useState } from 'react';
import {
  Globe, Moon, Sun, Download, Upload, Info,
  Trash2, CloudOff, Check, Bell, CheckCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { backupService } from '../services/backupService';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { SyncAdminPanel } from '../components/admin/SyncAdminPanel';
import { availableLanguages } from '../i18n';
import type { BackupData, Notification } from '../types';
import { formatRelative } from '../utils/dateUtils';

export function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const { isAdmin, session } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const fileRef = useRef<HTMLInputElement>(null);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await backupService.exportData();
      backupService.downloadJson(data);
      showToast(t('settings.export_success'), 'success');
    } catch {
      showToast(t('common.error_generic'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as BackupData;
        setPendingImport(data);
        setShowImportConfirm(true);
      } catch {
        showToast(t('settings.import_error'), 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!pendingImport) return;
    setImporting(true);
    try {
      await backupService.importData(pendingImport);
      showToast(t('settings.import_success'), 'success');
    } catch {
      showToast(t('settings.import_error'), 'error');
    } finally {
      setImporting(false);
      setShowImportConfirm(false);
      setPendingImport(null);
    }
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      await backupService.clearAllData();
      showToast(t('settings.cleared'), 'success');
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-white font-display">{t('settings.title')}</h1>

      {/* Language */}
      <Card>
        <CardHeader title={t('settings.language')} icon={<Globe size={18} />} />
        <div className="flex flex-col gap-2">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={[
                'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                language === lang.code
                  ? 'border-accent-500/50 bg-accent-500/10'
                  : 'border-[#2a2a2a] hover:border-[#333] bg-[#1a1a1a]',
              ].join(' ')}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="flex-1 text-sm font-medium text-white">{lang.label}</span>
              {language === lang.code && (
                <Check size={16} className="text-accent-400" />
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader title={t('settings.theme')} icon={<Moon size={18} />} />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={[
              'flex items-center justify-center gap-2 p-4 rounded-xl border transition-all',
              theme === 'dark'
                ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
                : 'border-[#2a2a2a] text-gray-500 hover:border-[#333]',
            ].join(' ')}
          >
            <Moon size={18} />
            <span className="text-sm font-medium">{t('settings.theme_dark')}</span>
            {theme === 'dark' && <Check size={14} />}
          </button>
          <button
            onClick={() => setTheme('light')}
            className={[
              'flex items-center justify-center gap-2 p-4 rounded-xl border transition-all',
              theme === 'light'
                ? 'border-accent-500/50 bg-accent-500/10 text-accent-400'
                : 'border-[#2a2a2a] text-gray-500 hover:border-[#333]',
            ].join(' ')}
          >
            <Sun size={18} />
            <span className="text-sm font-medium">{t('settings.theme_light')}</span>
            {theme === 'light' && <Check size={14} />}
          </button>
        </div>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader title={t('settings.backup_section')} icon={<Download size={18} />} />
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl">
            <div className="min-w-0 mr-3">
              <p className="text-sm font-medium text-white">{t('settings.export')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.export_desc')}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleExport}
              loading={exporting}
            >
              {t('settings.export')}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-xl">
            <div className="min-w-0 mr-3">
              <p className="text-sm font-medium text-white">{t('settings.import')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.import_desc')}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={14} />}
              onClick={() => fileRef.current?.click()}
              loading={importing}
            >
              {t('settings.import')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </Card>

      {/* Avisos / Notificacions */}
      {session && (
        <Card>
          <CardHeader
            title={t('notifications.title')}
            icon={<Bell size={18} />}
            action={
              notifications.length > 0 ? (
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead().then(() => showToast(t('notifications.all_read'), 'success'))}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5"
                    >
                      <CheckCheck size={13} />
                      {t('notifications.mark_all_read')}
                    </button>
                  )}
                  <button
                    onClick={() => clearAll().then(() => showToast(t('notifications.cleared'), 'success'))}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : undefined
            }
          />
          {notifications.length === 0 ? (
            <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl">
              <Bell size={18} className="text-gray-600" />
              <p className="text-sm text-gray-500">{t('notifications.no_notifications')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.slice(0, 10).map((n) => (
                <NotificationRow key={n.id} notification={n} onRead={() => { if (!n.read) markAsRead(n.id!); }} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Cloud sync (coming soon) */}
      <Card>
        <CardHeader title={t('settings.cloud_sync')} icon={<CloudOff size={18} />} />
        <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl">
          <CloudOff size={20} className="text-gray-600" />
          <div>
            <p className="text-sm text-gray-400">{t('settings.cloud_sync')}</p>
            <p className="text-xs text-gray-600 mt-0.5">{t('settings.coming_soon')}</p>
          </div>
          <span className="ml-auto text-xs bg-accent-500/10 text-accent-400 border border-accent-500/20 px-2 py-0.5 rounded-full">
            {t('settings.coming_soon')}
          </span>
        </div>
      </Card>

      {/* App info */}
      <Card>
        <CardHeader title={t('settings.app_info')} icon={<Info size={18} />} />
        <div className="flex flex-col gap-3">
          <InfoRow label={t('settings.app_name')} value="SHformacions" />
          <AppVersionRow label={t('settings.app_version')} />
          <InfoRow label="SH Solucions" value={`© ${new Date().getFullYear()}`} />
        </div>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardHeader title={t('common.warning')} />
        <div className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
          <div className="min-w-0 mr-3">
            <p className="text-sm font-medium text-red-400">{t('settings.clear_data')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('settings.clear_confirm')}</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => setShowClearConfirm(true)}
          >
            {t('settings.clear_data')}
          </Button>
        </div>
      </Card>

      {/* Confirm clear */}
      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearData}
        title={t('settings.clear_data')}
        message={t('settings.clear_confirm')}
        loading={clearing}
      />

      {/* Confirm import */}
      <ConfirmDialog
        open={showImportConfirm}
        onClose={() => { setShowImportConfirm(false); setPendingImport(null); }}
        onConfirm={handleImport}
        title={t('settings.import')}
        message={t('settings.import_confirm')}
        loading={importing}
        variant="warning"
        confirmLabel={t('settings.import')}
      />

      {/* Panell sincronització Dexie ↔ Supabase (només admin) */}
      {isAdmin && <SyncAdminPanel />}
    </div>
  );
}

function AppVersionRow({ label }: { label: string }) {
  const d = new Date(__BUILD_TIME__);
  const pad = (n: number) => String(n).padStart(2, '0');
  const version = `1.0.0 · ${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return <InfoRow label={label} value={version} />;
}

function BuildInfo() {
  const d = new Date(__BUILD_TIME__);
  const pad = (n: number) => String(n).padStart(2, '0');
  const version = `sh${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}.${pad(d.getHours())}${pad(d.getMinutes())}`;
  const dateStr = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return (
    <>
      <InfoRow label="Versió" value={version} />
      <InfoRow label="Última actualització" value={dateStr} />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function NotificationRow({ notification: n, onRead }: { notification: Notification; onRead: () => void }) {
  const dotColor =
    n.type === 'success' ? 'bg-green-400' :
    n.type === 'warning' ? 'bg-yellow-400' :
    n.type === 'error'   ? 'bg-red-400' :
    'bg-accent-400';

  return (
    <button
      onClick={onRead}
      className={[
        'w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all',
        n.read ? 'bg-[#141414] border-[#222] opacity-60' : 'bg-[#1a1a1a] border-[#2a2a2a]',
      ].join(' ')}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!n.read && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />}
          <p className="text-sm font-semibold text-white leading-snug truncate">{n.title}</p>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{n.message}</p>
        <p className="text-xs text-gray-600 mt-1">{formatRelative(n.createdAt)}</p>
      </div>
    </button>
  );
}
