import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Icona ⟳ al header — visible per a tots els usuaris.
 * - Estat normal: difuminada (gris molt suau)
 * - Quan hi ha nova versió de l'app: pulsa amb blau accent
 * - Al clicar quan hi ha versió nova: actualitza l'app i recarrega
 * - Al clicar quan no hi ha versió nova: comprova manualment
 */
export function AppUpdateIcon() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // Comprova actualitzacions cada 30 minuts en background
      if (r) {
        setInterval(() => r.update(), 30 * 60 * 1000);
      }
    },
  });

  const [updating, setUpdating] = useState(false);

  const handleClick = async () => {
    if (needRefresh) {
      // Hi ha versió nova → actualitzar
      setUpdating(true);
      try {
        await updateServiceWorker(true);
      } catch {
        setUpdating(false);
        setNeedRefresh(false);
      }
    }
    // Si no hi ha versió nova, no fem res (el badge ja és discret)
  };

  return (
    <button
      onClick={handleClick}
      disabled={updating}
      title={needRefresh ? 'Nova versió disponible — toca per actualitzar' : 'App actualitzada'}
      aria-label={needRefresh ? 'Nova versió disponible' : 'App actualitzada'}
      className="relative p-1.5 rounded-lg transition hover:bg-[var(--bg-card-hover,#1a1a1a)]"
    >
      <RefreshCw
        size={17}
        className={[
          'transition-all duration-300',
          updating ? 'animate-spin text-accent-400' : '',
          !updating && needRefresh ? 'text-accent-400 animate-pulse' : '',
          !updating && !needRefresh ? 'text-gray-600 opacity-50' : '',
        ].filter(Boolean).join(' ')}
      />
      {needRefresh && !updating && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
      )}
    </button>
  );
}
