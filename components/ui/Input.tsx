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
    <div className="space-y-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-subtle)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full py-2 px-3 rounded-lg kanto-input text-xs placeholder-[var(--text-subtle)] ${
            leftIcon ? 'pl-9' : ''
          } ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <div className="text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</div>
      ) : helperText ? (
        <div className="text-[10px] text-[var(--text-subtle)]">{helperText}</div>
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
    <div className="space-y-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-subtle)]"
        >
          {label}
        </label>
      )}

      <textarea
        id={inputId}
        rows={rows}
        className={`w-full p-2.5 rounded-lg kanto-input text-xs placeholder-[var(--text-subtle)] leading-relaxed ${
          error ? 'border-red-500 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />

      {error ? (
        <div className="text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</div>
      ) : helperText ? (
        <div className="text-[10px] text-[var(--text-subtle)]">{helperText}</div>
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
    <div className="space-y-1 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-medium uppercase tracking-wider text-[var(--text-subtle)]"
        >
          {label}
        </label>
      )}

      <select
        id={inputId}
        className={`w-full py-2 px-2.5 rounded-lg kanto-input text-xs font-medium text-[var(--foreground)] ${
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
        <div className="text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</div>
      ) : helperText ? (
        <div className="text-[10px] text-[var(--text-subtle)]">{helperText}</div>
      ) : null}
    </div>
  );
}
