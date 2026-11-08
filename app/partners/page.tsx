'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useToast } from '@/lib/hooks/useToast';
import {
  partnersAdminService,
  PartnerItem,
  PartnerStatus,
} from '@/services/partners.service';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  KeyRound,
  Calendar,
  Layers,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Ban,
} from 'lucide-react';

export default function PartnersAdminPage() {
  const { toast } = useToast();

  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal modération
  const [selectedPartner, setSelectedPartner] = useState<PartnerItem | null>(null);
  const [modalAction, setModalAction] = useState<'VERIFY' | 'REJECT' | 'SUSPEND' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await partnersAdminService.getPartners({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as PartnerStatus) : undefined,
        page,
        limit: 15,
      });
      setPartners(res.items || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de récupérer les partenaires.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page, toast]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleAction = async () => {
    if (!selectedPartner || !modalAction) return;

    let targetStatus: PartnerStatus;
    if (modalAction === 'VERIFY') targetStatus = 'VERIFIED';
    else if (modalAction === 'REJECT') targetStatus = 'REJECTED';
    else targetStatus = 'SUSPENDED';

    if (modalAction === 'REJECT' && !rejectionReason.trim()) {
      toast.warning('Veuillez préciser la raison du rejet pour informer l’organisation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await partnersAdminService.verifyPartner(selectedPartner.id, {
        status: targetStatus,
        rejectionReason: rejectionReason.trim() || undefined,
      });

      toast.success(`Le partenaire ${selectedPartner.name} est maintenant : ${targetStatus}`);

      setSelectedPartner(null);
      setModalAction(null);
      setRejectionReason('');
      fetchPartners();
    } catch (err: any) {
      toast.error(err?.message || 'Une erreur est survenue lors de la mise à jour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: PartnerStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Vérifié & Actif
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> En attente de validation
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" /> Suspendu
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" /> Refusé
          </span>
        );
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Organisations Partenaires & API</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gestion des associations, entreprises et tiers autorisés à publier des événements et utiliser l'API Partenaires.
          </p>
        </div>
        {/* Barre de contrôle et filtres */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, identifiant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING_VERIFICATION">En attente de validation</option>
              <option value="VERIFIED">Vérifiés (Actifs)</option>
              <option value="SUSPENDED">Suspendus</option>
              <option value="REJECTED">Refusés</option>
            </select>

            <button
              onClick={fetchPartners}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Tableau des partenaires */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm">Chargement des organisations partenaires...</p>
            </div>
          ) : partners.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Building2 className="w-10 h-10 text-zinc-600 stroke-1" />
              <p className="text-base font-medium text-zinc-300">Aucun partenaire trouvé</p>
              <p className="text-sm">Modifiez vos critères de recherche ou réinitialisez le filtre.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-zinc-800/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-3.5">Organisation</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Statut</th>
                    <th className="px-4 py-3.5 text-center">Événements</th>
                    <th className="px-4 py-3.5 text-center">Clés API</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {partners.map((partner) => (
                    <tr key={partner.id} className="hover:bg-zinc-800/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-bold shrink-0">
                            {partner.logoUrl ? (
                              <img
                                src={partner.logoUrl}
                                alt={partner.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              partner.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-100 flex items-center gap-2">
                              {partner.name}
                              {partner.websiteUrl && (
                                <a
                                  href={partner.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-zinc-500 hover:text-emerald-400 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">
                              /partners/{partner.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-zinc-400">
                        {partner.type}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-zinc-200">{partner.email}</div>
                        {partner.phone && (
                          <div className="text-xs text-zinc-500">{partner.phone}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(partner.status)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-300 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          {partner._count?.events || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-300 font-medium">
                          <KeyRound className="w-3.5 h-3.5 text-amber-500/80" />
                          {partner._count?.apiKeys || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {partner.status !== 'VERIFIED' && (
                            <button
                              onClick={() => {
                                setSelectedPartner(partner);
                                setModalAction('VERIFY');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium rounded-md border border-emerald-500/30 transition flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Valider
                            </button>
                          )}
                          {partner.status !== 'SUSPENDED' && (
                            <button
                              onClick={() => {
                                setSelectedPartner(partner);
                                setModalAction('SUSPEND');
                              }}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md border border-zinc-700 transition flex items-center gap-1"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-400" />
                              Suspendre
                            </button>
                          )}
                          {partner.status !== 'REJECTED' && (
                            <button
                              onClick={() => {
                                setSelectedPartner(partner);
                                setModalAction('REJECT');
                              }}
                              className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium rounded-md border border-red-500/30 transition flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Rejeter
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400">
              <div>
                Total : <span className="text-zinc-200 font-semibold">{total}</span> organisations
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

        {/* Modal de décision de modération */}
        {selectedPartner && modalAction && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  {modalAction === 'VERIFY' && (
                    <>
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Valider l’organisation partenaire
                    </>
                  )}
                  {modalAction === 'SUSPEND' && (
                    <>
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      Suspendre le compte partenaire
                    </>
                  )}
                  {modalAction === 'REJECT' && (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      Rejeter le dossier partenaire
                    </>
                  )}
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Organisation :{' '}
                  <span className="font-semibold text-zinc-200">{selectedPartner.name}</span> (
                  {selectedPartner.email})
                </p>
              </div>

              {modalAction === 'VERIFY' && (
                <p className="text-sm text-zinc-300 leading-relaxed bg-emerald-950/20 border border-emerald-900/30 p-3.5 rounded-xl">
                  En validant ce partenaire, il aura accès à son espace organisateur, pourra générer
                  des clés API en environnement Live et soumettre des événements pour modération.
                </p>
              )}

              {modalAction === 'SUSPEND' && (
                <p className="text-sm text-zinc-300 leading-relaxed bg-amber-950/20 border border-amber-900/30 p-3.5 rounded-xl">
                  La suspension révoquera temporairement l'accès de l'organisation à l'API et
                  désactivera la synchronisation de ses événements publics.
                </p>
              )}

              {modalAction === 'REJECT' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Motif du rejet (obligatoire)
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Justificatif d’association manquant ou coordonnées professionnelles non vérifiables..."
                    className="w-full p-3 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setSelectedPartner(null);
                    setModalAction(null);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg border border-zinc-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleAction}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                    modalAction === 'VERIFY'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                      : modalAction === 'SUSPEND'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modalAction === 'VERIFY'
                    ? 'Confirmer la validation'
                    : modalAction === 'SUSPEND'
                    ? 'Confirmer la suspension'
                    : 'Confirmer le rejet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
