import React, { useRef, type KeyboardEvent } from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  label?: string;
  disabled?: boolean;
}

export function PinInput({
  value,
  onChange,
  length = 4,
  error = false,
  label,
  disabled = false,
}: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.padEnd(length, '').split('').slice(0, length);

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const newDigits = [...digits];
    newDigits[index] = char;
    const newValue = newDigits.join('').replace(/\s/g, '');
    onChange(newValue.slice(0, length));
    if (char && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join('').replace(/\s/g, ''));
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join('').replace(/\s/g, ''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="flex gap-3 justify-center">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] || ''}
            disabled={disabled}
            onPaste={handlePaste}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={[
              'w-14 h-14 text-center text-2xl font-bold rounded-2xl border bg-[#111] text-white',
              'transition-all duration-150 outline-none caret-transparent',
              'focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 focus:scale-105',
              error
                ? 'border-red-500/60'
                : digits[i]
                ? 'border-accent-500/50 bg-accent-500/5'
                : 'border-[#2a2a2a]',
              disabled ? 'opacity-50 cursor-not-allowed' : '',
            ].filter(Boolean).join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
