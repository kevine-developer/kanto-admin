'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Flag,
  FileText,
  Copy,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

export interface AdminAlertItem {
  id: string;
  type: 'REPORT_PENDING' | 'PENDING_CONTRIBUTION' | 'FLAGGED_CONTENT' | 'DUPLICATE_DISPUTE' | 'SYSTEM_ALERT';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  createdAt: string | Date;
  resourceId?: string;
  targetRoute: string;
  status: 'open' | 'in_review' | 'resolved';
}

interface AdminAlertsResponse {
  alerts: AdminAlertItem[];
  pendingReportsCount: number;
  pendingContributionsCount: number;
  flaggedContributionsCount: number;
  totalUnresolved: number;
}

export function AdminAlertsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<AdminAlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'reports' | 'contributions'>('all');
  const [dismissedLocally, _setDismissedLocally] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadAlerts = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetchApi<AdminAlertsResponse>('/admin/notifications/alerts');
      if (res && Array.isArray(res.alerts)) {
        setData(res);
      }
    } catch (err) {
      // Ignorer silencieusement si l'admin n'est pas encore connecté
      console.warn('⚠️ [AdminAlerts] Erreur chargement alertes :', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
    const interval = setInterval(() => {
      void loadAlerts(true);
    }, 45_000); // Rafraîchissement périodique toutes les 45s

    return () => clearInterval(interval);
  }, [loadAlerts]);

  // Fermeture du dropdown lors d'un clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const rawAlerts = data?.alerts || [];
  const totalCount = data?.totalUnresolved || 0;
  const criticalCount = data?.flaggedContributionsCount || 0;

  const filteredAlerts = rawAlerts.filter((item) => {
    if (filter === 'critical') return item.priority === 'critical';
    if (filter === 'reports') return item.type === 'REPORT_PENDING';
    if (filter === 'contributions') return item.type === 'PENDING_CONTRIBUTION' || item.type === 'FLAGGED_CONTENT';
    return true;
  });

  const getAlertIcon = (type: string, priority: string) => {
    if (priority === 'critical' || type === 'FLAGGED_CONTENT') {
      return <ShieldAlert size={15} className="text-red-500 shrink-0" />;
    }
    if (type === 'REPORT_PENDING') {
      return <Flag size={15} className="text-amber-500 shrink-0" />;
    }
    if (type === 'DUPLICATE_DISPUTE') {
      return <Copy size={15} className="text-purple-500 shrink-0" />;
    }
    return <FileText size={15} className="text-blue-500 shrink-0" />;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
            Critique
          </span>
        );
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Urgente
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
            À traiter
          </span>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Cloche avec badge de comptage */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) void loadAlerts(true);
        }}
        title="Centre d'alertes & modération"
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-[var(--card-hover)] text-[var(--text-subtle)] hover:text-[var(--foreground)] relative"
      >
        <Bell size={16} />
        {totalCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-sm ${
              criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-[var(--accent)]'
            }`}
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Panneau déroulant */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Header du panneau */}
          <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between bg-[var(--card-hover)]/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-[var(--foreground)]">
                Alertes & Modération
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent)]/10 text-[var(--accent)]">
                {totalCount} en attente
              </span>
            </div>
            <button
              onClick={() => void loadAlerts()}
              title="Rafraîchir les alertes"
              disabled={isLoading}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Filtres par catégorie */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--card-border)] bg-[var(--background)]/50 text-[11px] overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-[var(--card-hover)] text-[var(--foreground)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Toutes ({totalCount})
            </button>
            {criticalCount > 0 && (
              <button
                onClick={() => setFilter('critical')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filter === 'critical'
                    ? 'bg-red-500/10 text-red-500 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-red-500'
                }`}
              >
                Critiques ({criticalCount})
              </button>
            )}
            <button
              onClick={() => setFilter('reports')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'reports'
                  ? 'bg-amber-500/10 text-amber-500 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-amber-500'
              }`}
            >
              Signalements ({data?.pendingReportsCount || 0})
            </button>
            <button
              onClick={() => setFilter('contributions')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                filter === 'contributions'
                  ? 'bg-blue-500/10 text-blue-500 font-semibold'
                  : 'text-[var(--text-muted)] hover:text-blue-500'
              }`}
            >
              Propositions ({data?.pendingContributionsCount || 0})
            </button>
          </div>

          {/* Liste des alertes */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--card-border)]">
            {filteredAlerts.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <CheckCircle size={28} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Aucune alerte en attente
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Toutes les propositions et signalements sont traités.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isDismissed = dismissedLocally.has(alert.id);
                const dateStr = new Date(alert.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={alert.id}
                    className={`p-3 transition-colors hover:bg-[var(--card-hover)] flex flex-col gap-1.5 ${
                      isDismissed ? 'opacity-60 bg-[var(--background)]/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getAlertIcon(alert.type, alert.priority)}
                        <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {alert.title}
                        </span>
                      </div>
                      {getPriorityBadge(alert.priority)}
                    </div>

                    <p className="text-[11px] text-[var(--text-subtle)] line-clamp-2 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-[var(--text-muted)]">
                      <span>{dateStr}</span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={alert.targetRoute}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-1 font-semibold text-[var(--accent)] hover:underline"
                        >
                          Examiner
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer du panneau */}
          <div className="p-2 border-t border-[var(--card-border)] bg-[var(--card-hover)]/20 text-center">
            <Link
              href="/contributions"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Accéder à l&apos;espace de modération complet &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
