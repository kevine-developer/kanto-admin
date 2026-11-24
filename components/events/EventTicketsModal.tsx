'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Ticket,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  ShieldAlert,
  History,
  QrCode,
  User,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import {
  eventsAdminService,
  EventAdminItem,
} from '@/services/events.service';
import { useToast } from '@/lib/hooks/useToast';

interface EventTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventAdminItem;
}

type TicketFilterTab = 'ALL' | 'VALID' | 'USED' | 'CANCELLED' | 'REVOKED';

export function EventTicketsModal({
  isOpen,
  onClose,
  event,
}: EventTicketsModalProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TicketFilterTab>('ALL');
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modale d'annulation de billet
  const [cancellingTicket, setCancellingTicket] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Modale de révocation de billet
  const [revokingTicket, setRevokingTicket] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Modale d'historique de scan
  const [historyTicket, setHistoryTicket] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Onglet principal : 'TICKETS' (Billetterie) ou 'STAFF' (Agents de contrôle)
  const [viewMode, setViewMode] = useState<'TICKETS' | 'STAFF'>('TICKETS');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [isAddingAgent, setIsAddingAgent] = useState(false);

  // Debounce sur la recherche
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStats = useCallback(async () => {
    try {
      const res = await eventsAdminService.getTicketingStats(event.id);
      setStats(res);
    } catch {}
  }, [event.id]);

  const loadTickets = useCallback(
    async (currentPage = 1, currentTab = activeTab, term = debouncedSearch) => {
      setIsLoading(true);
      try {
        const res = await eventsAdminService.getTickets(event.id, {
          page: currentPage,
          limit: 15,
          status: currentTab,
          search: term.trim() || undefined,
        });
        setTickets(res.data || []);
        setTotalCount(res.pagination?.total ?? 0);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setPage(currentPage);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Impossible de charger la liste des billets.';
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [event.id, activeTab, debouncedSearch, toast]
  );

  const loadStaff = useCallback(async () => {
    setIsLoadingStaff(true);
    try {
      const res = await eventsAdminService.getEventStaff(event.id);
      setStaffList(res || []);
    } catch {
      // Ignorer silencieusement si l'endpoint n'est pas encore disponible
    } finally {
      setIsLoadingStaff(false);
    }
  }, [event.id]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInvite = newAgentEmail.trim().toLowerCase();
    if (!emailToInvite) {
      toast.error("Veuillez renseigner l'adresse e-mail ou l'identifiant de l'agent.");
      return;
    }

    try {
      setIsAddingAgent(true);
      const updated = await eventsAdminService.addEventStaff(event.id, emailToInvite);
      setStaffList(updated);
      setNewAgentEmail('');
      toast.success('Agent de contrôle assigné avec succès à cet événement !');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible d'assigner cet agent.";
      toast.error(msg);
    } finally {
      setIsAddingAgent(false);
    }
  };

  const handleRemoveStaff = async (userId: string, name: string) => {
    const confirmed = window.confirm(
      `Confirmez-vous le retrait des droits de contrôle pour ${name} sur cet événement ?`
    );
    if (!confirmed) return;

    try {
      const updated = await eventsAdminService.removeEventStaff(event.id, userId);
      setStaffList(updated);
      toast.info(`Accès au scanner retiré pour ${name}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors du retrait de l'agent.";
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStats();
      loadTickets(1, activeTab, debouncedSearch);
      loadStaff();
    }
  }, [isOpen, activeTab, debouncedSearch, loadStats, loadTickets, loadStaff]);

  const handleTabChange = (tab: TicketFilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingTicket || !cancelReason.trim()) {
      toast.error('Le motif d’annulation est obligatoire.');
      return;
    }

    try {
      setIsCancelling(true);
      await eventsAdminService.cancelTicket(
        cancellingTicket.id,
        cancelReason.trim(),
        cancelNotes.trim() || undefined
      );
      toast.success(`Billet #${cancellingTicket.ticketNumber} annulé.`);
      setCancellingTicket(null);
      setCancelReason('');
      setCancelNotes('');
      loadStats();
      loadTickets(page, activeTab, debouncedSearch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’annulation.';
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokingTicket || !revokeReason.trim()) {
      toast.error('Le motif de révocation est obligatoire.');
      return;
    }

    try {
      setIsRevoking(true);
      await eventsAdminService.revokeTicket(
        revokingTicket.id,
        revokeReason.trim()
      );
      toast.success(`Billet #${revokingTicket.ticketNumber} révoqué.`);
      setRevokingTicket(null);
      setRevokeReason('');
      loadStats();
      loadTickets(page, activeTab, debouncedSearch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la révocation.';
      toast.error(msg);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleOpenHistory = async (ticket: any) => {
    setHistoryTicket(ticket);
    setIsLoadingHistory(true);
    try {
      const data = await eventsAdminService.getTicketHistory(ticket.id);
      setHistoryData(data);
    } catch {
      toast.error('Impossible de charger l’historique des scans.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ─── En-tête de la modale ─── */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--accent)]/15 text-[var(--foreground)] border border-[var(--accent)]/30">
              <Ticket size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Billetterie & Contrôle des accès
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                  {totalCount} billet{totalCount > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                {event.titleFr || event.titleMg}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Sélecteur d'onglet principal : Billets vs Modération / Staff ─── */}
        <div className="px-6 py-2.5 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('TICKETS')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'TICKETS'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              <Ticket size={14} />
              Billets émis & Scans ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('STAFF');
                loadStaff();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'STAFF'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
              }`}
            >
              <Users size={14} />
              Agents de contrôle ({staffList.length})
            </button>
          </div>

          <span className="text-[11px] text-[var(--text-muted)] hidden md:inline">
            {viewMode === 'TICKETS'
              ? 'Consulter, révoquer et inspecter les billets'
              : 'Droits de scan restreints à cet événement précis'}
          </span>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VUE 1 : BILLETS ÉMIS & STATISTIQUES                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'TICKETS' && (
          <>
            {/* ─── Métriques Clés en-tête ─── */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--card)] grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]">
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block mb-0.5">
              Émis
            </span>
            <span className="text-lg font-black text-[var(--foreground)]">
              {stats?.totalTickets ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mb-0.5">
              Valides
            </span>
            <span className="text-lg font-black text-emerald-600">
              {stats?.validTickets ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block mb-0.5">
              Scannés / Entrées
            </span>
            <span className="text-lg font-black text-blue-600">
              {stats?.usedTickets ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-zinc-500/20 bg-zinc-500/5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">
              Annulés
            </span>
            <span className="text-lg font-black text-zinc-500">
              {stats?.cancelledTickets ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5">
            <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider block mb-0.5">
              Révoqués
            </span>
            <span className="text-lg font-black text-red-600">
              {stats?.revokedTickets ?? 0}
            </span>
          </div>

          <div className="p-2.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10">
            <span className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1">
              <Percent size={10} />
              Taux Entrée
            </span>
            <span className="text-lg font-black text-[var(--foreground)]">
              {stats?.checkInRate ?? 0}%
            </span>
          </div>
        </div>

        {/* ─── Barre de filtre et recherche ─── */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--background)] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)] w-full sm:w-auto overflow-x-auto">
            {(
              [
                { key: 'ALL', label: 'Tous' },
                { key: 'VALID', label: 'Valides' },
                { key: 'USED', label: 'Scannés' },
                { key: 'CANCELLED', label: 'Annulés' },
                { key: 'REVOKED', label: 'Révoqués' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="N° de billet, nom, e-mail..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* ─── Tableau des billets ─── */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
              <span className="text-xs text-[var(--text-muted)]">
                Chargement des billets...
              </span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--background)]">
              <Ticket size={32} className="mx-auto text-[var(--text-muted)] mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">
                Aucun billet trouvé
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {search.trim()
                  ? 'Aucun résultat correspondant à votre recherche.'
                  : 'Aucun billet généré pour ce filtre.'}
              </p>
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 font-bold">N° Billet</th>
                    <th className="py-3 px-4 font-bold">Participant</th>
                    <th className="py-3 px-4 font-bold">Statut</th>
                    <th className="py-3 px-4 font-bold">Usage</th>
                    <th className="py-3 px-4 font-bold">Date Émission</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {tickets.map((t) => {
                    const isValid = t.status === 'VALID';
                    const isUsed = t.status === 'USED';
                    const isCancelled = t.status === 'CANCELLED';
                    const isRevoked = t.status === 'REVOKED';

                    return (
                      <tr key={t.id} className="hover:bg-[var(--card-hover)] transition-colors">
                        <td className="py-3 px-4 font-bold font-mono text-[var(--foreground)]">
                          {t.ticketNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[var(--foreground)]">
                            {t.participant?.name || 'Inconnu'}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {t.participant?.email || `@${t.participant?.username || ''}`}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isValid
                                ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                                : isUsed
                                ? 'bg-blue-500/15 text-blue-600 border border-blue-500/20'
                                : isCancelled
                                ? 'bg-zinc-500/15 text-zinc-500 border border-zinc-500/20'
                                : 'bg-red-500/15 text-red-600 border border-red-500/20'
                            }`}
                          >
                            {isValid && <CheckCircle2 size={11} />}
                            {isUsed && <Clock size={11} />}
                            {isCancelled && <Ban size={11} />}
                            {isRevoked && <ShieldAlert size={11} />}
                            {isValid
                              ? 'Valide'
                              : isUsed
                              ? 'Scanné'
                              : isCancelled
                              ? 'Annulé'
                              : 'Révoqué'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--foreground)] font-medium">
                          {t.usedCount} / {t.maxEntries}{' '}
                          <span className="text-[10px] text-[var(--text-muted)]">
                            ({t.entryMode === 'SINGLE' ? 'unique' : 'multi'})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-muted)] text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Historique scans */}
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(t)}
                              title="Historique des scans"
                              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                            >
                              <History size={14} />
                            </button>

                            {/* Annuler */}
                            {isValid && (
                              <button
                                type="button"
                                onClick={() => setCancellingTicket(t)}
                                title="Annuler le billet"
                                className="p-1.5 rounded-lg border border-amber-500/20 text-amber-600 hover:bg-amber-500/10 transition-colors"
                              >
                                <Ban size={14} />
                              </button>
                            )}

                            {/* Révoquer */}
                            {!isRevoked && (
                              <button
                                type="button"
                                onClick={() => setRevokingTicket(t)}
                                title="Révoquer (fraude)"
                                className="p-1.5 rounded-lg border border-red-500/20 text-red-600 hover:bg-red-500/10 transition-colors"
                              >
                                <ShieldAlert size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                Page {page} sur {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => loadTickets(page - 1, activeTab, debouncedSearch)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] disabled:opacity-50 hover:bg-[var(--card-hover)]"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => loadTickets(page + 1, activeTab, debouncedSearch)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] disabled:opacity-50 hover:bg-[var(--card-hover)]"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VUE 2 : AGENTS DE CONTRÔLE DE L'ÉVÉNEMENT (MODÉRATION CIBLÉE)       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'STAFF' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Bannière explicative de sécurité */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-start gap-3">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[var(--foreground)]">
                  Modération et scan d&apos;accès spécifiques à cet événement
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Les personnes assignées ci-dessous peuvent ouvrir l&apos;application mobile Kanto MG sur leur smartphone pour **scanner et valider les billets uniquement pour cet événement**. Elles ne disposent d&apos;aucun droit sur les autres événements ni sur la console d&apos;administration.
                </p>
              </div>
            </div>

            {/* Formulaire d'assignation d'un agent */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus size={14} className="text-[var(--accent)]" />
                Assigner un agent de contrôle pour cet événement
              </h4>
              <form onSubmit={handleAddStaff} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="Adresse e-mail ou nom d'utilisateur Kanto de l'agent..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <button
                  type="submit"
                  disabled={isAddingAgent || !newAgentEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                >
                  {isAddingAgent ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  {isAddingAgent ? 'Assignation...' : 'Donner accès au scan'}
                </button>
              </form>
            </div>

            {/* Liste des agents de contrôle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-[var(--accent)]" />
                  Agents habilités pour cet événement ({staffList.length})
                </h4>
                {isLoadingStaff && (
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Actualisation...
                  </span>
                )}
              </div>

              {staffList.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] text-center space-y-2">
                  <Users size={28} className="mx-auto text-[var(--text-muted)] opacity-40" />
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    Aucun agent de contrôle assigné
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-md mx-auto">
                    Actuellement, seuls les super-administrateurs Kanto peuvent scanner les billets. Ajoutez ci-dessus les adresses e-mail des bénévoles ou agents d&apos;accueil pour leur ouvrir le scanner mobile sur cet événement.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {staffList.map((agent) => (
                    <div
                      key={agent.userId}
                      className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {agent.avatar ? (
                          <img
                            src={agent.avatar}
                            alt={agent.name}
                            className="w-9 h-9 rounded-full object-cover border border-[var(--border)]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center font-bold text-xs text-[var(--accent)]">
                            {agent.name ? agent.name.slice(0, 2).toUpperCase() : 'AG'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--foreground)] truncate">
                            {agent.name}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            {agent.email}
                          </p>
                          <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">
                            Habilité au scan • Assigné le {new Date(agent.addedAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(agent.userId, agent.name)}
                        title="Retirer les droits de contrôle pour cet événement"
                        className="p-2 rounded-lg text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Sous-Modale : Annulation Administrative ─── */}
        {cancellingTicket && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  <Ban size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)]">
                    Annuler le billet #{cancellingTicket.ticketNumber}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {cancellingTicket.participant?.name}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Motif d’annulation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Désistement demandé par téléphone..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Notes internes (optionnel)
                </label>
                <textarea
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Notes réservées à l'équipe administrative..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingTicket(null)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-[var(--border)] hover:bg-[var(--card-hover)]"
                >
                  Retour
                </button>
                <button
                  type="button"
                  disabled={isCancelling || !cancelReason.trim()}
                  onClick={handleConfirmCancel}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isCancelling ? 'Annulation...' : 'Confirmer l’annulation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Sous-Modale : Révocation (Fraude) ─── */}
        {revokingTicket && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/15 text-red-600 border border-red-500/30">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-600">
                    Révoquer le billet #{revokingTicket.ticketNumber}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {revokingTicket.participant?.name}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-muted)] bg-red-500/10 p-3 rounded-xl border border-red-500/20 leading-relaxed">
                ⚠️ <strong>Avertissement :</strong> La révocation bloque définitivement l’accès du porteur au point de contrôle. Cette action est consignée dans le journal d'audit de sécurité.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Motif de révocation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Ex: Falsification détectée, partage de compte..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingTicket(null)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-[var(--border)] hover:bg-[var(--card-hover)]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isRevoking || !revokeReason.trim()}
                  onClick={handleConfirmRevoke}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isRevoking ? 'Révocation...' : 'Révoquer le billet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Sous-Modale : Historique des Scans ─── */}
        {historyTicket && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[var(--accent)]/15 text-[var(--foreground)]">
                    <History size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--foreground)]">
                      Historique des scans
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      Billet #{historyTicket.ticketNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryTicket(null)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  <X size={16} />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="py-8 flex justify-center">
                  <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
                </div>
              ) : historyData?.validations?.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">
                  Aucun scan enregistré pour ce billet.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {historyData?.validations?.map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              v.result === 'GRANTED' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {v.result === 'GRANTED' ? 'Accès Autorisé' : v.result}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Agent : {v.scannedByName || v.scannedById}
                          {v.deviceInfo ? ` • ${v.deviceInfo}` : ''}
                        </div>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {new Date(v.scannedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setHistoryTicket(null)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] hover:bg-[var(--card-hover)]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
