import ca from './ca';
import es from './es';
import en from './en';
import fr from './fr';
import de from './de';
import it from './it';
import pt from './pt';
import nl from './nl';
import ro from './ro';
import ar from './ar';
import type { Language } from '../types';

const translations: Record<Language, Record<string, string>> = {
  ca, es, en, fr, de, it, pt, nl, ro, ar,
};

let currentLanguage: Language = 'ca';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string, replacements?: Record<string, string>): string {
  const dict = translations[currentLanguage] || translations['ca'];
  let value = dict[key] ?? translations['ca'][key] ?? key;
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }
  return value;
}

export function useTranslation() {
  return { t };
}

/**
 * Llista d'idiomes disponibles amb metadades.
 * `rtl: true` indica que l'idioma es llegeix de dreta a esquerra
 * (actualment només l'àrab).
 */
export const availableLanguages: {
  code: Language;
  label: string;
  flag: string;
  rtl?: boolean;
}[] = [
  { code: 'ca', label: 'Català',     flag: '🏴' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'ro', label: 'Română',     flag: '🇷🇴' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦', rtl: true },
];

/** Helper: comprova si un idioma és RTL (dreta-a-esquerra). */
export function isRTL(lang: Language): boolean {
  return availableLanguages.find((l) => l.code === lang)?.rtl === true;
}

/**
 * Helper: retorna el `dir` HTML apropiat per l'idioma.
 * Útil per aplicar a <html dir={...}> via LanguageContext.
 */
export function getDirection(lang: Language): 'ltr' | 'rtl' {
  return isRTL(lang) ? 'rtl' : 'ltr';
}

export default translations;
