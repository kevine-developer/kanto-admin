'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/lib/hooks/useToast';
import { systemService } from '@/services/system.service';
import { AdminAuditLog } from '@/types';
import {
  History,
  ShieldAlert,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  Shield,
  Key,
  Trash2,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

const ACTION_LABELS: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  USER_BAN: {
    label: 'Suspension Compte',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: UserX,
  },
  USER_UNBAN: {
    label: 'Réactivation Compte',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: UserCheck,
  },
  USER_ROLE_CHANGE: {
    label: 'Changement Rôle',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Shield,
  },
  USER_DELETE: {
    label: 'Suppression Compte',
    color: 'bg-red-600/15 text-red-500 border-red-600/30',
    icon: Trash2,
  },
  USER_PASSWORD_RESET: {
    label: 'Reset Mot de Passe',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Key,
  },
  CONTENT_MODERATION: {
    label: 'Action Modération',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: ShieldAlert,
  },
};

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });

  const loadLogs = useCallback(
    async (targetPage = page) => {
      try {
        setIsLoading(true);
        const res = await systemService.getAuditLogs({
          page: targetPage,
          limit,
          action: selectedAction !== 'ALL' ? selectedAction : undefined,
        });
        setLogs(res.data || []);
        if (res.meta) {
          setPagination(res.meta);
        } else {
          setPagination({ total: res.data?.length || 0, page: targetPage, limit, totalPages: 1 });
        }
      } catch (err: unknown) {
        console.error('Erreur chargement logs audit:', err);
        toast.error('Impossible de charger les journaux de traçabilité.');
      } finally {
        setIsLoading(false);
      }
    },
    [page, limit, selectedAction, toast]
  );

  useEffect(() => {
    loadLogs(page);
  }, [loadLogs, page]);

  // Filtrage local supplémentaire sur recherche texte (admin ou détails)
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const adminMatch =
      (log.userName && log.userName.toLowerCase().includes(q)) ||
      log.userId.toLowerCase().includes(q);
    const targetMatch =
      log.targetId.toLowerCase().includes(q) ||
      (log.targetLabel && log.targetLabel.toLowerCase().includes(q));
    const reasonMatch = log.reason && log.reason.toLowerCase().includes(q);
    const detailsMatch = log.details
      ? JSON.stringify(log.details).toLowerCase().includes(q)
      : false;
    return Boolean(adminMatch || targetMatch || reasonMatch || detailsMatch);
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Journal d'Audit & Traçabilité"
          description="Registre des actions administratives sensibles conformément aux règles de sécurité et de conformité."
          badge={
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--card-border)]/50 text-[var(--accent)] border border-[var(--card-border)]">
              {pagination.total} événements
            </span>
          }
          actions={
            <button
              onClick={() => loadLogs(page)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--foreground)] hover:bg-[var(--card-border)]/30 transition disabled:opacity-50"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          }
        />

        {/* Barre de filtres et recherche */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <div className="relative w-full sm:w-80">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Filtrer par admin, ID cible, motif..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={13} className="text-[var(--text-muted)] shrink-0" />
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] focus:outline-hidden"
            >
              <option value="ALL">Toutes les actions</option>
              <option value="USER_BAN">Suspension de compte</option>
              <option value="USER_UNBAN">Réactivation de compte</option>
              <option value="USER_ROLE_CHANGE">Changement de rôle</option>
              <option value="USER_DELETE">Suppression de compte</option>
              <option value="USER_PASSWORD_RESET">Réinitialisation mot de passe</option>
              <option value="CONTENT_MODERATION">Modération de contenu</option>
            </select>
          </div>
        </div>

        {/* Tableau des logs */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--background)] border-b border-[var(--card-border)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Type d&apos;action</th>
                  <th className="py-3 px-4">Administrateur</th>
                  <th className="py-3 px-4">Cible / Ressource</th>
                  <th className="py-3 px-4">Motif & Justification</th>
                  <th className="py-3 px-4">Détails techniques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] text-[var(--foreground)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                      <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-[var(--accent)]" />
                      Chargement du journal d&apos;audit...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                      <Info size={20} className="mx-auto mb-2 opacity-50" />
                      Aucune action enregistrée pour ces critères.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const actionConfig = ACTION_LABELS[log.action] || {
                      label: log.action,
                      color: 'bg-[var(--card-border)]/40 text-[var(--text-muted)] border-[var(--card-border)]',
                      icon: History,
                    };
                    const ActionIcon = actionConfig.icon;

                    return (
                      <tr key={log.id} className="hover:bg-[var(--background)]/50 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-[11px] text-[var(--text-muted)] font-mono">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="opacity-60" />
                            {new Date(log.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${actionConfig.color}`}
                          >
                            <ActionIcon size={11} />
                            {actionConfig.label}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center font-bold text-[10px] text-[var(--accent)]">
                              {log.userName?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs">{log.userName || 'Admin'}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                #{log.userId.slice(0, 10)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono text-[11px] text-[var(--accent)] font-semibold">
                              {log.targetType}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {log.targetLabel ? log.targetLabel : `#${log.targetId.slice(0, 12)}`}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          {log.reason ? (
                            <span className="text-amber-400 font-medium text-xs leading-snug">
                              {log.reason}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)] italic text-[11px]">
                              Aucun motif spécifié
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-sm">
                          {log.details ? (
                            <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--background)] p-1.5 rounded-md border border-[var(--card-border)] max-h-16 overflow-y-auto">
                              {JSON.stringify(log.details, null, 1)}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {log.ipAddress ? `IP: ${log.ipAddress}` : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 bg-[var(--background)] border-t border-[var(--card-border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} entrées au total)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="p-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-border)]/40 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || isLoading}
                className="p-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-border)]/40 disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
