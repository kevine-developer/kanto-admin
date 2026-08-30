'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'accent' | 'neutral' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5 font-bold',
  };

  const variantStyles = {
    accent:
      'bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]',
    neutral:
      'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]',
    warning:
      'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40',
    danger:
      'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40',
    info:
      'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg uppercase tracking-wider ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}
