'use client';

import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Chargement des données en cours...',
  className = '',
}: LoadingStateProps) {
  return (
    <div
      className={`py-16 flex flex-col items-center justify-center gap-3 text-center ${className}`}
    >
      <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
      <p className="text-xs text-[var(--text-muted)] font-medium">{message}</p>
    </div>
  );
}
