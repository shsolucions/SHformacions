import { db } from '../db/database';
import type { User, UserRole } from '../types';
import { hashPin } from '../utils/crypto';

export const userService = {
  async getAll(): Promise<User[]> {
    return db.users.orderBy('createdAt').reverse().toArray();
  },

  async getById(id: number): Promise<User | undefined> {
    return db.users.get(id);
  },

  async create(
    nickname: string,
    name: string,
    pin: string,
    role: UserRole = 'user',
    email?: string
  ): Promise<User> {
    const existing = await db.users
      .where('nickname')
      .equalsIgnoreCase(nickname)
      .first();
    if (existing) throw new Error('user_exists');

    const pinHash = await hashPin(pin);
    const now = Date.now();
    const id = await db.users.add({
      nickname,
      name,
      email,
      pinHash,
      role,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    return (await db.users.get(id as number))!;
  },

  async update(
    id: number,
    data: {
      name?: string;
      email?: string;
      role?: UserRole;
      active?: boolean;
      nickname?: string;
    }
  ): Promise<void> {
    if (data.nickname) {
      const existing = await db.users
        .where('nickname')
        .equalsIgnoreCase(data.nickname)
        .first();
      if (existing && existing.id !== id) throw new Error('user_exists');
    }
    await db.users.update(id, { ...data, updatedAt: Date.now() });
  },

  async delete(id: number): Promise<void> {
    // Cascade
    await db.requests.where('userId').equals(id).delete();
    await db.payments.where('userId').equals(id).delete();
    await db.notifications.where('userId').equals(id).delete();
    await db.users.delete(id);
  },

  async toggleActive(id: number): Promise<void> {
    const user = await db.users.get(id);
    if (!user) return;
    await db.users.update(id, { active: !user.active, updatedAt: Date.now() });
  },

  async resetPin(id: number): Promise<void> {
    const hash = await hashPin('123456');
    await db.users.update(id, { pinHash: hash, updatedAt: Date.now() });
  },

  async countAdmins(): Promise<number> {
    return db.users.where('role').equals('admin').and((u) => u.active).count();
  },
};
