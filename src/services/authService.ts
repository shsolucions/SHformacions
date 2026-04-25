import { supabase, isCloudEnabled } from './supabase';
import { db } from '../db/database';
import { hashPin, verifyPin } from '../utils/crypto';
import type { Session, User, UserRole } from '../types';

const SESSION_KEY = 'shformacions_session';
const SUPABASE_UID_KEY = 'shformacions_supabase_uid';

/**
 * Credencials hardcoded de l'admin.
 * L'admin NO viu a Supabase — és una sessió local 100%.
 * Accés: 5 tocs al logo del Header → modal amb aquests credencials.
 */
const ADMIN_NICKNAME = 'skinsad';
const ADMIN_PIN = 'Palestina!';

type AuthErrorCode =
  | 'invalid_credentials'
  | 'account_inactive'
  | 'user_exists'
  | 'cloud_unavailable'
  | 'not_found'
  | 'pin_wrong'
  | 'weak_password'
  | 'email_not_confirmed'
  | 'network';

function authError(code: AuthErrorCode): Error {
  return new Error(code);
}

/**
 * Assegura que existeix l'usuari admin local a Dexie.
 * Es crea només un cop (si no hi és). Sempre retorna el mateix usuari.
 */
async function ensureLocalAdmin(): Promise<User> {
  const existing = await db.users
    .where('nickname')
    .equalsIgnoreCase(ADMIN_NICKNAME)
    .first();
  if (existing) return existing;

  const pinHash = await hashPin(ADMIN_PIN);
  const now = Date.now();
  const id = await db.users.add({
    nickname: ADMIN_NICKNAME,
    name: 'Administrador',
    email: undefined,
    pinHash,
    role: 'admin',
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  return (await db.users.get(id as number))!;
}

/**
 * Sincronitza un usuari Supabase al Dexie local.
 * Si no hi és a Dexie, el crea i guarda el mapping Supabase UID → id local
 * a localStorage. Això permet que la UI (ProfilePage, BudgetPage, etc.)
 * continuï treballant amb Dexie i ids numèrics sense canviar res.
 */
async function mirrorSupabaseUserToDexie(
  supabaseId: string,
  profile: { nickname: string; name: string; email?: string | null }
): Promise<User> {
  const mappingKey = `shformacions_uid_${supabaseId}`;
  const storedLocalId = localStorage.getItem(mappingKey);

  // Cas 1: ja tenim un id local mapejat — actualitzem i retornem
  if (storedLocalId) {
    const localId = Number(storedLocalId);
    const existing = await db.users.get(localId);
    if (existing) {
      await db.users.update(localId, {
        nickname: profile.nickname,
        name: profile.name,
        email: profile.email ?? undefined,
        updatedAt: Date.now(),
      });
      return (await db.users.get(localId))!;
    }
    // Si el mapping existia però la fila Dexie s'havia esborrat, recreem
    localStorage.removeItem(mappingKey);
  }

  // Cas 2: busca per nickname per si coincidia amb un usuari local previ
  const byNickname = await db.users
    .where('nickname')
    .equalsIgnoreCase(profile.nickname)
    .first();
  if (byNickname && byNickname.id != null) {
    localStorage.setItem(mappingKey, String(byNickname.id));
    await db.users.update(byNickname.id, {
      name: profile.name,
      email: profile.email ?? byNickname.email,
      updatedAt: Date.now(),
    });
    return (await db.users.get(byNickname.id))!;
  }

  // Cas 3: usuari completament nou — el creem a Dexie
  const now = Date.now();
  const id = await db.users.add({
    nickname: profile.nickname,
    name: profile.name,
    email: profile.email ?? undefined,
    pinHash: '',  // cloud users don't have local pinHash initially
    role: 'user',
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  localStorage.setItem(mappingKey, String(id));
  return (await db.users.get(id as number))!;
}

function setSession(user: User, supabaseUid?: string): Session {
  const session: Session = {
    userId: user.id!,
    nickname: user.nickname,
    name: user.name,
    role: user.role,
    loginAt: new Date().toISOString(),
  };
  if (supabaseUid) {
    localStorage.setItem(SUPABASE_UID_KEY, supabaseUid);
  } else {
    localStorage.removeItem(SUPABASE_UID_KEY);
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

async function resolveEmailByNickname(nickname: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .rpc('get_email_by_nickname', { p_nickname: nickname });
  if (error || !data) return null;
  return data as string;
}

function mapSupabaseError(err: { message?: string; status?: number }): AuthErrorCode {
  const m = (err.message ?? '').toLowerCase();
  if (m.includes('invalid login')) return 'invalid_credentials';
  if (m.includes('email not confirmed')) return 'email_not_confirmed';
  if (m.includes('user already')) return 'user_exists';
  if (m.includes('password should be')) return 'weak_password';
  if (err.status && err.status >= 500) return 'network';
  return 'invalid_credentials';
}

export const authService = {
  /**
   * Login:
   *   · skinsad/Palestina! → sessió amb l'usuari admin Dexie (creat si no existeix)
   *   · usuari local existent (Dexie) → auth local (offline-friendly)
   *   · usuari no local però a Supabase → auth Supabase + mirror a Dexie
   */
  async login(nicknameOrEmail: string, pin: string): Promise<User> {
    const trimmed = nicknameOrEmail.trim();

    // 1) Admin hardcoded
    if (trimmed === ADMIN_NICKNAME && pin === ADMIN_PIN) {
      // Si hi ha una sessió Supabase residual d'un usuari anterior,
      // la tanquem per evitar que el proper refresh la detecti i sobreescrigui
      // la sessió admin local.
      if (isCloudEnabled() && supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      const adminUser = await ensureLocalAdmin();
      setSession(adminUser);
      return adminUser;
    }

    // 2) Usuari local (Dexie) — si n'hi ha un amb aquest nickname, l'autentiquem localment
    const localUser = await db.users
      .where('nickname')
      .equalsIgnoreCase(trimmed)
      .first();
    if (localUser && localUser.pinHash) {
      const valid = await verifyPin(pin, localUser.pinHash);
      if (valid) {
        if (!localUser.active) throw authError('account_inactive');
        setSession(localUser);
        return localUser;
      }
      throw authError('invalid_credentials');
    }

    // 3) Només Supabase — l'usuari existeix al núvol però no a Dexie localment
    if (!isCloudEnabled() || !supabase) {
      throw authError('invalid_credentials');
    }

    let email = trimmed;
    if (!trimmed.includes('@')) {
      const resolved = await resolveEmailByNickname(trimmed);
      if (!resolved) throw authError('invalid_credentials');
      email = resolved;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });
    if (error || !data.user) {
      throw authError(mapSupabaseError(error ?? {}));
    }

    const { data: profile, error: perr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (perr || !profile) throw authError('not_found');

    // Mirror a Dexie perquè la UI funcioni amb id numèric
    const mirrored = await mirrorSupabaseUserToDexie(data.user.id, {
      nickname: profile.nickname,
      name: profile.name,
      email: profile.email ?? data.user.email,
    });

    // Guardar el pinHash per permetre login offline al pròxim cop
    // (si l'usuari no té internet, el cas 2 agafarà aquest hash)
    if (mirrored.id != null) {
      const pinHash = await hashPin(pin);
      await db.users.update(mirrored.id, { pinHash });
    }

    setSession(mirrored, data.user.id);
    return mirrored;
  },

  /**
   * Registre d'un nou usuari.
   * - Si hi ha Supabase + email → camí cloud (password >= 6 chars) + mirror Dexie.
   * - Si no → es crea només a Dexie.
   */
  async register(
    nickname: string,
    name: string,
    pin: string,
    email?: string,
    role: UserRole = 'user'
  ): Promise<User> {
    const trimmedNick = nickname.trim();
    const trimmedName = name.trim();

    const existing = await db.users
      .where('nickname')
      .equalsIgnoreCase(trimmedNick)
      .first();
    if (existing) throw authError('user_exists');

    // Camí cloud (Supabase + email + password >= 6 chars)
    if (email && isCloudEnabled() && supabase) {
      if (!pin || pin.length < 6) throw authError('weak_password');

      const { data, error } = await supabase.auth.signUp({
        email,
        password: pin,
        options: {
          data: { nickname: trimmedNick, name: trimmedName },
        },
      });
      if (error || !data.user) {
        throw authError(mapSupabaseError(error ?? {}));
      }

      const pinHash = await hashPin(pin);
      const mirrored = await mirrorSupabaseUserToDexie(data.user.id, {
        nickname: trimmedNick,
        name: trimmedName,
        email,
      });
      if (mirrored.id != null) {
        await db.users.update(mirrored.id, { pinHash, role });
        const refreshed = (await db.users.get(mirrored.id))!;
        if (data.session) setSession(refreshed, data.user.id);
        return refreshed;
      }
      return mirrored;
    }

    // Camí només local
    const pinHash = await hashPin(pin);
    const now = Date.now();
    const id = await db.users.add({
      nickname: trimmedNick,
      name: trimmedName,
      email,
      pinHash,
      role,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    const user = (await db.users.get(id as number))!;
    setSession(user);
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SUPABASE_UID_KEY);
    if (isCloudEnabled() && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
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

  /** UID de Supabase de l'usuari actual (per fer crides cloud). null si no n'hi ha. */
  getSupabaseUid(): string | null {
    return localStorage.getItem(SUPABASE_UID_KEY);
  },

  isAdmin(): boolean {
    return this.getSession()?.role === 'admin';
  },

  /**
   * Canvia el PIN:
   * - Admin o usuari només-local: actualitza Dexie.
   * - Usuari cloud (amb supabaseUid): actualitza Supabase + Dexie.
   */
  async changePin(userId: number, currentPin: string, newPin: string): Promise<void> {
    const user = await db.users.get(userId);
    if (!user) throw authError('not_found');

    const valid = await verifyPin(currentPin, user.pinHash);
    if (!valid) throw authError('pin_wrong');

    const supabaseUid = this.getSupabaseUid();
    if (supabaseUid && isCloudEnabled() && supabase && user.role !== 'admin') {
      if (newPin.length < 8) throw authError('weak_password');

      const { data: userResp } = await supabase.auth.getUser();
      const email = userResp.user?.email;
      if (!email) throw authError('not_found');

      const reauth = await supabase.auth.signInWithPassword({
        email,
        password: currentPin,
      });
      if (reauth.error) throw authError('pin_wrong');

      const { error } = await supabase.auth.updateUser({ password: newPin });
      if (error) throw authError('weak_password');
    }

    const newHash = await hashPin(newPin);
    await db.users.update(userId, { pinHash: newHash, updatedAt: Date.now() });
  },

  /**
   * Reset de PIN a 123456 (només afecta Dexie).
   * Els usuaris amb compte Supabase no veuran el seu password cloud canviat —
   * això és per disseny: l'admin no pot canviar passwords Supabase d'altres.
   */
  async resetPin(userId: number): Promise<void> {
    const newHash = await hashPin('123456');
    await db.users.update(userId, { pinHash: newHash, updatedAt: Date.now() });
  },
};

export const ADMIN_CREDENTIALS = {
  nickname: ADMIN_NICKNAME,
  pin: ADMIN_PIN,
} as const;
