'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  backHref?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
  };
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  backHref,
  badge,
  actions,
  primaryAction,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
      <div className="flex items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="p-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors mt-0.5"
            title="Retour"
          >
            <ArrowLeft size={16} />
          </Link>
        )}

        {Icon && (
          <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shrink-0">
            <Icon size={20} />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {(actions || primaryAction) && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {primaryAction &&
            (primaryAction.href ? (
              <Link href={primaryAction.href}>
                <Button size="sm" leftIcon={primaryAction.icon}>
                  {primaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={primaryAction.onClick}
                leftIcon={primaryAction.icon}
              >
                {primaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
