'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 h-7',
    md: 'px-4 py-2 text-sm gap-2 h-9',
    lg: 'px-5 py-2.5 text-sm gap-2.5 h-10',
  };

  const variantStyles = {
    primary:
      'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-[0_1px_3px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[0_4px_10px_color-mix(in_srgb,var(--accent)_25%,transparent)] hover:-translate-y-px',
    secondary:
      'bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] border border-[var(--input-border)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-[0_1px_3px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_10px_rgba(239,68,68,0.25)] hover:-translate-y-px',
    outline:
      'bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] border border-[var(--card-border)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]',
    ghost:
      'bg-transparent hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] shadow-none',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={size === 'sm' ? 13 : size === 'lg' ? 16 : 14} className="animate-spin" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
