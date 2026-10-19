'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/lib/hooks/useToast';
import {
  emailsService,
  EmailLogItem,
  EmailStats,
  EmailDeliveryStatus,
  EmailSuppressionItem,
} from '@/services/emails.service';
import {
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Search,
  RotateCcw,
  Copy,
  Send,
  Trash2,
  Loader2,
  ShieldCheck,
  Ban,
  X,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  EmailDeliveryStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  PENDING: {
    label: 'En attente',
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-600 dark:text-zinc-400',
    border: 'border-zinc-500/20',
    icon: Clock,
  },
  ACCEPTED: {
    label: 'Accepté Resend',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/25',
    icon: Send,
  },
  SENT: {
    label: 'Expédié',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/25',
    icon: Send,
  },
  DELIVERED: {
    label: 'Livré',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/25',
    icon: CheckCircle2,
  },
  DELIVERY_DELAYED: {
    label: 'Retardé',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/25',
    icon: Clock,
  },
  BOUNCED: {
    label: 'Rebond / Rejeté',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/25',
    icon: AlertTriangle,
  },
  COMPLAINED: {
    label: 'Plainte Spam',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/25',
    icon: ShieldAlert,
  },
  FAILED: {
    label: 'Échec',
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/25',
    icon: XCircle,
  },
};

const TEMPLATE_LABELS: Record<string, string> = {
  WELCOME: 'Bienvenue',
  VERIFICATION: 'Vérification',
  PASSWORD_RESET: 'Mot de passe oublié',
  SECURITY_CHANGE: 'Sécurité du compte',
  BETA_TESTER_REGISTRATION: 'Bêta : Candidature',
  BETA_TESTER_INVITATION: 'Bêta : Invitation',
  CONTRIBUTION_APPROVED: 'Contribution publiée',
  CONTRIBUTION_STATUS_UPDATE: 'Statut contribution',
  MODERATION_ALERT: 'Alerte modération',
  VIP_GRANTED: '👑 VIP : Attribution',
  VIP_EXTENDED: '🎉 VIP : Prolongation',
  VIP_EXPIRING_SOON: '⏳ VIP : Expiration imminente',
  VIP_EXPIRED: 'VIP : Expiré',
  USER_BANNED: '🚫 Compte suspendu',
  USER_UNBANNED: '✅ Compte réactivé',
  ACCOUNT_DELETION: 'Suppression RGPD',
  TRANSACTIONAL: 'Transactionnel',
};

