import React, { type SelectHTMLAttributes, type ReactNode } from 'react';

interface SelectOption { value: string | number; label: string; }
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; hint?: string;
  options: SelectOption[]; placeholder?: string; icon?: ReactNode;
}

export function Select({ label, error, hint, options, placeholder, icon, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}{props.required && <span className="text-accent-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: 'var(--text-muted)' }}>{icon}</span>}
        <select
          id={selectId}
          className={[
            'w-full h-11 rounded-xl border outline-none appearance-none cursor-pointer pr-10 transition-all duration-150',
            'focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30',
            error ? 'border-red-500/60' : '',
            icon ? 'pl-10' : 'pl-4',
            props.disabled ? 'opacity-50 cursor-not-allowed' : '',
            className,
          ].filter(Boolean).join(' ')}
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderColor: error ? undefined : 'var(--border-input)',
          }}
          {...props}
        >
          {placeholder && <option value="" style={{ backgroundColor: 'var(--bg-card)' }}>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}
