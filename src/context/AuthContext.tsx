import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import { supabase, isCloudEnabled } from '../services/supabase';
import { db } from '../db/database';
import type { Session, User, UserRole } from '../types';

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (nickname: string, pin: string) => Promise<User>;
  register: (
    nickname: string,
    name: string,
    pin: string,
    email?: string,
    role?: UserRole
  ) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'shformacions_session';
const SUPABASE_UID_KEY = 'shformacions_supabase_uid';

/**
 * Reconstrueix una sessió local a partir d'una sessió Supabase activa
 * (p. ex. quan l'usuari torna a obrir l'app i el JWT encara és vàlid).
 * Si l'usuari ja existeix a Dexie (via el mapping), el fem servir;
 * si no, el creem.
 */
async function rebuildLocalSessionFromSupabase(supabaseUid: string): Promise<Session | null> {
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUid)
    .single();
  if (!profile) return null;

  const mappingKey = `shformacions_uid_${supabaseUid}`;
  const storedLocalId = localStorage.getItem(mappingKey);

  let localUser: User | undefined;

  if (storedLocalId) {
    localUser = await db.users.get(Number(storedLocalId));
  }
  if (!localUser) {
    // Crear mirror a Dexie
    const now = Date.now();
    const id = await db.users.add({
      nickname: profile.nickname,
      name: profile.name,
      email: profile.email ?? undefined,
      pinHash: '',
      role: 'user',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    localStorage.setItem(mappingKey, String(id));
    localUser = (await db.users.get(id as number))!;
  }

  const sess: Session = {
    userId: localUser.id!,
    nickname: localUser.nickname,
    name: localUser.name,
    role: localUser.role,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  localStorage.setItem(SUPABASE_UID_KEY, supabaseUid);
  return sess;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    authService.getSession()
  );
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(() => {
    setSession(authService.getSession());
  }, []);

  // Escolta canvis d'auth de Supabase (token refresh, signOut a un altre tab, etc.)
  // IMPORTANT: NO tocar mai la sessió si l'usuari actual és admin local.
  useEffect(() => {
    const currentSession = authService.getSession();
    // Si ja hi ha sessió d'admin o sessió d'usuari local sense supabaseUid,
    // no reescrivim res — és sessió vàlida local.
    if (currentSession?.role === 'admin' || !isCloudEnabled() || !supabase) {
      setLoading(false);
      return;
    }

    // Comprovació inicial — si hi ha sessió Supabase però no localStorage,
    // reconstruïm la sessió local fent mirror a Dexie.
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session && !authService.getSession()) {
        const sess = await rebuildLocalSessionFromSupabase(data.session.user.id);
        if (sess) setSession(sess);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Mai tocar la sessió local si l'usuari actual és admin
      if (authService.getSession()?.role === 'admin') return;

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SUPABASE_UID_KEY);
        setSession(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (nickname: string, pin: string): Promise<User> => {
    const user = await authService.login(nickname, pin);
    setSession(authService.getSession());
    return user;
  }, []);

  const register = useCallback(
    async (
      nickname: string,
      name: string,
      pin: string,
      email?: string,
      role: UserRole = 'user'
    ): Promise<User> => {
      const user = await authService.register(nickname, name, pin, email, role);
      setSession(authService.getSession());
      return user;
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: session !== null,
        isAdmin: session?.role === 'admin',
        loading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
