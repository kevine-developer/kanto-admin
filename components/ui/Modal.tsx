'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  align?: 'top' | 'center';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '2xl',
  align = 'top',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  const alignWrapperStyles =
    align === 'top'
      ? 'overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12'
      : 'flex items-center justify-center p-4';

  const cardHeightStyles =
    align === 'top'
      ? 'max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)]'
      : 'max-h-[90vh]';

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-xs ${alignWrapperStyles}`}>
      <div
        className={`kanto-card rounded-xl border border-[var(--card-border)] shadow-xl w-full ${maxWidthStyles[maxWidth]} ${cardHeightStyles} flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150`}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-subtle)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-4 py-2.5 border-t border-[var(--card-border)] bg-[var(--background)] flex items-center justify-end gap-2 text-xs">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
