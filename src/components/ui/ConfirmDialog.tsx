import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTranslation } from '../../context/LanguageContext';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel ?? t('common.no_cancel')}
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel ?? t('common.yes_delete')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div
          className={[
            'w-14 h-14 rounded-full flex items-center justify-center',
            variant === 'danger'
              ? 'bg-red-500/10 text-red-400'
              : 'bg-yellow-500/10 text-yellow-400',
          ].join(' ')}
        >
          <AlertTriangle size={28} />
        </div>
        {title && (
          <h3 className="text-lg font-semibold text-white font-display">
            {title}
          </h3>
        )}
        <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
