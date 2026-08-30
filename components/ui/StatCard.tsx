'use client';

import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'info';
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  badge,
  trend,
  className = '',
}: StatCardProps) {
  const iconVariants = {
    default: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div
      className={`p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col justify-between shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs text-[var(--text-muted)] font-medium block">
            {title}
          </span>
          <div className="text-xl font-bold text-[var(--foreground)] tracking-tight mt-1">
            {value}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border shrink-0 ${iconVariants[variant]}`}>
          <Icon size={18} />
        </div>
      </div>

      {(subtitle || badge || trend) && (
        <div className="mt-3 pt-2.5 border-t border-[var(--card-border)] flex items-center justify-between gap-2 text-xs">
          {subtitle && (
            <span className="text-[var(--text-muted)] truncate">{subtitle}</span>
          )}
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              {badge}
            </span>
          )}
          {trend && (
            <span
              className={`text-[10px] font-bold ${
                trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
