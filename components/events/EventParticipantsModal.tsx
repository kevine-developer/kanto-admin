'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  UserX,
  AlertCircle,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import {
  eventsAdminService,
  EventAdminItem,
  AdminEventParticipantItem,
} from '@/services/events.service';
import { useToast } from '@/lib/hooks/useToast';

interface EventParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventAdminItem;
  onParticipantsUpdated?: () => void;
}

type ParticipantTab = 'ALL' | 'CONFIRMED' | 'WAITLIST' | 'CANCELLED';

export function EventParticipantsModal({
  isOpen,
  onClose,
  event,
  onParticipantsUpdated,
}: EventParticipantsModalProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ParticipantTab>('ALL');
  const [participants, setParticipants] = useState<AdminEventParticipantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modale d'annulation administrative d'un participant
  const [cancellingParticipant, setCancellingParticipant] =
    useState<AdminEventParticipantItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [notifyUser, setNotifyUser] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Debounce sur la recherche
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadParticipants = useCallback(
    async (currentPage = 1, currentTab = activeTab, term = debouncedSearch) => {
      setIsLoading(true);
      try {
        const res = await eventsAdminService.getParticipants(event.id, {
          page: currentPage,
          limit: 15,
          status: currentTab,
          search: term.trim() || undefined,
        });
        setParticipants(res.items || []);
        setTotalCount(res.pagination?.total ?? 0);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setPage(currentPage);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Impossible de charger la liste des participants.';
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [event.id, activeTab, debouncedSearch, toast]
  );

  useEffect(() => {
    if (isOpen) {
      loadParticipants(1, activeTab, debouncedSearch);
    }
  }, [isOpen, activeTab, debouncedSearch, loadParticipants]);

  const handleTabChange = (tab: ParticipantTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleOpenCancelModal = (p: AdminEventParticipantItem) => {
    setCancellingParticipant(p);
    setCancelReason('');
    setInternalNotes('');
    setNotifyUser(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingParticipant) return;
    if (!cancelReason.trim()) {
      toast.error('Le motif d’annulation est obligatoire.');
      return;
    }

    try {
      setIsCancelling(true);
      const res = await eventsAdminService.cancelParticipant(
        event.id,
        cancellingParticipant.userId,
        {
          reason: cancelReason.trim(),
          internalNotes: internalNotes.trim() || undefined,
          notifyUser,
        }
      );

      toast.success(res.message);
      setCancellingParticipant(null);
      await loadParticipants(page, activeTab, debouncedSearch);
      if (onParticipantsUpdated) onParticipantsUpdated();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erreur lors de l’annulation de l’inscription.';
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête de la modale */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">
                Participants réels — {event.titleFr || event.titleMg}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Capacité : {event.currentParticipantsCount}
                {event.maxParticipants ? ` / ${event.maxParticipants}` : ' (illimitée)'}
                {event.enableWaitlist && ' • Liste d’attente active'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--card-hover)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Onglets et Barre de recherche */}
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--background)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => handleTabChange('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card)]'
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('CONFIRMED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'CONFIRMED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card)]'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Confirmés</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('WAITLIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'WAITLIST'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card)]'
              }`}
            >
              <Clock size={13} />
              <span>Liste d’attente</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('CANCELLED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'CANCELLED'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:bg-[var(--card)]'
              }`}
            >
              <UserX size={13} />
              <span>Désistés / Annulés</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* Tableau des participants */}
        <div className="p-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
              <span className="text-xs text-[var(--text-muted)]">
                Chargement des données réelles depuis PostgreSQL...
              </span>
            </div>
          ) : participants.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Aucun participant trouvé pour cette sélection.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--background)] border-b border-[var(--border)] uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Membre</th>
                  <th className="px-3 py-2.5 font-semibold">Statut</th>
                  <th className="px-3 py-2.5 font-semibold">Dates & Suivi</th>
                  <th className="px-3 py-2.5 font-semibold">Progression</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {participants.map((p) => {
                  const isWaitlist = p.status === 'WAITLIST';
                  const isCancelled = p.status === 'CANCELLED';
                  const isConfirmed =
                    p.status === 'REGISTERED' ||
                    p.status === 'IN_PROGRESS' ||
                    p.status === 'COMPLETED';

                  return (
                    <tr key={p.id} className="hover:bg-[var(--card-hover)] transition-colors">
                      {/* Membre */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          {p.userAvatar ? (
                            <img
                              src={p.userAvatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-[var(--border)]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center font-bold text-xs text-[var(--foreground)]">
                              {(p.userName || 'M').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-[var(--foreground)]">
                              {p.userName}
                            </div>
                            {p.userEmail && (
                              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                                <Mail size={10} />
                                <span>{p.userEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-3 py-3">
                        {isWaitlist && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            <Clock size={10} />
                            <span>En attente #{p.waitlistPosition ?? 1}</span>
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 size={10} />
                            <span>
                              {p.status === 'COMPLETED'
                                ? 'Terminé'
                                : p.status === 'IN_PROGRESS'
                                ? 'En cours'
                                : 'Inscrit'}
                            </span>
                          </span>
                        )}
                        {isCancelled && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                              <UserX size={10} />
                              <span>
                                {p.cancelledByRole === 'ADMIN'
                                  ? 'Annulé par admin'
                                  : 'Désisté'}
                              </span>
                            </span>
                            {p.cancellationReason && (
                              <p className="text-[10px] text-[var(--text-muted)] mt-1 max-w-xs italic line-clamp-1">
                                &quot;{p.cancellationReason}&quot;
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Dates & Suivi */}
                      <td className="px-3 py-3 text-[11px] text-[var(--text-muted)]">
                        <div>
                          Inscrit le{' '}
                          {new Date(p.registeredAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {p.promotedFromWaitlistAt && (
                          <div className="text-emerald-700 dark:text-emerald-400 font-medium text-[10px]">
                            Promu de file d&apos;attente
                          </div>
                        )}
                        {p.cancelledAt && (
                          <div className="text-red-600 dark:text-red-400 text-[10px]">
                            Annulé le{' '}
                            {new Date(p.cancelledAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </div>
                        )}
                      </td>

                      {/* Progression */}
                      <td className="px-3 py-3">
                        <div className="font-semibold text-[var(--foreground)]">
                          {p.score} pts
                        </div>
                        {p.progressPercent > 0 && (
                          <div className="w-20 h-1.5 rounded-full bg-[var(--border)] overflow-hidden mt-1">
                            <div
                              className="h-full bg-[var(--accent)]"
                              style={{ width: `${Math.min(100, p.progressPercent)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Actions administratives */}
                      <td className="px-3 py-3 text-right">
                        {(isConfirmed || isWaitlist) && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
                            title="Annuler l'inscription avec notification et motif"
                          >
                            <UserX size={12} />
                            <span>Annuler</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--background)]">
            <span>
              {totalCount} participant(s) • Page {page} sur {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => loadParticipants(page - 1)}
                className="px-2.5 py-1 rounded-md border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--card)]"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => loadParticipants(page + 1)}
                className="px-2.5 py-1 rounded-md border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--card)]"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALE DÉDIÉE : CONFIRMATION D'ANNULATION ADMINISTRATIVE ─── */}
      {cancellingParticipant && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  Annuler l’inscription de {cancellingParticipant.userName}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Événement : <strong className="text-[var(--foreground)]">{event.titleFr}</strong>
                </p>
              </div>
            </div>

            {/* Avertissement promotion automatique */}
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                La place libérée sera instantanément attribuée au prochain candidat sur la liste d&apos;attente, sans interruption de quota.
              </span>
            </div>

            {/* Formulaire de motif */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Motif de l’annulation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Désistement demandé par le participant, non-respect des règles..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Notes internes (administrateurs uniquement)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes de traçabilité interne..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-[var(--foreground)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyUser}
                  onChange={(e) => setNotifyUser(e.target.checked)}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>Notifier le participant par notification in-app / push</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancellingParticipant(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isCancelling || !cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {isCancelling && <Loader2 size={12} className="animate-spin" />}
                <span>Confirmer l&apos;annulation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
