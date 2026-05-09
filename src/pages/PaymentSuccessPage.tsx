import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Home, MessageCircle } from 'lucide-react';

export function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center"
      style={{ backgroundColor: 'var(--bg-base)' }}>

      <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mb-6">
        <CheckCircle size={44} className="text-green-500" />
      </div>

      <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
        Pagament completat!
      </h1>
      <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
        Hem rebut el teu pagament correctament.
      </p>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        En Saïd es posarà en contacte amb tu en menys de 24h per confirmar les dates.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <a
          href={`https://wa.me/34660137163?text=${encodeURIComponent('Hola! Acabo de fer el pagament del curs. Podeu confirmar-me les dates disponibles? Gràcies!')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all active:scale-95"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle size={17} />
          Confirmar per WhatsApp
        </a>

        <Link to="/"
          className="h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold border transition-all active:scale-95"
          style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
        >
          <Home size={16} />
          Tornar a l'inici
        </Link>
      </div>
    </div>
  );
}
