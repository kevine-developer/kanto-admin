'use client';

import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const iconMap = {
    danger: <Trash2 size={22} className="text-red-500" />,
    warning: <AlertTriangle size={22} className="text-amber-500" />,
    primary: <HelpCircle size={22} className="text-[var(--accent)]" />,
  };

  const bgMap = {
    danger: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    primary: 'bg-[var(--accent)]/10 border-[var(--accent)]/20',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      maxWidth="md"
      title={title}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3 py-1">
        <div className={`p-2.5 rounded-xl border shrink-0 ${bgMap[variant]}`}>
          {iconMap[variant]}
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1">
          {description}
        </p>
      </div>
    </Modal>
  );
}
