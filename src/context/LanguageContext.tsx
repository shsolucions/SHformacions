import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { setLanguage, t as translate, availableLanguages } from '../i18n';
import { backupService } from '../services/backupService';
import type { Language } from '../types';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
  availableLanguages: typeof availableLanguages;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('shformacions_lang');
    if (saved === 'ca' || saved === 'es' || saved === 'en') return saved;
    return 'ca'; // Català per defecte sempre
  });

  useEffect(() => {
    setLanguage(language);
    localStorage.setItem('shformacions_lang', language);
    document.documentElement.lang = language;
    // persist to DB settings (non-blocking)
    backupService.setSetting('app_language', language).catch(() => {});
  }, [language]);

  // Init i18n on mount
  useEffect(() => {
    setLanguage(language);
  }, []);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLang(lang);
    setLanguage(lang);
  }, []);

  const tFn = useCallback(
    (key: string, replacements?: Record<string, string>) => {
      return translate(key, replacements);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        t: tFn,
        availableLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useTranslation(): Pick<LanguageContextValue, 't'> {
  const { t } = useLanguage();
  return { t };
}
