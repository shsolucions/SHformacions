import { db } from '../db/database';
import type { Notification, NotificationType } from '../types';

export const notificationService = {
  async getAll(userId?: number): Promise<Notification[]> {
    if (userId !== undefined) {
      const userNotifs = await db.notifications
        .where('userId')
        .equals(userId)
        .reverse()
        .sortBy('createdAt');
      const globalNotifs = await db.notifications
        .filter((n) => n.userId === undefined)
        .reverse()
        .sortBy('createdAt');
      return [...userNotifs, ...globalNotifs].sort(
        (a, b) => b.createdAt - a.createdAt
      );
    }
    return db.notifications.orderBy('createdAt').reverse().toArray();
  },

  async getUnreadCount(userId?: number): Promise<number> {
    if (userId !== undefined) {
      const userUnread = await db.notifications
        .where('userId')
        .equals(userId)
        .and((n) => !n.read)
        .count();
      const globalUnread = await db.notifications
        .filter((n) => n.userId === undefined && !n.read)
        .count();
      return userUnread + globalUnread;
    }
    return db.notifications.where('read').equals(0).count();
  },

  async create(
    title: string,
    message: string,
    type: NotificationType = 'info',
    userId?: number,
    link?: string
  ): Promise<void> {
    await db.notifications.add({
      userId,
      type,
      title,
      message,
      read: false,
      link,
      createdAt: Date.now(),
    });
  },

  async markAsRead(id: number): Promise<void> {
    await db.notifications.update(id, { read: true });
  },

  async markAllAsRead(userId?: number): Promise<void> {
    const all = await db.notifications.toArray();
    const toUpdate = all.filter((n) =>
      !n.read && (userId === undefined || n.userId === userId || n.userId === undefined)
    );
    await Promise.all(toUpdate.map((n) => db.notifications.update(n.id!, { read: true })));
  },

  async clearAll(userId?: number): Promise<void> {
    if (userId !== undefined) {
      await db.notifications.where('userId').equals(userId).delete();
    } else {
      await db.notifications.clear();
    }
  },

  async delete(id: number): Promise<void> {
    await db.notifications.delete(id);
  },
};
