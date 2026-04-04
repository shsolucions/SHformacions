import React, { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string; hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {label}{props.required && <span className="text-accent-400 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref} id={textareaId}
          className={[
            'w-full rounded-xl border px-4 py-3 resize-none outline-none transition-all duration-150',
            'focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30',
            error ? 'border-red-500/60' : '',
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
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
