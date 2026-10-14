'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
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
  RotateCcw,
  Copy,
  Trash2,
  Smartphone,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  TesterStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  PENDING: {
    label: 'En attente',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/25',
  },
  APPROVED: {
    label: 'Approuvé',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/25',
  },
  INVITED: {
    label: 'Invité (Envoyé)',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/25',
  },
  REJECTED: {
    label: 'Refusé',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/25',
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

  // Modales
  const [inviteModalTester, setInviteModalTester] = useState<BetaTester | null>(null);
  const [inviteWebLink, setInviteWebLink] = useState(DEFAULT_PLAY_WEB_LINK);
  const [inviteAppLink, setInviteAppLink] = useState(DEFAULT_PLAY_APP_LINK);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const [isBulkInviteModalOpen, setIsBulkInviteModalOpen] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);

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
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des testeurs.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, search, page, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (id: string, newStatus: TesterStatus) => {
    try {
      await betaTestersService.updateStatus(id, newStatus);
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus].label}`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de mise à jour du statut.';
      toast.error(msg);
    }
  };

  const handleDelete = async (tester: BetaTester) => {
    if (!confirm(`Supprimer ${tester.email} de la liste ?`)) return;
    try {
      await betaTestersService.deleteTester(tester.id);
      toast.success('Testeur supprimé.');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de suppression.';
      toast.error(msg);
    }
  };

  const openInviteModal = (tester: BetaTester) => {
    setInviteModalTester(tester);
    setInviteWebLink(tester.playLinkSent || DEFAULT_PLAY_WEB_LINK);
    setInviteAppLink(DEFAULT_PLAY_APP_LINK);
  };

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
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi.";
      toast.error(msg);
    } finally {
      setIsSendingInvite(false);
    }
  };

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
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi groupé.";
      toast.error(msg);
    } finally {
      setIsSendingBulk(false);
    }
  };

  const openExportModal = async (statusFilter?: TesterStatus) => {
    try {
      const res = await betaTestersService.exportEmails(statusFilter);
      setExportedEmailsText(res.commaSeparated);
      setExportedCount(res.count);
      setIsExportModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'exportation des emails.";
      toast.error(msg);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Emails copiés dans le presse-papier !');
  };

  return (
    <AdminShell>
      <div className="space-y-5 max-w-5xl mx-auto pb-12">
        {/* En-tête de page standardisé */}
        <PageHeader
          title="Bêta-Testeurs Google Play"
          description="Validation des candidatures, comptes Gmail et distribution des liens du test fermé."
          icon={Smartphone}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => openExportModal(selectedStatus === 'ALL' ? undefined : selectedStatus)}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Copier les emails pour la Google Play Console"
              >
                <Copy size={13} className="text-[var(--accent)]" />
                <span>Exporter Google Play</span>
              </button>

              {stats.approved > 0 && (
                <button
                  onClick={() => setIsBulkInviteModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Send size={13} />
                  <span>Inviter les {stats.approved} approuvés</span>
                </button>
              )}

              <button
                onClick={loadData}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer shadow-xs"
                title="Actualiser"
              >
                <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          }
        />

        {/* 5 Métriques & Filtres instantanés */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => { setSelectedStatus('ALL'); setPage(1); }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStatus === 'ALL'
                ? 'border-[var(--accent)] bg-[var(--accent-light)] shadow-xs'
                : 'border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Total</span>
              <Users size={12} />
            </div>
            <div className="text-base font-bold font-mono text-[var(--foreground)] mt-0.5">{stats.total}</div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedStatus('PENDING'); setPage(1); }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStatus === 'PENDING'
                ? 'border-amber-500 bg-amber-500/10 shadow-xs'
                : 'border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>En attente</span>
              <Clock size={12} className="text-amber-500" />
            </div>
            <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{stats.pending}</div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedStatus('APPROVED'); setPage(1); }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStatus === 'APPROVED'
                ? 'border-blue-500 bg-blue-500/10 shadow-xs'
                : 'border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Approuvés</span>
              <CheckCircle2 size={12} className="text-blue-500" />
            </div>
            <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">{stats.approved}</div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedStatus('INVITED'); setPage(1); }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStatus === 'INVITED'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                : 'border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Invités</span>
              <Send size={12} className="text-emerald-500" />
            </div>
            <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.invited}</div>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedStatus('REJECTED'); setPage(1); }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStatus === 'REJECTED'
                ? 'border-rose-500 bg-rose-500/10 shadow-xs'
                : 'border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Refusés</span>
              <XCircle size={12} className="text-rose-500" />
            </div>
            <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">{stats.rejected}</div>
          </button>
        </div>

        {/* Barre de recherche compacte */}
        <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={14} className="text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par email, nom ou modèle de smartphone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="text-xs text-[var(--text-muted)] shrink-0 font-medium">
            {testers.length} affichés sur {stats.total} testeurs
          </div>
        </div>

        {/* Tableau épuré des testeurs */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
              <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
              <span className="text-xs">Chargement des testeurs...</span>
            </div>
          ) : testers.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)]">
              <Smartphone size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">Aucun testeur ne correspond à vos critères</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] font-semibold text-[11px]">
                    <th className="px-4 py-2.5">Candidat &amp; Google Account</th>
                    <th className="px-4 py-2.5">Smartphone</th>
                    <th className="px-4 py-2.5">Statut</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {testers.map((t) => {
                    const statusObj = STATUS_CONFIG[t.status];
                    return (
                      <tr key={t.id} className="hover:bg-[var(--card-hover)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[var(--foreground)]">{t.fullName || 'Anonyme'}</div>
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                            <span>{t.email}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(t.email);
                                toast.success('Email copié !');
                              }}
                              className="text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5"
                              title="Copier l'email"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[var(--foreground)]">
                            <Smartphone size={12} className="text-[var(--text-muted)]" />
                            <span>{t.deviceModel || 'Non spécifié'}</span>
                          </div>
                          {t.androidVersion && (
                            <div className="text-[10px] text-[var(--text-muted)] ml-4 mt-0.5">{t.androidVersion}</div>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value as TesterStatus)}
                            className={`text-[11px] font-semibold rounded-md px-2 py-0.5 border cursor-pointer outline-none ${statusObj.bg} ${statusObj.text} ${statusObj.border}`}
                          >
                            <option value="PENDING">En attente</option>
                            <option value="APPROVED">Approuvé</option>
                            <option value="INVITED">Invité (Envoyé)</option>
                            <option value="REJECTED">Refusé</option>
                          </select>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                          {new Date(t.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openInviteModal(t)}
                              className="px-2 py-1 rounded text-[11px] font-medium border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] flex items-center gap-1 transition cursor-pointer"
                              title="Envoyer les liens Play Store"
                            >
                              <Send size={11} className="text-[var(--accent)]" />
                              <span>{t.status === 'INVITED' ? 'Renvoyer' : 'Inviter'}</span>
                            </button>

                            <button
                              onClick={() => handleDelete(t)}
                              className="p-1 rounded text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination compacte */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[var(--card-border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Page {page} sur {totalPages}</span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-2.5 py-1 rounded border border-[var(--card-border)] bg-[var(--input-bg)] disabled:opacity-40 cursor-pointer"
                >
                  Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-2.5 py-1 rounded border border-[var(--card-border)] bg-[var(--input-bg)] disabled:opacity-40 cursor-pointer"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALE INVITATION INDIVIDUELLE ──────────────────────────── */}
      {inviteModalTester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="text-xs font-bold text-[var(--foreground)]">Envoyer l&apos;invitation Play Store</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">{inviteModalTester.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalTester(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--foreground)]">Lien Web d&apos;acceptation (Étape 1) *</label>
                <input
                  type="text"
                  value={inviteWebLink}
                  onChange={(e) => setInviteWebLink(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--foreground)]">Lien direct Play Store (Étape 2) *</label>
                <input
                  type="text"
                  value={inviteAppLink}
                  onChange={(e) => setInviteAppLink(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setInviteModalTester(null)}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={isSendingInvite}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-xs"
              >
                {isSendingInvite ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>{isSendingInvite ? 'Envoi...' : "Envoyer l'email"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE INVITATION GROUPÉE ───────────────────────────────── */}
      {isBulkInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="text-xs font-bold text-[var(--foreground)]">Invitation groupée Play Store</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Diffusion aux {stats.approved} testeurs ayant le statut « Approuvé ».
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkInviteModalOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--foreground)]">Lien Web d&apos;acceptation</label>
                <input
                  type="text"
                  value={inviteWebLink}
                  onChange={(e) => setInviteWebLink(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--foreground)]">Lien direct Play Store</label>
                <input
                  type="text"
                  value={inviteAppLink}
                  onChange={(e) => setInviteAppLink(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setIsBulkInviteModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleBulkInvite}
                disabled={isSendingBulk}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-xs"
              >
                {isSendingBulk ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>{isSendingBulk ? 'Envoi en cours...' : `Envoyer aux ${stats.approved} testeurs`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE EXPORT GOOGLE PLAY ───────────────────────────────── */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
              <div>
                <h3 className="text-xs font-bold text-[var(--foreground)]">Export pour Google Play Console</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{exportedCount} adresses email séparées par des virgules</p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <textarea
              readOnly
              rows={8}
              value={exportedEmailsText}
              className="w-full p-3 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] font-mono text-[11px] leading-relaxed select-all"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
              <span className="text-[11px] text-[var(--text-muted)]">Collez directement dans la section « Test fermé » de Google Play</span>
              <button
                type="button"
                onClick={() => copyToClipboard(exportedEmailsText)}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-xs"
              >
                <Copy size={13} />
                <span>Copier la liste</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
