import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import type { Session, User } from '../types';

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (nickname: string, pin: string) => Promise<User>;
  logout: () => void;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    authService.getSession()
  );

  const login = useCallback(async (nickname: string, pin: string): Promise<User> => {
    const user = await authService.login(nickname, pin);
    setSession(authService.getSession());
    return user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  const refreshSession = useCallback(() => {
    setSession(authService.getSession());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: session !== null,
        isAdmin: session?.role === 'admin',
        login,
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
