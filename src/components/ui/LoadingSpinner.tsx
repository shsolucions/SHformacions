import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-11 h-11 border-[3px]',
};

export function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={[sizeMap[size], 'rounded-full border-t-accent-500 animate-spin'].join(' ')}
      style={{ borderColor: 'var(--border-strong)', borderTopColor: '#0ea5e9' }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-sm font-display" style={{ color: 'var(--text-muted)' }}>SHformacions</p>
        </div>
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{spinner}</div>;
}
