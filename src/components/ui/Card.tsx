import React, { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function Card({ children, className = '', onClick, hoverable = false, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-2xl border transition-colors duration-200',
        paddingMap[padding],
        hoverable || onClick ? 'cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-base)',
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold font-display truncate" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          {subtitle && <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
