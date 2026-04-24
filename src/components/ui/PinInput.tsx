import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Mantingut per compatibilitat retroactiva (no s'utilitza). */
  length?: number;
  error?: boolean;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Camp de contrasenya alfanumèrica (mínim 8 caràcters recomanat).
 * Substitueix l'antic PinInput de 6 caselles per un input únic amb show/hide.
 */
export function PinInput({
  value,
  onChange,
  error = false,
  label,
  disabled = false,
  placeholder = '••••••••',
  autoFocus = false,
}: PinInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          autoComplete="current-password"
          onChange={(e) => onChange(e.target.value)}
          maxLength={64}
          className={[
            'w-full h-12 px-4 pr-12 text-base rounded-xl border bg-[#111] text-white',
            'transition-all duration-150 outline-none',
            'focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30',
            error
              ? 'border-red-500/60'
              : value
              ? 'border-accent-500/50 bg-accent-500/5'
              : 'border-[#2a2a2a]',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].filter(Boolean).join(' ')}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
          aria-label={show ? 'Amagar contrasenya' : 'Mostrar contrasenya'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
