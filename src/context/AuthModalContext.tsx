import React, {
  createContext, useContext, useState, useCallback, type ReactNode,
} from 'react';

interface AuthModalContextValue {
  isOpen: boolean;
  mode: 'login' | 'register';
  onSuccessCallback: (() => void) | null;
  openAuthModal: (mode?: 'login' | 'register', onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  switchMode: (mode: 'login' | 'register') => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  const openAuthModal = useCallback((m: 'login' | 'register' = 'login', onSuccess?: () => void) => {
    setMode(m);
    setOnSuccessCallback(() => onSuccess ?? null);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    setOnSuccessCallback(null);
  }, []);

  const switchMode = useCallback((m: 'login' | 'register') => setMode(m), []);

  return (
    <AuthModalContext.Provider value={{ isOpen, mode, onSuccessCallback, openAuthModal, closeAuthModal, switchMode }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}
