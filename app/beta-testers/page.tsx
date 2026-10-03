'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useToast } from '@/lib/hooks/useToast';
import {
  betaTestersService,
  BetaTester,
  BetaTesterStats,
  TesterStatus,
} from '@/services/beta-testers.service';
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  XCircle,
  Search,
  RefreshCw,
  Copy,
  Download,
  Trash2,
  Check,
  Smartphone,
  Loader2,
  X,
  Play,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  TesterStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: 'En attente',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  APPROVED: {
    label: 'Approuvé',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  INVITED: {
    label: 'Invité (Lien envoyé)',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  REJECTED: {
    label: 'Refusé',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
};

const DEFAULT_PLAY_WEB_LINK =
  'https://play.google.com/apps/testing/com.devengalere.kantomg';
const DEFAULT_PLAY_APP_LINK =
  'https://play.google.com/store/apps/details?id=com.devengalere.kantomg';

export default function BetaTestersPage() {
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [stats, setStats] = useState<BetaTesterStats>({
    total: 0,
    pending: 0,
    approved: 0,
    invited: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TesterStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modale d'envoi individuel
  const [inviteModalTester, setInviteModalTester] = useState<BetaTester | null>(null);
  const [inviteWebLink, setInviteWebLink] = useState(DEFAULT_PLAY_WEB_LINK);
  const [inviteAppLink, setInviteAppLink] = useState(DEFAULT_PLAY_APP_LINK);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Modale d'envoi groupé
  const [isBulkInviteModalOpen, setIsBulkInviteModalOpen] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Modale d'export Google Play
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportedEmailsText, setExportedEmailsText] = useState('');
  const [exportedCount, setExportedCount] = useState(0);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await betaTestersService.getTesters({
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: search.trim() || undefined,
        page,
        limit: 20,
      });

      setTesters(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur lors du chargement des testeurs.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, search, page, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Changer le statut d'un testeur
  const handleStatusChange = async (id: string, newStatus: TesterStatus) => {
    try {
      await betaTestersService.updateStatus(id, newStatus);
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus].label}`);
      loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut.';
      toast.error(msg);
    }
  };

  // Supprimer un testeur
  const handleDelete = async (tester: BetaTester) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer ${tester.email} de la liste des testeurs ?`
      )
    ) {
      return;
    }
    try {
      await betaTestersService.deleteTester(tester.id);
      toast.success('Testeur supprimé avec succès.');
      loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur lors de la suppression.';
      toast.error(msg);
    }
  };

  // Ouvrir la modale d'envoi individuel
  const openInviteModal = (tester: BetaTester) => {
    setInviteModalTester(tester);
    setInviteWebLink(tester.playLinkSent || DEFAULT_PLAY_WEB_LINK);
    setInviteAppLink(DEFAULT_PLAY_APP_LINK);
  };

  // Envoyer l'invitation individuelle
  const handleSendInvite = async () => {
    if (!inviteModalTester) return;
    try {
      setIsSendingInvite(true);
      const res = await betaTestersService.sendPlayInvite(inviteModalTester.id, {
        playStoreWebLink: inviteWebLink,
        playStoreAppLink: inviteAppLink,
      });
      toast.success(res.message);
      setInviteModalTester(null);
      loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'envoi de l'invitation.";
      toast.error(msg);
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Envoyer l'invitation groupée à tous les testeurs approuvés
  const handleBulkInvite = async () => {
    try {
      setIsSendingBulk(true);
      const res = await betaTestersService.bulkInvite({
        playStoreWebLink: inviteWebLink,
        playStoreAppLink: inviteAppLink,
      });
      toast.success(res.message);
      setIsBulkInviteModalOpen(false);
      loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'envoi groupé.";
      toast.error(msg);
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Ouvrir la modale d'export Google Play
  const openExportModal = async (statusFilter?: TesterStatus) => {
    try {
      const res = await betaTestersService.exportEmails(statusFilter);
      setExportedEmailsText(res.commaSeparated);
      setExportedCount(res.count);
      setIsExportModalOpen(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'exportation des emails.";
      toast.error(msg);
    }
  };

  // Copier le texte d'export
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Liste des emails copiée dans le presse-papier !');
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* En-tête de page */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bêta-Testeurs Google Play
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Gestion des candidatures, validation des comptes Gmail et distribution des liens du test fermé Play Store.
            </p>
          </div>
        </div>
        {/* Cartes Métriques */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Inscrits</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('PENDING')}
            className={`cursor-pointer bg-slate-900/60 border rounded-xl p-4 flex items-center gap-3 transition-all ${
              selectedStatus === 'PENDING'
                ? 'border-amber-500/80 bg-amber-500/5'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">En Attente</p>
              <p className="text-xl font-bold text-amber-400">{stats.pending}</p>
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('APPROVED')}
            className={`cursor-pointer bg-slate-900/60 border rounded-xl p-4 flex items-center gap-3 transition-all ${
              selectedStatus === 'APPROVED'
                ? 'border-blue-500/80 bg-blue-500/5'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Approuvés</p>
              <p className="text-xl font-bold text-blue-400">{stats.approved}</p>
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('INVITED')}
            className={`cursor-pointer bg-slate-900/60 border rounded-xl p-4 flex items-center gap-3 transition-all ${
              selectedStatus === 'INVITED'
                ? 'border-emerald-500/80 bg-emerald-500/5'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Liens Envoyés</p>
              <p className="text-xl font-bold text-emerald-400">{stats.invited}</p>
            </div>
          </div>

          <div
            onClick={() => setSelectedStatus('REJECTED')}
            className={`cursor-pointer bg-slate-900/60 border rounded-xl p-4 flex items-center gap-3 transition-all ${
              selectedStatus === 'REJECTED'
                ? 'border-rose-500/80 bg-rose-500/5'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Refusés</p>
              <p className="text-xl font-bold text-rose-400">{stats.rejected}</p>
            </div>
          </div>
        </div>

        {/* Barre d'outils et actions */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
          {/* Recherche & Filtre */}
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par email, nom ou smartphone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as TesterStatus | 'ALL');
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Tous les statuts ({stats.total})</option>
              <option value="PENDING">En attente ({stats.pending})</option>
              <option value="APPROVED">Approuvés ({stats.approved})</option>
              <option value="INVITED">Invités / Liens envoyés ({stats.invited})</option>
              <option value="REJECTED">Refusés ({stats.rejected})</option>
            </select>
          </div>

          {/* Boutons d'actions majeures */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openExportModal(selectedStatus === 'ALL' ? undefined : selectedStatus)}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors"
              title="Copier les emails pour la Google Play Console"
            >
              <Copy className="w-4 h-4 text-emerald-400" />
              <span>Exporter Google Play</span>
            </button>

            {stats.approved > 0 && (
              <button
                onClick={() => setIsBulkInviteModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3.5 py-2 text-sm font-semibold shadow-sm shadow-emerald-950 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Inviter les {stats.approved} approuvés</span>
              </button>
            )}

            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
              title="Actualiser"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tableau des testeurs */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Candidat &amp; Google Account</th>
                  <th className="px-5 py-3.5">Smartphone Android</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">Date Inscription</th>
                  <th className="px-5 py-3.5">Envois Play Store</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                        <span>Chargement des testeurs...</span>
                      </div>
                    </td>
                  </tr>
                ) : testers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                      Aucun candidat testeur ne correspond aux critères sélectionnés.
                    </td>
                  </tr>
                ) : (
                  testers.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Candidat */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {t.fullName || 'Anonyme'}
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                          <span>{t.email}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(t.email);
                              toast.success('Email copié !');
                            }}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Copier l'email"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {t.notes && (
                          <div className="text-xs text-slate-400 italic mt-1 line-clamp-1">
                            « {t.notes} »
                          </div>
                        )}
                      </td>

                      {/* Appareil */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.deviceModel || 'Non spécifié'}</span>
                        </div>
                        {t.androidVersion && (
                          <div className="text-[11px] text-slate-500 ml-5 mt-0.5">
                            {t.androidVersion}
                          </div>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-4">
                        <select
                          value={t.status}
                          onChange={(e) =>
                            handleStatusChange(t.id, e.target.value as TesterStatus)
                          }
                          className={`text-xs font-semibold rounded-md px-2.5 py-1 border transition-colors cursor-pointer ${
                            STATUS_CONFIG[t.status].bg
                          } ${STATUS_CONFIG[t.status].text} ${
                            STATUS_CONFIG[t.status].border
                          } focus:outline-none`}
                        >
                          <option value="PENDING" className="bg-slate-900 text-white">
                            En attente
                          </option>
                          <option value="APPROVED" className="bg-slate-900 text-white">
                            Approuvé
                          </option>
                          <option value="INVITED" className="bg-slate-900 text-white">
                            Invité (Envoyé)
                          </option>
                          <option value="REJECTED" className="bg-slate-900 text-white">
                            Refusé
                          </option>
                        </select>
                      </td>

                      {/* Date Inscription */}
                      <td className="px-5 py-4 text-xs text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Envois Play Store */}
                      <td className="px-5 py-4">
                        {t.inviteCount > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                              <Check className="w-3 h-3" />
                              <span>{t.inviteCount} envoi(s)</span>
                            </span>
                            {t.invitedAt && (
                              <div className="text-[11px] text-slate-500">
                                Le{' '}
                                {new Date(t.invitedAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Jamais envoyé</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openInviteModal(t)}
                            className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors"
                            title="Envoyer le lien Google Play"
                          >
                            <Send className="w-3 h-3" />
                            <span>{t.inviteCount > 0 ? 'Renvoyer' : 'Inviter'}</span>
                          </button>

                          <button
                            onClick={() => handleDelete(t)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-950/60 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Affichage de {testers.length} sur {totalCount} testeur(s)
              </div>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-50 hover:bg-slate-800 text-slate-300"
                >
                  Précédent
                </button>
                <span className="px-3 py-1 text-slate-300 font-medium">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-50 hover:bg-slate-800 text-slate-300"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODALE D'ENVOI INDIVIDUEL GOOGLE PLAY ────────────────────────────── */}
      {inviteModalTester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Envoyer l&apos;accès Google Play
                  </h3>
                  <p className="text-xs text-slate-400">
                    Destinataire : {inviteModalTester.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInviteModalTester(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lien Web d&apos;invitation (Closed Testing)
                </label>
                <input
                  type="text"
                  value={inviteWebLink}
                  onChange={(e) => setInviteWebLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Lien sur lequel le testeur clique pour accepter le programme avec son compte Google.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lien direct Google Play Store (App)
                </label>
                <input
                  type="text"
                  value={inviteAppLink}
                  onChange={(e) => setInviteAppLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  L&apos;email officiel sera envoyé via <strong>Resend</strong> avec le guide en 2 étapes illustré (acceptation du test + téléchargement sur le Play Store).
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-2.5 bg-slate-950/40">
              <button
                onClick={() => setInviteModalTester(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                disabled={isSendingInvite}
                onClick={handleSendInvite}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              >
                {isSendingInvite ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirmer et Envoyer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALE D'ENVOI GROUPÉ ────────────────────────────────────────────── */}
      {isBulkInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="font-bold text-white text-base">
                Envoi groupé d&apos;invitations ({stats.approved} testeurs)
              </h3>
              <button
                onClick={() => setIsBulkInviteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-300">
                Vous êtes sur le point d&apos;envoyer l&apos;e-mail officiel d&apos;invitation Google Play à l&apos;ensemble des{' '}
                <strong className="text-emerald-400">{stats.approved} testeurs actuellement approuvés</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lien de test Play Store utilisé
                </label>
                <input
                  type="text"
                  value={inviteWebLink}
                  onChange={(e) => setInviteWebLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
                ⚠️ Assurez-vous d&apos;avoir d&apos;abord ajouté ces adresses email dans votre liste de testeurs sur la <strong>Google Play Console</strong> afin qu&apos;ils puissent y accéder dès réception du mail.
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-2.5 bg-slate-950/40">
              <button
                onClick={() => setIsBulkInviteModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                disabled={isSendingBulk}
                onClick={handleBulkInvite}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
              >
                {isSendingBulk ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Distribution en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Lancer la distribution</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALE D'EXPORTATION GOOGLE PLAY CONSOLE ──────────────────────────── */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="font-bold text-white text-base">
                  Export Google Play Console ({exportedCount} emails)
                </h3>
                <p className="text-xs text-slate-400">
                  Format séparé par des virgules pour copier/coller direct
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                Dans Google Play Console &gt; <em>Tests fermés</em> &gt; <em>Gérer les testeurs</em> &gt; Créez ou modifiez votre liste et collez simplement les adresses ci-dessous :
              </p>

              <textarea
                readOnly
                value={exportedEmailsText}
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(exportedEmailsText)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copier tous les emails</span>
                </button>

                <button
                  onClick={() => {
                    const blob = new Blob([exportedEmailsText], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `kanto-beta-testers-${new Date().toISOString().slice(0, 10)}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger .txt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
