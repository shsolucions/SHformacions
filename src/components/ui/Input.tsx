import React, { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  onIconRightClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, onIconRightClick, className = '', id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}{props.required && <span className="text-accent-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>{icon}</span>}
          <input
            ref={ref} id={inputId}
            className={[
              'w-full h-11 rounded-xl border outline-none transition-all duration-150',
              'focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30',
              error ? 'border-red-500/60' : '',
              icon ? 'pl-10' : 'pl-4',
              iconRight ? 'pr-10' : 'pr-4',
              props.disabled ? 'opacity-50 cursor-not-allowed' : '',
              className,
            ].filter(Boolean).join(' ')}
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderColor: error ? undefined : 'var(--border-input)',
            }}
            {...props}
          />
          {iconRight && (
            <button type="button" onClick={onIconRightClick} tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              {iconRight}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
