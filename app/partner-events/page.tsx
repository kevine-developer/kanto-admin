'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useToast } from '@/lib/hooks/useToast';
import {
  partnersAdminService,
  PartnerEventItem,
  EventModerationStatus,
} from '@/services/partners.service';
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
  MapPin,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Eye,
} from 'lucide-react';

export default function PartnerEventsAdminPage() {
  const { toast } = useToast();

  const [events, setEvents] = useState<PartnerEventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [moderationFilter, setModerationFilter] = useState<string>('PENDING_REVIEW');

  // Modal modération
  const [selectedEvent, setSelectedEvent] = useState<PartnerEventItem | null>(null);
  const [decision, setDecision] = useState<EventModerationStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await partnersAdminService.getPartnerEvents({
        search: search.trim() || undefined,
        moderationStatus:
          moderationFilter !== 'ALL'
            ? (moderationFilter as EventModerationStatus)
            : undefined,
        page,
        limit: 15,
      });
      setEvents(res.items || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de récupérer les événements partenaires.');
    } finally {
      setIsLoading(false);
    }
  }, [search, moderationFilter, page, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleReview = async () => {
    if (!selectedEvent || !decision) return;

    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      toast.warning('Veuillez saisir un motif explicatif pour le refus de l’événement.');
      return;
    }

    setIsSubmitting(true);
    try {
      await partnersAdminService.reviewPartnerEvent(selectedEvent.id, {
        decision,
        rejectionReason: rejectionReason.trim() || undefined,
      });

      toast.success(`L'événement « ${selectedEvent.titleFr} » est maintenant : ${decision}`);

      setSelectedEvent(null);
      setDecision(null);
      setRejectionReason('');
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModerationBadge = (status: EventModerationStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approuvé & Publié
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> À examiner
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" /> Rejeté
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Suspendu
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-700/40 text-zinc-400 border border-zinc-700">
            Brouillon
          </span>
        );
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Modération des Événements Partenaires</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Examinez et validez les événements culturels soumis par les tiers avant leur parution dans l'application Kanto MG.
          </p>
        </div>
        {/* Barre de recherche et filtres */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher par titre, organisateur ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={moderationFilter}
              onChange={(e) => setModerationFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="ALL">Tous les statuts de modération</option>
              <option value="PENDING_REVIEW">En attente de revue (Prioritaire)</option>
              <option value="APPROVED">Approuvés (En ligne)</option>
              <option value="REJECTED">Rejetés</option>
              <option value="SUSPENDED">Suspendus</option>
            </select>

            <button
              onClick={fetchEvents}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Liste des événements */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm">Chargement des événements partenaires...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Calendar className="w-10 h-10 text-zinc-600 stroke-1" />
              <p className="text-base font-medium text-zinc-300">Aucun événement à modérer</p>
              <p className="text-sm">Tous les événements partenaires ont été examinés.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-5 hover:bg-zinc-800/25 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700/80 overflow-hidden shrink-0 flex items-center justify-center text-zinc-500">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.titleFr}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Calendar className="w-6 h-6 text-zinc-500" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-bold text-zinc-100 text-base">{event.titleFr}</h4>
                        {getModerationBadge(event.moderationStatus)}
                      </div>
                      <p className="text-xs text-emerald-400/90 font-medium">
                        🇲🇬 {event.titleMg}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                          <strong className="text-zinc-200">
                            {event.partner?.name || 'Partenaire inconnu'}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          Du {new Date(event.startDate).toLocaleDateString('fr-FR')} au{' '}
                          {new Date(event.endDate).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          {event.currentParticipantsCount} /{' '}
                          {event.maxParticipants ? `${event.maxParticipants} max` : 'Illimité'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setDecision('APPROVED');
                      }}
                      className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approuver
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setDecision('REJECTED');
                      }}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/30 transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400">
              <div>
                Total : <span className="text-zinc-200 font-semibold">{total}</span> événements
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded border border-zinc-700 transition"
                >
                  Précédent
                </button>
                <span>
                  Page {page} sur {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded border border-zinc-700 transition"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Décision */}
        {selectedEvent && decision && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  {decision === 'APPROVED' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Approuver la parution de l’événement
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      Refuser l’événement
                    </>
                  )}
                </h3>
                <p className="text-sm text-zinc-300 mt-1 font-medium">{selectedEvent.titleFr}</p>
                <p className="text-xs text-zinc-500">
                  Organisateur : {selectedEvent.partner?.name}
                </p>
              </div>

              {decision === 'APPROVED' && (
                <p className="text-sm text-zinc-300 leading-relaxed bg-emerald-950/20 border border-emerald-900/30 p-3.5 rounded-xl">
                  En approuvant cet événement, il sera immédiatement visible sur l’application mobile
                  Kanto MG (Catalogue officiel et suggestions culturelles). Les utilisateurs pourront
                  s’y inscrire.
                </p>
              )}

              {decision === 'REJECTED' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Motif du refus (obligatoire)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Titre ou contenu non conforme à la charte culturelle Kanto MG..."
                    className="w-full p-3 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setSelectedEvent(null);
                    setDecision(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReview}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition flex items-center gap-2 ${
                    decision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {decision === 'APPROVED' ? 'Confirmer la publication' : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
