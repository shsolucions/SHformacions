import ca from './ca';
import es from './es';
import en from './en';
import type { Language } from '../types';

const translations: Record<Language, Record<string, string>> = { ca, es, en };

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

export const availableLanguages: { code: Language; label: string; flag: string }[] = [
  { code: 'ca', label: 'Català', flag: '🏴' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default translations;
