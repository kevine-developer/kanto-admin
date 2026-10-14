'use client';

import React, { useId } from 'react';

export interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  className = '',
  children,
}: FieldProps) {
  const generatedId = useId();
  const cleanGeneratedId = `field-${generatedId.replace(/:/g, '')}`;
  const fieldId = htmlFor || cleanGeneratedId;

  // Si l'enfant est un élément React unique (input, textarea, select...), on lui injecte id et name s'il n'en a pas
  const enhancedChildren = React.useMemo(() => {
    if (React.isValidElement(children)) {
      const childProps = children.props as Record<string, unknown>;
      const childId = (childProps.id as string) || fieldId;
      const childName = (childProps.name as string) || childId;
      const childAriaLabel = (childProps['aria-label'] as string) || label;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return React.cloneElement(children as React.ReactElement<any>, {
        id: childId,
        name: childName,
        'aria-label': childAriaLabel,
        'aria-required': required ? true : undefined,
        'aria-invalid': error ? true : undefined,
      });
    }
    return children;
  }, [children, fieldId, label, required, error]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={fieldId}
          className="block text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-[10px] text-[var(--text-muted)] italic">{hint}</span>}
      </div>

      {enhancedChildren}

      {error && (
        <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 animate-in fade-in-50">
          {error}
        </div>
      )}
    </div>
  );
}

