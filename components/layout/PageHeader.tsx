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
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6">
      <div className="flex items-start gap-3.5">
        {backHref && (
          <Link
            href={backHref}
            className="p-1.5 rounded-lg transition-colors mt-1"
            style={{
              border: '1px solid var(--card-border)',
              color: 'var(--text-muted)',
              background: 'var(--card)',
            }}
            title="Retour"
          >
            <ArrowLeft size={15} />
          </Link>
        )}

        {Icon && (
          <div
            className="p-2.5 rounded-xl shrink-0 mt-0.5"
            style={{
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              color: 'var(--accent)',
            }}
          >
            <Icon size={18} />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              className="text-xl font-bold tracking-tight font-heritage leading-tight"
              style={{ color: 'var(--foreground)' }}
            >
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p
              className="text-xs mt-1 max-w-2xl leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
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
              <Button size="sm" onClick={primaryAction.onClick} leftIcon={primaryAction.icon}>
                {primaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
}