export default function EmailsAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'history' | 'suppressions'>('history');


  // État de l'historique
  const [emails, setEmails] = useState<EmailLogItem[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    statusCounts: {
      pending: 0,
      accepted: 0,
      sent: 0,
      delivered: 0,
      delayed: 0,
      bounced: 0,
      complained: 0,
      failed: 0,
    },
    suppressionsCount: 0,
    deliveryRate: 100,
    bounceRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<EmailDeliveryStatus | 'ALL'>('ALL');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // État des suppressions
  const [suppressions, setSuppressions] = useState<EmailSuppressionItem[]>([]);
  const [suppressionSearch, setSuppressionSearch] = useState('');
  const [isSuppressionsLoading, setIsSuppressionsLoading] = useState(false);

  // Modale de détail
  const [detailEmail, setDetailEmail] = useState<EmailLogItem | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Chargement des données d'emails
  const loadEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const [emailData, statsData] = await Promise.all([
        emailsService.getEmails({
          status: selectedStatus,
          templateType: selectedTemplate,
          search: search.trim() || undefined,
          page,
          limit: 20,
        }),
        emailsService.getEmailStats(),
      ]);

      setEmails(emailData.items);
      setTotalPages(emailData.pagination.totalPages);
      setStats(statsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger les e-mails.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedTemplate, search, page, toast]);

  // Chargement des suppressions
  const loadSuppressions = useCallback(async () => {
    setIsSuppressionsLoading(true);
    try {
      const data = await emailsService.getSuppressions({
        search: suppressionSearch.trim() || undefined,
      });
      setSuppressions(data.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger la liste d’exclusion.';
      toast.error(msg);
    } finally {
      setIsSuppressionsLoading(false);
    }
  }, [suppressionSearch, toast]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadEmails();
    } else {
      loadSuppressions();
    }
  }, [activeTab, loadEmails, loadSuppressions]);

  // Relance manuelle sécurisée
  const handleRetry = async (log: EmailLogItem) => {
    if (log.status === 'DELIVERED') {
      toast.error('Ce message est déjà accusé comme livré.');
      return;
    }

    setRetryingId(log.id);
    try {
      await emailsService.retryEmail(log.id);
      toast.success(`Relance programmée avec succès vers ${log.recipient}.`);
      await loadEmails();
      if (detailEmail?.id === log.id) {
        const updated = await emailsService.getEmailDetail(log.id);
        setDetailEmail(updated);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la relance.';
      toast.error(msg);
    } finally {
      setRetryingId(null);
    }
  };

  // Suppression d'exclusion
  const handleRemoveSuppression = async (email: string) => {
    if (!confirm(`Souhaitez-vous réintégrer l'adresse "${email}" pour qu'elle puisse à nouveau recevoir des e-mails ?`)) {
      return;
    }

    try {
      await emailsService.removeSuppression(email);
      toast.success(`L'adresse ${email} a été réintégrée avec succès.`);
      await loadSuppressions();
      await emailsService.getEmailStats().then(setStats).catch(() => null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la réintégration.';
      toast.error(msg);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier.`);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <PageHeader
          title="E-mails Transactionnels"
          description="Supervision de la délivrabilité Resend, traçabilité des envois et protection de la réputation du domaine."
          actions={
            <button
              onClick={() => (activeTab === 'history' ? loadEmails() : loadSuppressions())}
              disabled={isLoading || isSuppressionsLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading || isSuppressionsLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          }
        />


        {/* Cartes de métriques de délivrabilité */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total e-mails</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{stats.total}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Historique complet</div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Taux de livraison
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300 mt-1">
              {stats.deliveryRate}%
            </div>
            <div className="text-[11px] text-emerald-600/70 mt-0.5">
              {stats.statusCounts.delivered} livrés avec succès
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 shadow-sm">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Acceptés Resend
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-1">
              {stats.statusCounts.accepted + stats.statusCounts.sent}
            </div>
            <div className="text-[11px] text-blue-600/70 mt-0.5">Pris en charge par le fournisseur</div>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 shadow-sm">
            <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Rejets / Bounces
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-300 mt-1">
              {stats.statusCounts.bounced}
            </div>
            <div className="text-[11px] text-rose-600/70 mt-0.5">Taux de rebond : {stats.bounceRate}%</div>
          </div>

          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 shadow-sm">
            <div className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> En échec
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-300 mt-1">
              {stats.statusCounts.failed}
            </div>
            <div className="text-[11px] text-red-600/70 mt-0.5">Relançables manuellement</div>
          </div>

          <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 shadow-sm">
            <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> Exclusions
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-300 mt-1">
              {stats.suppressionsCount}
            </div>
            <div className="text-[11px] text-purple-600/70 mt-0.5">Adresses bloquées</div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-semibold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            Historique des messages ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('suppressions')}
            className={`pb-3 text-sm font-semibold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'suppressions'
                ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            <Ban className="w-4 h-4" />
            Liste d’exclusion & Rejetés ({stats.suppressionsCount})
          </button>
        </div>

        {/* ONGLET 1 : HISTORIQUE DES MESSAGES */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Barre de filtres */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Rechercher par destinataire, objet ou identifiant Resend..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Filtre Statut */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as EmailDeliveryStatus | 'ALL');
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">En attente (PENDING)</option>
                <option value="ACCEPTED">Accepté par Resend</option>
                <option value="SENT">Expédié (SENT)</option>
                <option value="DELIVERED">Livré (DELIVERED)</option>
                <option value="DELIVERY_DELAYED">Retardé</option>
                <option value="BOUNCED">Rebond / Rejeté</option>
                <option value="COMPLAINED">Plainte pour spam</option>
                <option value="FAILED">En échec (FAILED)</option>
              </select>

              {/* Filtre Modèle */}
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Tous les modèles</option>
                <option value="WELCOME">Bienvenue</option>
                <option value="VERIFICATION">Vérification e-mail</option>
                <option value="PASSWORD_RESET">Mot de passe oublié</option>
                <option value="SECURITY_CHANGE">Sécurité du compte</option>
                <option value="BETA_TESTER_REGISTRATION">Bêta : Candidature</option>
                <option value="BETA_TESTER_INVITATION">Bêta : Invitation Play</option>
                <option value="CONTRIBUTION_APPROVED">Contribution validée</option>
                <option value="CONTRIBUTION_STATUS_UPDATE">Statut contribution</option>
                <option value="MODERATION_ALERT">Alerte modération</option>
                <option value="ACCOUNT_DELETION">Suppression RGPD</option>
              </select>
            </div>

            {/* Tableau des messages */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Destinataire</th>
                      <th className="py-3 px-4 font-semibold">Modèle & Objet</th>
                      <th className="py-3 px-4 font-semibold">Statut Resend</th>
                      <th className="py-3 px-4 font-semibold">Date & Heure</th>
                      <th className="py-3 px-4 font-semibold text-center">Tentatives</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                          Chargement des e-mails en cours...
                        </td>
                      </tr>
                    ) : emails.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-400">
                          <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                          Aucun e-mail ne correspond à vos critères de recherche.
                        </td>
                      </tr>
                    ) : (
                      emails.map((log) => {
                        const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.PENDING;
                        const StatusIcon = statusCfg.icon;
                        const templateName = TEMPLATE_LABELS[log.templateType] || log.templateType;

                        return (
                          <tr
                            key={log.id}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                {log.recipient}
                              </div>
                              {log.recipientName && (
                                <div className="text-[11px] text-zinc-500">{log.recipientName}</div>
                              )}
                              {log.resendId && (
                                <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                                  <span>{log.resendId}</span>
                                  <button
                                    onClick={() => copyToClipboard(log.resendId!, 'ID Resend')}
                                    className="hover:text-zinc-600 dark:hover:text-zinc-200"
                                    title="Copier l'ID Resend"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 mb-1">
                                {templateName}
                              </span>
                              <div className="text-zinc-800 dark:text-zinc-200 font-medium truncate" title={log.subject}>
                                {log.subject}
                              </div>
                              {log.errorReason && (
                                <div className="text-[11px] text-red-500 truncate mt-0.5" title={log.errorReason}>
                                  {log.errorReason}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusCfg.label}
                              </span>
                              {log.bounceType && (
                                <div className="text-[10px] text-rose-500 font-medium mt-0.5">
                                  {log.bounceType} ({log.bounceSubtype || 'Général'})
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-zinc-500 text-[11px]">
                              <div>{new Date(log.createdAt).toLocaleDateString('fr-FR')}</div>
                              <div className="text-zinc-400">{new Date(log.createdAt).toLocaleTimeString('fr-FR')}</div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {log.attempts}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setDetailEmail(log)}
                                className="px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
                              >
                                Détails
                              </button>

                              {(log.status === 'FAILED' || (log.status === 'BOUNCED' && log.bounceType === 'Transient')) && (
                                <button
                                  onClick={() => handleRetry(log)}
                                  disabled={retryingId === log.id}
                                  className="px-2.5 py-1 text-xs rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium transition inline-flex items-center gap-1"
                                >
                                  {retryingId === log.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3 h-3" />
                                  )}
                                  Relancer
                                </button>
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
              {totalPages > 1 && (
                <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                  <div>
                    Page {page} sur {totalPages}
                  </div>
                  <div className="space-x-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 2 : LISTE D'EXCLUSION & SUPPRESSIONS */}
        {activeTab === 'suppressions' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-purple-900 dark:text-purple-300">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Protection automatique de la délivrabilité
              </div>
              Les adresses ci-dessous sont automatiquement exclues des envois suite à un rebond permanent (boîte inexistante) ou à une plainte pour spam signalée par le destinataire. Les messages transactionnels non critiques sont bloqués en amont pour éviter toute dégradation de réputation chez Resend.
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Rechercher une adresse e-mail bloquée..."
                  value={suppressionSearch}
                  onChange={(e) => setSuppressionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Adresse e-mail</th>
                    <th className="py-3 px-4 font-semibold">Motif d’exclusion</th>
                    <th className="py-3 px-4 font-semibold">Détails enregistrés</th>
                    <th className="py-3 px-4 font-semibold">Date d’exclusion</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {isSuppressionsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                        Chargement de la liste d’exclusion...
                      </td>
                    </tr>
                  ) : suppressions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                        Aucune adresse n’est actuellement bloquée. Excellente réputation de délivrabilité !
                      </td>
                    </tr>
                  ) : (
                    suppressions.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                        <td className="py-3 px-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                          {item.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            {item.reason === 'BOUNCE_PERMANENT'
                              ? 'Rebond permanent (Hard Bounce)'
                              : item.reason === 'COMPLAINT'
                              ? 'Plainte pour spam'
                              : item.reason}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 max-w-sm truncate" title={item.details || ''}>
                          {item.details || '—'}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(item.createdAt).toLocaleTimeString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRemoveSuppression(item.email)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
                            title="Réintégrer cette adresse"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                            Réintégrer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODALE DE DÉTAIL D'UN E-MAIL & TIMELINE ÉVÉNEMENTS */}
        {detailEmail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header de la modale */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Détails du message transactionnel
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Identifiant : {detailEmail.id}</p>
                </div>
                <button
                  onClick={() => setDetailEmail(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                {/* Résumé principal */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <span className="text-zinc-400 text-[11px] block">Destinataire :</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {detailEmail.recipient}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[11px] block">Expéditeur :</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                      {detailEmail.from}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[11px] block">Objet :</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                      {detailEmail.subject}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 text-[11px] block">Identifiant Resend :</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                      {detailEmail.resendId || 'Non attribué'}
                      {detailEmail.resendId && (
                        <button
                          onClick={() => copyToClipboard(detailEmail.resendId!, 'ID Resend')}
                          className="hover:text-zinc-900"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  </div>
                </div>

                {/* Statut & Erreur éventuelle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-medium">Statut de distribution :</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        STATUS_CONFIG[detailEmail.status]?.bg
                      } ${STATUS_CONFIG[detailEmail.status]?.text} ${
                        STATUS_CONFIG[detailEmail.status]?.border
                      }`}
                    >
                      {STATUS_CONFIG[detailEmail.status]?.label}
                    </span>
                  </div>
                  <div className="text-zinc-400 text-[11px]">
                    Tentatives : {detailEmail.attempts}
                  </div>
                </div>

                {detailEmail.errorReason && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                    <div className="font-semibold text-xs mb-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Motif de rejet / échec :
                    </div>
                    <div className="text-[11px]">{detailEmail.errorReason}</div>
                  </div>
                )}

                {/* Timeline des événements Resend */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    Chronologie des événements de distribution
                  </h4>

                  {(!detailEmail.events || detailEmail.events.length === 0) ? (
                    <div className="p-4 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                      Aucun événement webhook n’a encore été reçu pour ce message.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 border-l-2 border-zinc-200 dark:border-zinc-800 ml-2">
                      {detailEmail.events.map((ev, idx) => (
                        <div key={idx} className="relative">
                          {/* Point sur la timeline */}
                          <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 bg-emerald-500" />
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                              <span>{ev.type}</span>
                              <span className="text-[10px] text-zinc-400 font-normal">
                                {new Date(ev.at).toLocaleDateString('fr-FR')} à{' '}
                                {new Date(ev.at).toLocaleTimeString('fr-FR')}
                              </span>
                            </div>
                            {ev.note && <div className="text-[11px] text-zinc-500 mt-0.5">{ev.note}</div>}
                            {ev.error && <div className="text-[11px] text-red-500 mt-0.5">{ev.error}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Métadonnées métier (sans secrets) */}
                {detailEmail.metadata && Object.keys(detailEmail.metadata).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2">
                      Contexte métier associé
                    </h4>
                    <pre className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-700 dark:text-zinc-300 font-mono overflow-x-auto">
                      {JSON.stringify(detailEmail.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 flex justify-between items-center">
                <span className="text-[11px] text-zinc-400">
                  Créé le {new Date(detailEmail.createdAt).toLocaleDateString('fr-FR')}
                </span>

                <div className="space-x-2">
                  {(detailEmail.status === 'FAILED' || (detailEmail.status === 'BOUNCED' && detailEmail.bounceType === 'Transient')) && (
                    <button
                      onClick={() => handleRetry(detailEmail)}
                      disabled={retryingId === detailEmail.id}
                      className="px-3 py-1.5 text-xs rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition inline-flex items-center gap-1.5 shadow-sm"
                    >
                      {retryingId === detailEmail.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      Relancer ce message
                    </button>
                  )}
                  <button
                    onClick={() => setDetailEmail(null)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
