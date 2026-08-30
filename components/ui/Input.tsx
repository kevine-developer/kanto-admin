'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full py-3 px-4 rounded-xl kanto-input text-base placeholder-[var(--text-subtle)] ${
            leftIcon ? 'pl-12' : ''
          } ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <div className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</div>
      ) : helperText ? (
        <div className="text-xs text-[var(--text-subtle)]">{helperText}</div>
      ) : null}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}

      <textarea
        id={inputId}
        rows={rows}
        className={`w-full p-4 rounded-xl kanto-input text-base placeholder-[var(--text-subtle)] leading-relaxed ${
          error ? 'border-red-500 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />

      {error ? (
        <div className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</div>
      ) : helperText ? (
        <div className="text-xs text-[var(--text-subtle)]">{helperText}</div>
      ) : null}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export function Select({
  label,
  error,
  helperText,
  options,
  children,
  className = '',
  id,
  ...props
}: SelectProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}

      <select
        id={inputId}
        className={`w-full p-3.5 rounded-xl kanto-input text-base font-medium text-[var(--foreground)] ${
          error ? 'border-red-500 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>

      {error ? (
        <div className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</div>
      ) : helperText ? (
        <div className="text-xs text-[var(--text-subtle)]">{helperText}</div>
      ) : null}
    </div>
  );
}
