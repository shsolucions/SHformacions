import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { Toast } from '../../types';

const icons = {
  success: <CheckCircle2 size={16} />,
  error:   <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info size={16} />,
};

const colorMap = {
  success: 'border-green-500/40 text-green-500',
  error:   'border-red-500/40 text-red-500',
  warning: 'border-yellow-500/40 text-yellow-500',
  info:    'border-accent-500/40 text-accent-500',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(timer);
  }, [toast, removeToast]);

  return (
    <div
      className={['flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-up', colorMap[toast.type]].join(' ')}
      style={{
        backgroundColor: 'var(--bg-card)',
        minWidth: '260px',
        maxWidth: '340px',
      }}
    >
      <span className="flex-shrink-0">{icons[toast.type]}</span>
      <p className="flex-1 text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
