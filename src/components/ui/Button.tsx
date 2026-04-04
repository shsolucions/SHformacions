import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

// Variants — amb suport a mode clar (text llegible en ambdós modes)
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white border border-accent-500/60',
  secondary:
    'border hover:opacity-90 active:opacity-80',
  ghost:
    'bg-transparent hover:bg-black/5 active:bg-black/10 border border-transparent',
  danger:
    'bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 text-red-500 border border-red-500/30',
  outline:
    'bg-transparent hover:bg-accent-500/10 active:bg-accent-500/20 text-accent-500 border border-accent-500/50',
};

// Mides — totes vàlides a Tailwind, optimitzades per mòbil
const sizeClasses: Record<Size, string> = {
  xs: 'h-7  px-2.5 text-xs  gap-1   rounded-lg',
  sm: 'h-9  px-3   text-xs  gap-1.5 rounded-xl',
  md: 'h-10 px-4   text-sm  gap-2   rounded-xl',
  lg: 'h-11 px-5   text-sm  gap-2   rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  disabled,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // La variant secondary i ghost usa variables CSS per adaptar-se al tema
  const inlineStyle: React.CSSProperties =
    variant === 'secondary'
      ? { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-strong)', color: 'var(--text-primary)', ...(style ?? {}) }
      : variant === 'ghost'
      ? { color: 'var(--text-secondary)', ...(style ?? {}) }
      : (style ?? {});

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={inlineStyle ?? {}}
      className={[
        'inline-flex items-center justify-center font-sans font-semibold transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-1',
        'min-h-[44px]',   // mínim tàctil iOS (44px)
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
        className,
      ].filter(Boolean).join(' ')}
    >
      {loading ? (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-r-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0 flex items-center">{icon}</span>
      )}
      {children && (
        <span className="truncate leading-none">{children}</span>
      )}
      {iconRight && !loading && (
        <span className="flex-shrink-0 flex items-center">{iconRight}</span>
      )}
    </button>
  );
}
