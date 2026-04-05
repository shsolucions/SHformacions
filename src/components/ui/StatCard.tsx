import React, { type ReactNode } from 'react';

interface StatCardProps {
  label: string; value: string | number; icon: ReactNode; color?: string; subValue?: string;
}

export function StatCard({ label, value, icon, color = 'text-accent-400', subValue }: StatCardProps) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 border transition-colors"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-base)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className={['w-9 h-9 rounded-xl flex items-center justify-center', color].join(' ')}
          style={{ backgroundColor: 'var(--bg-muted)' }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {subValue && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subValue}</p>}
      </div>
    </div>
  );
}
