'use client';

import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'info';
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

const ACCENT_COLORS = {
  default: 'var(--accent)',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
};

/**
 * Carte de métrique et statistique du tableau de bord d'administration.
 * Présente une valeur héroïque avec icône, tendance et badge contextuel.
 * @param props - Propriétés de la carte de statistique
 */
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
  const accentColor = ACCENT_COLORS[variant];

  return (
    <div
      className={`group relative p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:translate-y-[-1px] ${className}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
      }}
    >
      {/* Accentuation supérieure discrète */}
      <div
        className="absolute top-0 left-5 right-5 h-[2px] rounded-full opacity-60 transition-opacity group-hover:opacity-100"
        style={{ background: accentColor }}
      />

      {/* Header : Titre + Icône discrète (sans cercle coloré IA) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <span
          className="text-xs font-medium tracking-wider uppercase font-mono"
          style={{ color: 'var(--text-muted)' }}
        >
          {title}
        </span>
        {Icon && (
          <Icon
            size={16}
            className="shrink-0 transition-colors opacity-40 group-hover:opacity-80"
            style={{ color: accentColor }}
          />
        )}
      </div>

      {/* Valeur héroïque */}
      <div className="my-2">
        <div
          className="text-3xl font-bold tracking-tight font-heritage leading-none"
          style={{ color: 'var(--foreground)' }}
        >
          {value}
        </div>
      </div>

      {/* Footer : Sous-titre & Badge */}
      <div className="flex items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: 'var(--card-border)' }}>
        {subtitle && (
          <span className="text-[11px] truncate leading-tight" style={{ color: 'var(--text-subtle)' }}>
            {subtitle}
          </span>
        )}
        {badge && (
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--card-border) 60%, transparent)',
              color: 'var(--foreground)',
              border: '1px solid var(--card-border)',
            }}
          >
            {badge}
          </span>
        )}
        {trend && (
          <span
            className="text-[10px] font-bold shrink-0 font-mono"
            style={{ color: trend.isPositive ? '#22c55e' : '#ef4444' }}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

