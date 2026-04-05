import { db } from '../db/database';
import type { BackupData } from '../types';

export const backupService = {
  async exportData(): Promise<BackupData> {
    const [users, courses, requests, payments, notifications, settings] =
      await Promise.all([
        db.users.toArray(),
        db.courses.toArray(),
        db.requests.toArray(),
        db.payments.toArray(),
        db.notifications.toArray(),
        db.settings.toArray(),
      ]);

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      users,
      courses,
      requests,
      payments,
      notifications,
      settings,
    };
  },

  async importData(data: BackupData): Promise<void> {
    // Validate structure
    if (
      !data.version ||
      !Array.isArray(data.users) ||
      !Array.isArray(data.courses)
    ) {
      throw new Error('invalid_backup');
    }

    await db.transaction(
      'rw',
      [
        db.users,
        db.courses,
        db.requests,
        db.payments,
        db.notifications,
        db.settings,
      ],
      async () => {
        await db.users.clear();
        await db.courses.clear();
        await db.requests.clear();
        await db.payments.clear();
        await db.notifications.clear();
        await db.settings.clear();

        if (data.users.length > 0) await db.users.bulkAdd(data.users);
        if (data.courses.length > 0) await db.courses.bulkAdd(data.courses);
        if (data.requests.length > 0) await db.requests.bulkAdd(data.requests);
        if (data.payments.length > 0) await db.payments.bulkAdd(data.payments);
        if (data.notifications.length > 0)
          await db.notifications.bulkAdd(data.notifications);
        if (data.settings && data.settings.length > 0)
          await db.settings.bulkAdd(data.settings);
      }
    );
  },

  downloadJson(data: BackupData): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `shformacions_backup_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async clearAllData(): Promise<void> {
    await db.transaction(
      'rw',
      [
        db.users,
        db.courses,
        db.requests,
        db.payments,
        db.notifications,
        db.settings,
      ],
      async () => {
        await db.users.clear();
        await db.courses.clear();
        await db.requests.clear();
        await db.payments.clear();
        await db.notifications.clear();
        await db.settings.clear();
      }
    );
  },

  async getSetting(key: string): Promise<string | undefined> {
    const setting = await db.settings.where('key').equals(key).first();
    return setting?.value;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) {
      await db.settings.update(existing.id!, { value });
    } else {
      await db.settings.add({ key, value });
    }
  },
};
