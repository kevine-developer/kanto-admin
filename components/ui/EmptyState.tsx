'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({
  title = 'Aucune donnée disponible',
  description = "Il n'y a aucun enregistrement à afficher pour le moment.",
  icon: Icon = Inbox,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`py-16 px-4 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)]/50 flex flex-col items-center justify-center text-center max-w-lg mx-auto ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-[var(--card-border)]/40 text-[var(--text-muted)] mb-3">
        <Icon size={28} />
      </div>

      <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
        {title}
      </h3>

      <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="mt-4">
          <Button size="sm" onClick={action.onClick} leftIcon={action.icon}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
