import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!session) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const isAdmin = session.role === 'admin';
    const notifs = await notificationService.getAll(
      isAdmin ? undefined : session.userId
    );
    setNotifications(notifs);
    const count = await notificationService.getUnreadCount(
      isAdmin ? undefined : session.userId
    );
    setUnreadCount(count);
  }, [session]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markAsRead = useCallback(
    async (id: number) => {
      await notificationService.markAsRead(id);
      await refresh();
    },
    [refresh]
  );

  const markAllAsRead = useCallback(async () => {
    const userId = session?.role === 'admin' ? undefined : session?.userId;
    await notificationService.markAllAsRead(userId);
    await refresh();
  }, [refresh, session]);

  const clearAll = useCallback(async () => {
    const userId = session?.role === 'admin' ? undefined : session?.userId;
    await notificationService.clearAll(userId);
    await refresh();
  }, [refresh, session]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, refresh, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
