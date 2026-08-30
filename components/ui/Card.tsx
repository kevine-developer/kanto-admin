'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isHoverable?: boolean;
}

export function Card({ children, className = '', isHoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`kanto-card rounded-lg ${
        isHoverable ? 'hover:border-[var(--accent-border)] transition-colors' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-3.5 py-2.5 border-b border-[var(--card-border)] flex items-center justify-between gap-3 ${className}`}>
      <div>
        <div className="text-xs font-semibold text-[var(--foreground)]">{title}</div>
        {subtitle && <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{subtitle}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-3.5 text-xs ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-3.5 py-2 border-t border-[var(--card-border)] bg-[var(--background)] rounded-b-lg text-xs ${className}`}>
      {children}
    </div>
  );
}
