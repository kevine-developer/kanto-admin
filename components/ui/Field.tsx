'use client';

import React from 'react';

export interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  required,
  error,
  hint,
  className = '',
  children,
}: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[10px] text-[var(--text-muted)] italic">{hint}</span>}
      </div>

      {children}

      {error && (
        <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 animate-in fade-in-50">
          {error}
        </div>
      )}
    </div>
  );
}
