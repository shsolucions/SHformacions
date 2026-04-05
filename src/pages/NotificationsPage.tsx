import React from 'react';
import { Bell, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import type { Notification } from '../types';
import { formatRelative } from '../utils/dateUtils';

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info size={16} className="text-accent-400" />,
  success: <CheckCircle2 size={16} className="text-green-400" />,
  warning: <AlertTriangle size={16} className="text-yellow-400" />,
  error: <XCircle size={16} className="text-red-400" />,
};

const typeBg: Record<string, string> = {
  info: 'bg-accent-500/10 border-accent-500/20',
  success: 'bg-green-500/10 border-green-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
  error: 'bg-red-500/10 border-red-500/20',
};

export function NotificationsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const handleMarkAll = async () => {
    await markAllAsRead();
    showToast(t('notifications.all_read'), 'success');
  };

  const handleClearAll = async () => {
    await clearAll();
    showToast(t('notifications.cleared'), 'success');
  };

  const handleRead = async (n: Notification) => {
    if (!n.read) await markAsRead(n.id!);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} {t('notifications.unread')}
            </p>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" icon={<CheckCheck size={15} />} onClick={handleMarkAll}>
                {t('notifications.mark_all_read')}
              </Button>
            )}
            <Button variant="danger" size="sm" icon={<Trash2 size={15} />} onClick={handleClearAll} />
          </div>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} />}
          title={t('notifications.no_notifications')}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={() => handleRead(n)} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
  t,
}: {
  notification: Notification;
  onRead: () => void;
  t: (k: string) => string;
}) {
  return (
    <button
      onClick={onRead}
      className={[
        'w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all',
        n.read
          ? 'bg-[#141414] border-[#222] opacity-60'
          : typeBg[n.type] ?? 'bg-accent-500/10 border-accent-500/20',
      ].join(' ')}
    >
      <div className={[
        'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
        n.read ? 'bg-[#1e1e1e]' : 'bg-black/30',
      ].join(' ')}>
        {typeIcons[n.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white leading-snug">{n.title}</p>
          {!n.read && (
            <span className="w-2 h-2 rounded-full bg-accent-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5 leading-snug">{n.message}</p>
        <p className="text-xs text-gray-600 mt-1.5">{formatRelative(n.createdAt)}</p>
      </div>
    </button>
  );
}
