'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  Calendar,
  Plus,
  Search,
  Users,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ArrowRight,
  Download,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

interface EventItem {
  id: string;
  slug: string;
  titleFr: string;
  titleMg: string;
  descriptionFr: string;
  category: string;
  status: string;
  moderationStatus: string;
  startDate: string;
  endDate: string;
  currentParticipantsCount: number;
  maxParticipants?: number | null;
  viewsCount: number;
  sharesCount: number;
  isPaid: boolean;
  ticketPrice?: number | null;
}

export default function PartnerPortalEventsPage() {
  const { toast } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [titleFr, setTitleFr] = useState('');
  const [titleMg, setTitleMg] = useState('');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [category, setCategory] = useState('CULTURE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | ''>(100);
  const [enableWaitlist, setEnableWaitlist] = useState(true);
  const [submitForReview, setSubmitForReview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Participants & Export
  const [selectedEventForExport, setSelectedEventForExport] = useState<EventItem | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // Endpoint partenaire pour lister ses événements
      const res = await fetchApi<{ items: EventItem[] }>('/admin/partners/events/list');
      setEvents(res.items || []);
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de récupérer vos événements.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleFr.trim() || !startDate || !endDate) {
      toast.warning('Veuillez renseigner le titre en français et les dates de l’événement.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Endpoint de création d'événement
      await fetchApi('/events/admin', {
        method: 'POST',
        body: JSON.stringify({
          titleFr: titleFr.trim(),
          titleMg: titleMg.trim() || titleFr.trim(),
          descriptionFr: descriptionFr.trim(),
          descriptionMg: descriptionFr.trim(),
          category,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          maxParticipants: maxParticipants ? Number(maxParticipants) : null,
          enableWaitlist,
          submitForReview,
        }),
      });

      toast.success(
        submitForReview
          ? 'Événement soumis pour modération avec succès !'
          : 'Brouillon d’événement enregistré.'
      );

      setIsCreateModalOpen(false);
      setTitleFr('');
      setTitleMg('');
      setDescriptionFr('');
      setStartDate('');
      setEndDate('');
      fetchEvents();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la création de l’événement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewParticipants = async (event: EventItem) => {
    setSelectedEventForExport(event);
    setIsParticipantsLoading(true);
    try {
      const res = await fetchApi<{ items?: any[]; participants?: any[] }>(
        `/events/admin/${encodeURIComponent(event.id)}/participants`
      );
      setParticipants(res.items || res.participants || []);
    } catch (err: any) {
      toast.error('Impossible de charger la liste des participants.');
    } finally {
      setIsParticipantsLoading(false);
    }
  };

  const exportCsv = (event: EventItem, list: any[]) => {
    if (list.length === 0) {
      toast.warning('Aucun participant à exporter.');
      return;
    }

    const headers = ['Nom d affichage', 'Username', 'Statut', 'Date d inscription'];
    const rows = list.map((p) => [
      `"${p.user?.name || p.participant?.displayName || 'Anonyme'}"`,
      `"${p.user?.username || p.participant?.username || '-'}"`,
      `"${p.status}"`,
      `"${new Date(p.createdAt || p.registeredAt).toLocaleString('fr-FR')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants_${event.slug}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Fichier CSV conforme RGPD téléchargé.');
  };

  const filteredEvents = events.filter(
    (e) =>
      e.titleFr.toLowerCase().includes(search.toLowerCase()) ||
      e.titleMg.toLowerCase().includes(search.toLowerCase()) ||
      e.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-emerald-400" />
            Mes Événements & Programmations
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gérez vos manifestations culturelles, suivez les inscrits et exportez les listes
            d'émargement conformes RGPD.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          Créer un événement
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Rechercher par titre, mot-clé, identifiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <button
          onClick={fetchEvents}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Liste des événements */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs">Chargement de vos programmations...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <Calendar className="w-10 h-10 mx-auto text-zinc-600 stroke-1" />
            <p className="text-sm font-semibold text-zinc-300">Aucun événement répertorié</p>
            <p className="text-xs max-w-sm mx-auto">
              Cliquez sur « Créer un événement » pour programmer votre première session culturelle.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="p-5 hover:bg-zinc-800/25 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-zinc-100 text-base">{event.titleFr}</h3>
                    {event.moderationStatus === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> En ligne
                      </span>
                    ) : event.moderationStatus === 'PENDING_REVIEW' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3 h-3" /> En attente de modération Kanto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-700 text-zinc-300 border border-zinc-600">
                        Brouillon
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-emerald-400/90 font-medium">🇲🇬 {event.titleMg}</p>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1 flex-wrap">
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
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      {event.viewsCount} vues
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleViewParticipants(event)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Inscrits ({event.currentParticipantsCount})
                  </button>
                  <Link
                    href={`/portal/marketing?eventId=${event.id}`}
                    className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition flex items-center gap-1.5"
                  >
                    Promouvoir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Inscrits & Export CSV */}
      {selectedEventForExport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  Participants : {selectedEventForExport.titleFr}
                </h3>
                <p className="text-xs text-zinc-500">
                  Total : {participants.length} inscrits • Conforme RGPD (emails masqués)
                </p>
              </div>
              <button
                onClick={() => exportCsv(selectedEventForExport, participants)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter CSV
              </button>
            </div>

            {isParticipantsLoading ? (
              <div className="py-12 flex justify-center text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : participants.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-500">
                Aucun participant inscrit pour l'instant.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50">
                {participants.map((p, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-zinc-200">
                        {p.user?.name || p.participant?.displayName || 'Participant Kanto'}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        @{p.user?.username || p.participant?.username || 'user'} • Inscription le{' '}
                        {new Date(p.createdAt || p.registeredAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 text-right">
              <button
                onClick={() => setSelectedEventForExport(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création d'événement */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Nouveau Programme Culturel
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Remplissez les informations de votre événement pour le soumettre à validation.
              </p>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Titre en français *
                </label>
                <input
                  type="text"
                  required
                  value={titleFr}
                  onChange={(e) => setTitleFr(e.target.value)}
                  placeholder="Ex: Conférence sur l’histoire des Royaumes Malgaches"
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Titre en malgache (Optionnel)
                </label>
                <input
                  type="text"
                  value={titleMg}
                  onChange={(e) => setTitleMg(e.target.value)}
                  placeholder="Ex: Famelabelarana mikasika ny Tantaranny Fanjakana Malagasy"
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Date & Heure de début *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Date & Heure de fin *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Jauge maximale (Inscrits)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxParticipants}
                    onChange={(e) =>
                      setMaxParticipants(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Illimité si vide"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="CULTURE">Culture & Tradition</option>
                    <option value="CHALLENGE">Défi / Tournoi</option>
                    <option value="COMMUNITY">Communauté</option>
                    <option value="SEASONAL">Saisonnier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Description détaillée
                </label>
                <textarea
                  rows={3}
                  value={descriptionFr}
                  onChange={(e) => setDescriptionFr(e.target.value)}
                  placeholder="Présentation du déroulement, intervenants, accès..."
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex items-center gap-2 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
                <input
                  type="checkbox"
                  id="submitReview"
                  checked={submitForReview}
                  onChange={(e) => setSubmitForReview(e.target.checked)}
                  className="accent-emerald-500"
                />
                <label htmlFor="submitReview" className="text-xs text-zinc-300 cursor-pointer">
                  Soumettre immédiatement pour modération Kanto MG
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Enregistrer l’événement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

