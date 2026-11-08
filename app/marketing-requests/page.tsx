'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useToast } from '@/lib/hooks/useToast';
import {
  partnersAdminService,
  MarketingRequestItem,
  MarketingRequestStatus,
} from '@/services/partners.service';
import {
  Megaphone,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  MessageSquare,
  BarChart3,
  Send,
  Loader2,
  RefreshCw,
  Eye,
  MousePointerClick,
  Users,
} from 'lucide-react';

export default function MarketingRequestsAdminPage() {
  const { toast } = useToast();

  const [requests, setRequests] = useState<MarketingRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Détails et fil de messages
  const [selectedRequest, setSelectedRequest] = useState<MarketingRequestItem | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await partnersAdminService.getMarketingRequests({
        status: statusFilter !== 'ALL' ? (statusFilter as MarketingRequestStatus) : undefined,
        page,
        limit: 15,
      });
      setRequests(res.items || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de récupérer les demandes marketing.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSendMessage = async () => {
    if (!selectedRequest || !newMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      await partnersAdminService.sendMarketingMessage(
        selectedRequest.id,
        newMessage.trim()
      );

      toast.success('Votre message a été transmis à l’organisateur.');

      // Recharger le détail de la demande
      const updated = await partnersAdminService.getMarketingRequestDetails(
        selectedRequest.id
      );
      setSelectedRequest(updated);
      setNewMessage('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || 'Une erreur est survenue lors de l’envoi.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleStatusChange = async (newStatus: MarketingRequestStatus) => {
    if (!selectedRequest) return;

    setIsUpdatingStatus(true);
    try {
      await partnersAdminService.reviewMarketingRequest(selectedRequest.id, {
        status: newStatus,
      });

      toast.success(`La demande est maintenant : ${newStatus}`);

      const updated = await partnersAdminService.getMarketingRequestDetails(
        selectedRequest.id
      );
      setSelectedRequest(updated);
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de modifier le statut.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: MarketingRequestStatus) => {
    switch (status) {
      case 'ACCEPTED':
      case 'SCHEDULED':
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'INFO_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" /> {status}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Terminée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-700/40 text-zinc-400 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Campagnes Marketing & Sponsoring Partenaires</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Traitez les demandes de visibilité et prestations promotionnelles soumises par les organisateurs partenaires.
          </p>
        </div>
        {/* Filtres */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="SUBMITTED">Soumises (Nouvelles)</option>
              <option value="UNDER_REVIEW">En cours d'étude</option>
              <option value="ACCEPTED">Acceptées / Devis validé</option>
              <option value="SCHEDULED">Programmées</option>
              <option value="RUNNING">En cours de diffusion</option>
              <option value="COMPLETED">Terminées</option>
              <option value="REJECTED">Refusées</option>
            </select>

            <button
              onClick={fetchRequests}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des demandes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <p className="text-sm">Chargement des demandes...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-2">
                  <Megaphone className="w-10 h-10 text-zinc-600 stroke-1" />
                  <p className="text-base font-medium text-zinc-300">Aucune demande marketing</p>
                  <p className="text-sm">Aucun partenaire n'a sollicité de visibilité pour l'instant.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`p-5 cursor-pointer transition flex flex-col gap-3 ${
                        selectedRequest?.id === req.id
                          ? 'bg-zinc-800/60 border-l-4 border-emerald-500'
                          : 'hover:bg-zinc-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-bold text-zinc-100 text-base">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          {req.partner.name}
                        </div>
                        {getStatusBadge(req.status)}
                      </div>

                      <div className="text-sm text-zinc-300">
                        Événement :{' '}
                        <strong className="text-zinc-100">{req.event.titleFr}</strong>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          Du {new Date(req.requestedStartDate).toLocaleDateString('fr-FR')} au{' '}
                          {new Date(req.requestedEndDate).toLocaleDateString('fr-FR')}
                        </span>
                        {req.proposedBudget && (
                          <span className="text-amber-400 font-semibold">
                            Budget : {req.proposedBudget.toLocaleString('fr-FR')} {req.currency || 'MGA'}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          {req.impressionsCount} vues
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panneau de détails & conversation */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-5">
            {selectedRequest ? (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Détail de la campagne
                  </div>
                  <h3 className="text-base font-bold text-zinc-100 mt-1">
                    {selectedRequest.partner.name}
                  </h3>
                  <p className="text-xs text-zinc-400">Événement : {selectedRequest.event.titleFr}</p>
                </div>

                {/* Emplacements demandés */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-zinc-400">Emplacements sollicités :</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRequest.placements.map((p) => (
                      <span
                        key={p.placement.id}
                        className="px-2.5 py-1 bg-zinc-800 text-xs font-medium text-zinc-200 rounded-md border border-zinc-700"
                      >
                        {p.placement.nameFr}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800 text-center">
                  <div>
                    <div className="text-xs text-zinc-500">Impressions</div>
                    <div className="text-base font-bold text-zinc-100">
                      {selectedRequest.impressionsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Clics</div>
                    <div className="text-base font-bold text-emerald-400">
                      {selectedRequest.clicksCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Inscrits</div>
                    <div className="text-base font-bold text-amber-400">
                      {selectedRequest.conversionsCount}
                    </div>
                  </div>
                </div>

                {/* Actions de statut */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="text-xs font-medium text-zinc-400">Changer le statut :</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange('ACCEPTED')}
                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-500/30 transition text-center"
                    >
                      Accepter / Devis
                    </button>
                    <button
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange('SCHEDULED')}
                      className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium rounded-lg border border-blue-500/30 transition text-center"
                    >
                      Programmer
                    </button>
                    <button
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange('RUNNING')}
                      className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-medium rounded-lg border border-amber-500/30 transition text-center"
                    >
                      Lancer diffusion
                    </button>
                    <button
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange('REJECTED')}
                      className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium rounded-lg border border-red-500/30 transition text-center"
                    >
                      Refuser
                    </button>
                  </div>
                </div>

                {/* Fil de discussion */}
                <div className="space-y-3 pt-2 border-t border-zinc-800">
                  <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Fil de négociation avec l’organisateur
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {Array.isArray(selectedRequest.messages) && selectedRequest.messages.length > 0 ? (
                      selectedRequest.messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg text-xs ${
                            m.senderRole === 'ADMIN'
                              ? 'bg-emerald-950/30 border border-emerald-900/40 text-emerald-200 ml-4'
                              : 'bg-zinc-800 text-zinc-200 mr-4 border border-zinc-700/60'
                          }`}
                        >
                          <div className="font-semibold text-[10px] text-zinc-400 mb-0.5">
                            {m.senderName} ({m.senderRole})
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
                      placeholder="Votre réponse à l'organisateur..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <button
                      disabled={isSendingMessage || !newMessage.trim()}
                      onClick={handleSendMessage}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg transition"
                    >
                      {isSendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-500 space-y-2">
                <Megaphone className="w-8 h-8 mx-auto stroke-1 text-zinc-600" />
                <p className="text-sm font-medium text-zinc-400">Sélectionnez une demande</p>
                <p className="text-xs">Cliquez sur une campagne à gauche pour consulter son suivi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
