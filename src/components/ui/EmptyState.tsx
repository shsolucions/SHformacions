import React, { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode; title: string; description?: string; action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-faint)' }}>
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        {description && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
