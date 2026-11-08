'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  Megaphone,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MousePointerClick,
  Users,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface PlacementItem {
  id: string;
  code: string;
  nameFr: string;
  nameMg: string;
  descriptionFr: string;
  basePrice?: number | null;
  currency?: string | null;
  allowedDurationsDays: number[];
}

interface PartnerMarketingRequest {
  id: string;
  status: string;
  requestedStartDate: string;
  requestedEndDate: string;
  campaignGoals?: string | null;
  proposedBudget?: number | null;
  currency?: string | null;
  impressionsCount: number;
  clicksCount: number;
  conversionsCount: number;
  event: {
    id: string;
    titleFr: string;
    slug: string;
  };
  placements: Array<{
    placement: PlacementItem;
  }>;
  messages?: Array<{
    senderRole: 'PARTNER' | 'ADMIN';
    senderName: string;
    text: string;
    sentAt: string;
  }>;
  createdAt: string;
}

export default function PartnerPortalMarketingPage() {
  const { toast } = useToast();

  const [placements, setPlacements] = useState<PlacementItem[]>([]);
  const [requests, setRequests] = useState<PartnerMarketingRequest[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Demande
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedPlacementIds, setSelectedPlacementIds] = useState<string[]>([]);
  const [requestedStartDate, setRequestedStartDate] = useState('');
  const [requestedEndDate, setRequestedEndDate] = useState('');
  const [campaignGoals, setCampaignGoals] = useState('');
  const [proposedBudget, setProposedBudget] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Discussion & détails
  const [activeRequest, setActiveRequest] = useState<PartnerMarketingRequest | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [placementsRes, requestsRes, eventsRes] = await Promise.all([
        fetchApi<{ items?: PlacementItem[] } | PlacementItem[]>('/v1/marketing/placements').catch(() => []),
        fetchApi<{ items: PartnerMarketingRequest[] }>('/admin/partners/marketing/requests').catch(() => ({ items: [] })),
        fetchApi<{ items: any[] }>('/admin/partners/events/list').catch(() => ({ items: [] })),
      ]);

      const plList = Array.isArray(placementsRes)
        ? placementsRes
        : (placementsRes as any)?.items || [];
      setPlacements(plList);
      setRequests(requestsRes.items || []);
      setMyEvents(eventsRes.items || []);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors du chargement des prestations.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const togglePlacement = (id: string) => {
    setSelectedPlacementIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.warning('Veuillez sélectionner l’événement à promouvoir.');
      return;
    }
    if (selectedPlacementIds.length === 0) {
      toast.warning('Veuillez sélectionner au moins un emplacement publicitaire.');
      return;
    }
    if (!requestedStartDate || !requestedEndDate) {
      toast.warning('Veuillez définir la période de diffusion souhaitée.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi('/v1/marketing/requests', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEventId,
          placementIds: selectedPlacementIds,
          requestedStartDate: new Date(requestedStartDate).toISOString(),
          requestedEndDate: new Date(requestedEndDate).toISOString(),
          campaignGoals: campaignGoals.trim() || undefined,
          proposedBudget: proposedBudget ? Number(proposedBudget) : undefined,
        }),
      });

      toast.success('Votre demande de prestation marketing a été soumise à l’équipe Kanto MG !');
      setIsRequestModalOpen(false);
      setSelectedPlacementIds([]);
      setCampaignGoals('');
      setProposedBudget('');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de créer la demande de visibilité.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChat = async () => {
    if (!activeRequest || !chatMessage.trim()) return;

    setIsSendingChat(true);
    try {
      await fetchApi(
        `/admin/partners/marketing/requests/${encodeURIComponent(activeRequest.id)}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ message: chatMessage.trim() }),
        }
      );

      toast.success('Message envoyé à l’équipe Kanto.');
      setChatMessage('');
      // Rafraîchir les détails
      const updated = await fetchApi<PartnerMarketingRequest>(
        `/admin/partners/marketing/requests/${encodeURIComponent(activeRequest.id)}`
      );
      setActiveRequest(updated);
      loadData();
    } catch (err: any) {
      toast.error('Erreur lors de l’envoi du message.');
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-amber-400" />
            Prestations Marketing & Sponsoring Kanto
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Sollicitez des mises en avant stratégiques sur l'application mobile Kanto MG pour
            développer l'audience de vos événements culturels.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          Demander une mise en avant
        </button>
      </div>

      {/* Catalogue des offres de visibilité */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Catalogue des Emplacements Disponibles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {placements.map((p) => (
            <div
              key={p.id}
              className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-3 hover:border-zinc-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-zinc-100 text-sm">{p.nameFr}</h4>
                {p.basePrice && (
                  <span className="text-xs font-bold text-amber-400 shrink-0">
                    Dès {p.basePrice.toLocaleString('fr-FR')} {p.currency || 'MGA'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{p.descriptionFr}</p>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-500">
                <span>Code : {p.code}</span>
                <span>Durées : {p.allowedDurationsDays?.join(', ')} jours</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mes demandes en cours et suivi */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">Mes Demandes & Campagnes Actives</h3>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des demandes */}
          <div className="lg:col-span-2 space-y-3">
            {isLoading ? (
              <div className="py-16 flex justify-center text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 space-y-2">
                <Megaphone className="w-8 h-8 mx-auto text-zinc-600 stroke-1" />
                <p className="text-sm font-semibold text-zinc-300">Aucune campagne en cours</p>
                <p className="text-xs max-w-sm mx-auto">
                  Déposez votre première demande de visibilité pour promouvoir vos dates.
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setActiveRequest(req)}
                    className={`p-5 cursor-pointer transition flex flex-col gap-2.5 ${
                      activeRequest?.id === req.id
                        ? 'bg-zinc-800/60 border-l-4 border-emerald-500'
                        : 'hover:bg-zinc-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-zinc-100 text-sm">
                        {req.event?.titleFr || 'Événement'}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {req.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        Du {new Date(req.requestedStartDate).toLocaleDateString('fr-FR')} au{' '}
                        {new Date(req.requestedEndDate).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-zinc-500" />
                        {req.impressionsCount} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5 text-zinc-500" />
                        {req.clicksCount} clics
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Volet détails & messagerie */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            {activeRequest ? (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Suivi de la prestation
                  </div>
                  <h4 className="font-bold text-zinc-100 text-sm mt-0.5">
                    {activeRequest.event?.titleFr}
                  </h4>
                  <p className="text-xs text-emerald-400">Statut : {activeRequest.status}</p>
                </div>

                {/* Métriques réelles de diffusion */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800 text-center">
                  <div>
                    <div className="text-[10px] text-zinc-500">Impressions</div>
                    <div className="text-sm font-bold text-zinc-100">
                      {activeRequest.impressionsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Clics</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {activeRequest.clicksCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500">Inscrits</div>
                    <div className="text-sm font-bold text-amber-400">
                      {activeRequest.conversionsCount}
                    </div>
                  </div>
                </div>

                {/* Fil de discussion */}
                <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    Échanges avec l'équipe Kanto
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {Array.isArray(activeRequest.messages) && activeRequest.messages.length > 0 ? (
                      activeRequest.messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs ${
                            m.senderRole === 'PARTNER'
                              ? 'bg-emerald-950/30 border border-emerald-900/40 text-emerald-200 ml-4'
                              : 'bg-zinc-800 text-zinc-200 mr-4 border border-zinc-700/60'
                          }`}
                        >
                          <div className="font-semibold text-[10px] text-zinc-400 mb-0.5">
                            {m.senderName}
                          </div>
                          <p className="leading-relaxed">{m.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 italic">Aucun message pour l’instant.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Poser une question à l'équipe..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendChat();
                      }}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <button
                      disabled={isSendingChat || !chatMessage.trim()}
                      onClick={handleSendChat}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg transition"
                    >
                      {isSendingChat ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-zinc-500 space-y-1">
                <Megaphone className="w-7 h-7 mx-auto stroke-1 text-zinc-600" />
                <p>Sélectionnez une demande à gauche pour suivre son état et échanger.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nouvelle Demande */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-400" />
                Demande de Prestation Marketing
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Choisissez l'événement à valoriser et les emplacements visuels souhaités.
              </p>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Événement à promouvoir *
                </label>
                <select
                  required
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">Sélectionnez un événement...</option>
                  {myEvents.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.titleFr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Emplacements publicitaires ciblés *
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {placements.map((p) => {
                    const isChecked = selectedPlacementIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePlacement(p.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-200'
                            : 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="accent-emerald-500"
                          />
                          <span className="font-semibold text-zinc-200">{p.nameFr}</span>
                        </div>
                        {p.basePrice && (
                          <span className="text-amber-400 font-mono text-[11px]">
                            {p.basePrice.toLocaleString('fr-FR')} Ar
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Début souhaité *
                  </label>
                  <input
                    type="date"
                    required
                    value={requestedStartDate}
                    onChange={(e) => setRequestedStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Fin souhaitée *
                  </label>
                  <input
                    type="date"
                    required
                    value={requestedEndDate}
                    onChange={(e) => setRequestedEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Budget prévisionnel indicatif (Ariary)
                </label>
                <input
                  type="number"
                  min="0"
                  value={proposedBudget}
                  onChange={(e) =>
                    setProposedBudget(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="Ex: 250000"
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Objectifs de la campagne & consignes
                </label>
                <textarea
                  rows={2}
                  value={campaignGoals}
                  onChange={(e) => setCampaignGoals(e.target.value)}
                  placeholder="Ex: Maximiser les inscriptions pour l'atelier de contes du week-end..."
                  className="w-full p-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
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
                  Soumettre la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

