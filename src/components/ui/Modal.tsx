import React, { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={['relative w-full shadow-2xl animate-slide-up rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col border', sizeMap[size]].join(' ')}
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b flex-shrink-0"
            style={{ borderColor: 'var(--border-base)' }}>
            <h2 className="text-lg font-semibold font-display" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-black/10"
              style={{ color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 pb-5 pt-3 border-t flex-shrink-0 flex gap-3 justify-end"
            style={{ borderColor: 'var(--border-base)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
