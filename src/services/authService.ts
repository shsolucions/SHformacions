import { db } from '../db/database';
import { hashPin, verifyPin } from '../utils/crypto';
import type { Session, User, UserRole } from '../types';

const SESSION_KEY = 'shformacions_session';

export const authService = {
  async login(nickname: string, pin: string): Promise<User> {
    const user = await db.users
      .where('nickname')
      .equalsIgnoreCase(nickname.trim())
      .first();

    if (!user) throw new Error('invalid_credentials');
    if (!user.active) throw new Error('account_inactive');

    const valid = await verifyPin(pin, user.pinHash);
    if (!valid) throw new Error('invalid_credentials');

    authService._setSession(user);
    return user;
  },

  _setSession(user: User): void {
    const session: Session = {
      userId: user.id!,
      nickname: user.nickname,
      name: user.name,
      role: user.role,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession(): Session | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  },

  async register(
    nickname: string,
    name: string,
    pin: string,
    email?: string,
    role: UserRole = 'user'
  ): Promise<User> {
    const existing = await db.users
      .where('nickname')
      .equalsIgnoreCase(nickname.trim())
      .first();
    if (existing) throw new Error('user_exists');

    const pinHash = await hashPin(pin);
    const now = Date.now();

    const id = await db.users.add({
      nickname: nickname.trim(),
      name: name.trim(),
      email,
      pinHash,
      role,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    const user = (await db.users.get(id as number))!;
    authService._setSession(user);
    return user;
  },

  async changePin(userId: number, currentPin: string, newPin: string): Promise<void> {
    const user = await db.users.get(userId);
    if (!user) throw new Error('not_found');

    const valid = await verifyPin(currentPin, user.pinHash);
    if (!valid) throw new Error('pin_wrong');

    const newHash = await hashPin(newPin);
    await db.users.update(userId, { pinHash: newHash, updatedAt: Date.now() });
  },

  async resetPin(userId: number): Promise<void> {
    const newHash = await hashPin('1234');
    await db.users.update(userId, { pinHash: newHash, updatedAt: Date.now() });
  },
};
