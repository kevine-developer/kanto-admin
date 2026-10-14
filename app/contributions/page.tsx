'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal, Modal } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { contributionsService } from '@/services/contributions.service';
import {
  ContributionItem,
  ContributionStats,
  ContentReport,
  ContributionCategory,
  ContributionAuditLog,
} from '@/types/contribution';
import {
  HeartHandshake,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  User,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  Trash2,
  BookOpen,
  ScrollText,
  Mic,
  Quote,
  Target,
  Copy,
  History,
  FileEdit,
  Flag,
  Loader2,
} from 'lucide-react';

type TabType = 'pending' | 'duplicates' | 'reports';

const CATEGORY_CONFIG: Record<
  ContributionCategory,
  { label: string; icon: React.ElementType }
> = {
  KABARY: { label: 'Kabary', icon: Mic },
  PROVERBE: { label: 'Proverbe', icon: ScrollText },
  CITATION: { label: 'Citation', icon: Quote },
  CONTE: { label: 'Conte', icon: BookOpen },
};

/**
 * Page de modération des contributions citoyennes et gestion des signalements.
 * Version épurée et minimaliste avec KPIs condensés et hiérarchie UX claire.
 */
export default function AdminContributionsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [stats, setStats] = useState<ContributionStats>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalReportsPending: 0,
    approvedThisWeek: 0,
    weeklyTarget: 10,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [moderationFilter, setModerationFilter] = useState<'ALL' | 'FLAGGED' | 'CLEAN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'CHANGES_REQUESTED'>('ALL');

  // Modal de décision administrative (Rejet ou Demande de modifications avec motif)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    item: ContributionItem | null;
    type: 'REJECT' | 'REQUEST_CHANGES';
    reason: string;
  } | null>(null);

  // Modal d'historique d'audit
  const [auditModal, setAuditModal] = useState<{
    isOpen: boolean;
    item: ContributionItem | null;
    logs: ContributionAuditLog[];
    isLoading: boolean;
  } | null>(null);

  // Modal générique de confirmation
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'primary' | 'danger' | 'warning';
    action: () => Promise<void>;
  } | null>(null);

  // Modal de traitement de réclamation
  const [disputeModal, setDisputeModal] = useState<{
    isOpen: boolean;
    item: ContributionItem | null;
    approve: boolean;
    note: string;
  } | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pendingData, statsData, reportsData] = await Promise.all([
        contributionsService.getPending(),
        contributionsService.getStats(),
        contributionsService.getReports(),
      ]);

      setContributions(pendingData);
      setStats(statsData);
      setReports(reportsData);
    } catch (err: unknown) {
      console.error('Erreur chargement admin contributions:', err);
      toast.error('Impossible de charger les données de modération.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Action : Valider une contribution (Approbation)
  const handleApprove = (item: ContributionItem) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Approuver la contribution',
      description: `Confirmez-vous l'approbation et l'intégration au catalogue officiel de la proposition de « ${item.userName || 'un membre'} » ? (+50 XP attribués)`,
      confirmText: 'Approuver & Publier',
      variant: 'primary',
      action: async () => {
        try {
          setIsProcessing(item.id);
          await contributionsService.validate(item.id, true);
          toast.success(
            `La contribution « ${item.title || item.content.slice(0, 30)} » a été approuvée et publiée.`
          );
          setContributions((prev) => prev.filter((c) => c.id !== item.id));
          const newStats = await contributionsService.getStats();
          setStats(newStats);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erreur lors de l approbation';
          toast.error(msg);
        } finally {
          setIsProcessing(null);
          setConfirmModalState(null);
        }
      },
    });
  };

  // Action : Soumettre une décision de rejet ou demande de modifications
  const handleSubmitDecision = async () => {
    if (!actionModal || !actionModal.item) return;
    if (!actionModal.reason.trim()) {
      toast.error('Veuillez spécifier un motif ou des consignes pour le contributeur.');
      return;
    }

    const item = actionModal.item;
    const isRequestChanges = actionModal.type === 'REQUEST_CHANGES';

    try {
      setIsProcessing(item.id);
      await contributionsService.validate(
        item.id,
        false,
        actionModal.reason.trim(),
        isRequestChanges
      );

      if (isRequestChanges) {
        toast.info(
          `Des modifications ont été demandées à l'auteur pour « ${item.title || item.content.slice(0, 30)} ».`
        );
      } else {
        toast.success(`La proposition a été rejetée. Le motif a été transmis à l'auteur.`);
      }

      setContributions((prev) => prev.filter((c) => c.id !== item.id));
      setActionModal(null);
      const newStats = await contributionsService.getStats();
      setStats(newStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l enregistrement de la décision';
      toast.error(msg);
    } finally {
      setIsProcessing(null);
    }
  };

  // Action : Ouvrir la vue de l'historique d'audit
  const handleOpenAuditModal = async (item: ContributionItem) => {
    setAuditModal({ isOpen: true, item, logs: [], isLoading: true });
    try {
      const logs = await contributionsService.getAuditLogs(item.id);
      setAuditModal((prev) => (prev ? { ...prev, logs, isLoading: false } : null));
    } catch (e) {
      console.error(e);
      setAuditModal((prev) => (prev ? { ...prev, isLoading: false } : null));
    }
  };

  // Action : Résoudre un signalement
  const handleResolveReport = (report: ContentReport) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Résoudre le signalement',
      description: `Confirmez-vous le traitement et la clôture définitive de ce signalement ?`,
      confirmText: 'Marquer comme résolu',
      variant: 'primary',
      action: async () => {
        try {
          setIsProcessing(report.id);
          await contributionsService.resolveReport(report.id);
          toast.success('Signalement marqué comme résolu.');
          setReports((prev) => prev.filter((r) => r.id !== report.id));
          const newStats = await contributionsService.getStats();
          setStats(newStats);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erreur lors de la résolution';
          toast.error(msg);
        } finally {
          setIsProcessing(null);
          setConfirmModalState(null);
        }
      },
    });
  };

  // Action : Supprimer définitivement
  const handleDeleteContribution = (item: ContributionItem) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Supprimer la contribution',
      description: `Êtes-vous sûr de vouloir supprimer définitivement la proposition « ${item.title || item.content.slice(0, 30)} » ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      variant: 'danger',
      action: async () => {
        try {
          setIsProcessing(item.id);
          await contributionsService.deleteContribution(item.id);
          toast.success('Contribution supprimée définitivement.');
          setContributions((prev) => prev.filter((c) => c.id !== item.id));
          const newStats = await contributionsService.getStats();
          setStats(newStats);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
          toast.error(msg);
        } finally {
          setIsProcessing(null);
          setConfirmModalState(null);
        }
      },
    });
  };

  // Action : Confirmer qu'une contribution est un doublon (24h)
  const handleConfirmDuplicate = (item: ContributionItem) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Confirmer comme doublon',
      description: `Confirmer que cette contribution est un doublon ? Un compte à rebours de 24h sera déclenché et l'auteur recevra une notification lui permettant de déposer une réclamation avant suppression automatique.`,
      confirmText: 'Confirmer le doublon (24h)',
      variant: 'warning',
      action: async () => {
        try {
          setIsProcessing(item.id);
          const updated = await contributionsService.confirmDuplicate(item.id);
          toast.info(
            `Doublon confirmé pour « ${item.title || item.content.slice(0, 30)} ». Le compte à rebours de 24h a démarré.`
          );
          setContributions((prev) =>
            prev.map((c) =>
              c.id === item.id
                ? { ...c, ...updated, isDuplicateConfirmed: true, markedForDeletionAt: updated.markedForDeletionAt }
                : c
            )
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erreur lors de la confirmation du doublon';
          toast.error(msg);
        } finally {
          setIsProcessing(null);
          setConfirmModalState(null);
        }
      },
    });
  };

  // Action : Traiter une réclamation d'auteur de contribution
  const handleResolveDispute = (item: ContributionItem, approve: boolean) => {
    const defaultNote = approve
      ? 'Réclamation acceptée par la modération'
      : 'Doublon confirmé après nouvel examen';
    setDisputeModal({
      isOpen: true,
      item,
      approve,
      note: defaultNote,
    });
  };

  const executeResolveDispute = async () => {
    if (!disputeModal || !disputeModal.item) return;
    const { item, approve, note } = disputeModal;

    try {
      setIsProcessing(item.id);
      const updated = await contributionsService.resolveDispute(item.id, approve, note);
      if (approve) {
        toast.success('Réclamation acceptée. La contribution a été rétablie.');
      } else {
        toast.info('Réclamation rejetée. Le compte à rebours final de 24h a été réactivé.');
      }
      setContributions((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, ...updated } : c))
      );
      setDisputeModal(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du traitement de la contestation';
      toast.error(msg);
    } finally {
      setIsProcessing(null);
    }
  };

  // Nombre de doublons / alertes de similarité / contestations
  const duplicateAlertsCount = useMemo(() => {
    return contributions.filter(
      (c) =>
        (c.duplicateScore && c.duplicateScore >= 0.65) ||
        c.isDuplicateConfirmed ||
        c.disputeStatus === 'PENDING'
    ).length;
  }, [contributions]);

  // Filtrage
  const filteredContributions = useMemo(() => {
    return contributions.filter((item) => {
      if (activeTab === 'duplicates') {
        const isDupCandidate =
          (item.duplicateScore && item.duplicateScore >= 0.65) ||
          item.isDuplicateConfirmed ||
          item.disputeStatus === 'PENDING';
        if (!isDupCandidate) return false;
      }

      // Filtre de statut
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Filtre d'alerte modération
      if (moderationFilter === 'FLAGGED' && !item.moderationFlagged) {
        return false;
      }
      if (moderationFilter === 'CLEAN' && item.moderationFlagged) {
        return false;
      }

      const matchCat =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.titleFr?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.contentFr?.toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q) ||
        item.userName?.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [contributions, selectedCategory, searchQuery, activeTab, statusFilter, moderationFilter]);

  // Nombre de contributions signalées par la modération automatique
  const moderationAlertsCount = useMemo(() => {
    return contributions.filter((c) => c.moderationFlagged).length;
  }, [contributions]);

  // Objectif hebdomadaire
  const weeklyTarget = stats.weeklyTarget || 10;
  const weeklyProgressPercent = Math.min(
    100,
    Math.round((stats.approvedThisWeek / weeklyTarget) * 100)
  );

  return (
    <AdminShell>
      <div className="w-full space-y-5 pb-8">
        {/* Header standardisé et compact */}
        <PageHeader
          title="Modération des Contributions"
          description="Supervision du flux collaboratif, arbitrage des propositions citoyennes et enrichissement du patrimoine."
          badge={
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Modération Active
            </span>
          }
          icon={HeartHandshake}
          actions={
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={isLoading}
              title="Actualiser les données"
              className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
        />

        {/* Ruban des indicateurs clés (KPIs minimalistes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1 : En attente */}
          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-mono text-[var(--text-muted)] uppercase tracking-wider">
                En attente d&apos;examen
              </span>
              <Clock size={15} className="text-amber-500 opacity-70" />
            </div>
            <div className="my-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
                  {isLoading ? '—' : stats.totalPending}
                </span>
                {!isLoading && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                      stats.totalPending > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {stats.totalPending > 0 ? `${stats.totalPending} à arbitrer` : 'À jour'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Soumissions citoyennes actives
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] text-[10.5px] font-mono text-[var(--text-subtle)]">
              File d&apos;arbitrage prioritaire
            </div>
          </div>

          {/* KPI 2 : Signalements */}
          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Signalements
              </span>
              <ShieldAlert size={15} className={stats.totalReportsPending > 0 ? 'text-rose-500' : 'text-emerald-500 opacity-70'} />
            </div>
            <div className="my-1.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
                  {isLoading ? '—' : stats.totalReportsPending}
                </span>
                {!isLoading && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                      stats.totalReportsPending > 0
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {stats.totalReportsPending > 0 ? 'Action requise' : 'Sain'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Alertes de contenu communautaires
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] text-[10.5px] font-mono text-[var(--text-subtle)]">
              {stats.totalReportsPending > 0 ? 'À traiter dans l’onglet Abus' : 'Aucun abus non résolu'}
            </div>
          </div>

          {/* KPI 3 : Objectif Hebdomadaire */}
          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Objectif Hebdo
              </span>
              <Target size={15} className="text-[var(--accent)] opacity-70" />
            </div>
            <div className="my-1.5 space-y-1">
              <div className="flex items-baseline justify-between text-[11px] font-mono">
                <span className="text-xl font-bold text-[var(--foreground)]">
                  {isLoading ? '—' : stats.approvedThisWeek}
                  <span className="text-xs font-normal text-[var(--text-muted)]"> / {weeklyTarget}</span>
                </span>
                <span className="font-semibold text-[var(--accent)]">{weeklyProgressPercent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--input-border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                  style={{ width: `${weeklyProgressPercent}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] text-[10.5px] font-mono text-[var(--text-subtle)]">
              Validation vers catalogue officiel
            </div>
          </div>

          {/* KPI 4 : Validées au catalogue */}
          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Catalogue Enrichi
              </span>
              <CheckCircle2 size={15} className="text-emerald-500 opacity-70" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
                {isLoading ? '—' : stats.totalApproved}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Propositions intégrées au patrimoine
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] text-[10.5px] font-mono text-[var(--text-subtle)]">
              Historique des validations
            </div>
          </div>
        </div>

        {/* Barre de navigation par onglets (Segmented Control épuré) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs border border-[var(--card-border)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Clock size={13} />
              <span>Contributions</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]">
                {contributions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('duplicates')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'duplicates'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs border border-[var(--card-border)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Copy size={13} />
              <span>Doublons & Litiges</span>
              {duplicateAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                  {duplicateAlertsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs border border-[var(--card-border)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <ShieldAlert size={13} />
              <span>Signalements</span>
              {reports.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold">
                  {reports.length}
                </span>
              )}
            </button>
          </div>

          {/* Compteur synthétique */}
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {activeTab === 'reports'
              ? `${reports.length} signalement(s)`
              : `${filteredContributions.length} proposition(s) affichée(s)`}
          </span>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* ONGLET 1 & 2 : CONTRIBUTIONS & DOUBLONS                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        {(activeTab === 'pending' || activeTab === 'duplicates') && (
          <div className="space-y-4">
            {/* Barre de filtres et recherche unifiée */}
            <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Recherche */}
                <div className="relative flex-1">
                  <label htmlFor="search-contributions" className="sr-only">
                    Filtrer par titre, extrait ou auteur
                  </label>
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                  />
                  <input
                    id="search-contributions"
                    name="searchContributions"
                    type="search"
                    aria-label="Filtrer par titre, extrait ou auteur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrer par titre, extrait ou auteur..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                {/* Filtres de catégorie */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'KABARY', 'PROVERBE', 'CITATION', 'CONTE'].map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const label =
                      cat === 'ALL'
                        ? 'Toutes'
                        : CATEGORY_CONFIG[cat as ContributionCategory]?.label || cat;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap border ${
                          isSelected
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold shadow-xs'
                            : 'border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--card-hover)]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ligne secondaire : Statuts & Alertes IA */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--card-border)] text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-mono text-[var(--text-subtle)] uppercase">Statut :</span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition cursor-pointer border ${
                      statusFilter === 'ALL'
                        ? 'bg-[var(--foreground)] text-[var(--background)] font-medium'
                        : 'border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--card-hover)]'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PENDING_REVIEW')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition cursor-pointer border ${
                      statusFilter === 'PENDING_REVIEW'
                        ? 'bg-[var(--foreground)] text-[var(--background)] font-medium'
                        : 'border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--card-hover)]'
                    }`}
                  >
                    En attente
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('CHANGES_REQUESTED')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition cursor-pointer border ${
                      statusFilter === 'CHANGES_REQUESTED'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-semibold'
                        : 'border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--card-hover)]'
                    }`}
                  >
                    Ajustements demandés
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-mono text-[var(--text-subtle)] uppercase">Modération IA :</span>
                  <button
                    type="button"
                    onClick={() => setModerationFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition cursor-pointer border ${
                      moderationFilter === 'ALL'
                        ? 'bg-[var(--foreground)] text-[var(--background)] font-medium'
                        : 'border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--card-hover)]'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    type="button"
                    onClick={() => setModerationFilter('FLAGGED')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition cursor-pointer border flex items-center gap-1 ${
                      moderationFilter === 'FLAGGED'
                        ? 'bg-rose-600 text-white font-semibold border-rose-600'
                        : 'border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    <Flag size={10} />
                    <span>Signalées ({moderationAlertsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModerationFilter('CLEAN')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition cursor-pointer border ${
                      moderationFilter === 'CLEAN'
                        ? 'bg-emerald-600 text-white font-semibold border-emerald-600'
                        : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    Saines
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des contributions */}
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-[var(--accent)]" />
                <span>Chargement des propositions...</span>
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="py-14 text-center rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] p-6">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Aucune proposition en attente
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'ALL' || moderationFilter !== 'ALL'
                    ? 'Aucun résultat ne correspond aux filtres actuels.'
                    : 'Toutes les soumissions de cette section ont été examinées et validées.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredContributions.map((item) => {
                  const catConfig =
                    CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.PROVERBE;
                  const CategoryIcon = catConfig.icon;
                  const isBusy = isProcessing === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--card-hover-border)] transition space-y-3"
                    >
                      {/* Top ligne : Catégorie + Score communautaire + Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-medium border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)]">
                            <CategoryIcon size={12} className="text-[var(--accent)]" />
                            <span>{catConfig.label}</span>
                          </span>

                          <span className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1 font-mono">
                            <Calendar size={11} />
                            <span>
                              {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </span>
                        </div>

                        {/* Votes & Score communautaire */}
                        <div className="flex items-center gap-2 text-xs">
                          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] text-[11px] font-mono">
                            <span
                              className={
                                item.score > 0
                                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                  : item.score < 0
                                  ? 'text-rose-600 font-semibold'
                                  : 'text-[var(--text-muted)]'
                              }
                            >
                              {item.score > 0 ? `+${item.score}` : item.score}
                            </span>
                            <span className="text-[var(--text-subtle)] text-[10.5px] flex items-center gap-1">
                              <ThumbsUp size={10} className="text-emerald-500" />
                              <span>{item.upvotesCount}</span>
                              <span className="opacity-40">/</span>
                              <ThumbsDown size={10} className="text-rose-500" />
                              <span>{item.downvotesCount}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Alertes Modération IA */}
                      {item.moderationFlagged && (
                        <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400 text-xs">
                              <Flag size={13} />
                              <span>Alerte modération automatique</span>
                            </div>
                            {item.moderationCategories && item.moderationCategories.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.moderationCategories.map((cat) => (
                                  <span
                                    key={cat}
                                    className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-medium"
                                  >
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {item.moderationReason && (
                            <p className="text-[11px] text-[var(--text-muted)] font-mono pl-4">
                              {item.moderationReason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Statut : Modifications demandées */}
                      {item.status === 'CHANGES_REQUESTED' && (
                        <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                            <FileEdit size={13} />
                            <span>Ajustements en attente de l&apos;auteur</span>
                          </div>
                          {item.adminFeedback && (
                            <p className="text-[11px] italic text-[var(--text-muted)] pl-4">
                              Consignes : « {item.adminFeedback} »
                            </p>
                          )}
                        </div>
                      )}

                      {/* Doublon confirmé (24h) */}
                      {item.isDuplicateConfirmed && (
                        <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={14} className="shrink-0 text-rose-600 dark:text-rose-400" />
                            <div>
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                Doublon confirmé — Suppression auto :{' '}
                              </span>
                              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                                {item.markedForDeletionAt
                                  ? new Date(item.markedForDeletionAt).toLocaleString('fr-FR')
                                  : 'Suspendue par réclamation'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Similarité suspectée */}
                      {Boolean(item.duplicateScore && item.duplicateScore >= 0.65 && !item.isDuplicateConfirmed) && (
                        <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs flex items-center gap-2">
                          <AlertTriangle size={14} className="shrink-0 text-amber-500" />
                          <div>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              Similarité détectée : {Math.round((item.duplicateScore || 0) * 100)}%{' '}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              avec {item.duplicateTypeOf || 'catalogue'} « {item.duplicateTargetTitle || item.duplicateOfId || ''} »
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Réclamation de contestation */}
                      {item.disputeStatus === 'PENDING' && (
                        <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-400">
                            <ShieldAlert size={14} />
                            <span>Réclamation du contributeur (Suppression gelée) :</span>
                          </div>
                          <p className="italic bg-[var(--card)] p-2 rounded border border-[var(--card-border)] text-[var(--foreground)]">
                            « {item.disputeMessage} »
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => void handleResolveDispute(item, true)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition cursor-pointer"
                            >
                              Accepter réclamation (Rétablir)
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleResolveDispute(item, false)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded-md border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs transition cursor-pointer"
                            >
                              Rejeter (Délai 24h final)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Corps du texte de la proposition */}
                      <div className="space-y-2 py-0.5">
                        {item.title && (
                          <h3 className="text-sm font-semibold font-heritage text-[var(--foreground)]">
                            {item.title}
                            {item.titleFr && (
                              <span className="text-xs font-normal text-[var(--text-muted)] ml-2 font-sans">
                                ({item.titleFr})
                              </span>
                            )}
                          </h3>
                        )}

                        {/* Texte Malagasy Original */}
                        <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)]">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)] mb-1">
                            <span>Malagasy (Original)</span>
                          </div>
                          <p className="text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-line font-medium">
                            {item.content}
                          </p>
                        </div>

                        {/* Traduction Française */}
                        {item.contentFr && (
                          <div className="p-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-xs">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)] block mb-0.5">
                              Traduction Française
                            </span>
                            <p className="text-[11.5px] text-[var(--text-muted)] italic leading-relaxed whitespace-pre-line">
                              {item.contentFr}
                            </p>
                          </div>
                        )}

                        {/* Métadonnées contextuelles */}
                        {(item.author || item.origin || item.theme) && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)] pt-0.5">
                            {item.author && (
                              <span>
                                <span className="text-[var(--text-subtle)]">Auteur : </span>
                                <strong className="text-[var(--foreground)]">{item.author}</strong>
                              </span>
                            )}
                            {item.origin && (
                              <span>
                                <span className="text-[var(--text-subtle)]">Origine : </span>
                                <span>{item.origin}</span>
                              </span>
                            )}
                            {item.theme && (
                              <span>
                                <span className="text-[var(--text-subtle)]">Thème : </span>
                                <span>{item.theme}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer : Proposé par + Groupe d'actions épuré */}
                      <div className="pt-2.5 border-t border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <div className="w-5 h-5 rounded-full bg-[var(--input-bg)] border border-[var(--input-border)] flex items-center justify-center text-[var(--text-subtle)]">
                            <User size={11} />
                          </div>
                          <span>
                            Par <strong className="text-[var(--foreground)]">{item.userName || 'Membre'}</strong> &bull; {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>

                        {/* Actions de modération */}
                        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                          {/* Utilitaires discrets */}
                          <button
                            type="button"
                            onClick={() => void handleOpenAuditModal(item)}
                            disabled={isBusy}
                            title="Historique des décisions d'audit"
                            className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                          >
                            <History size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteContribution(item)}
                            disabled={isBusy}
                            title="Supprimer définitivement"
                            className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>

                          {!item.isDuplicateConfirmed && (
                            <button
                              type="button"
                              onClick={() => void handleConfirmDuplicate(item)}
                              disabled={isBusy}
                              title="Marquer comme doublon (compte à rebours 24h)"
                              className="px-2 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                            >
                              <AlertTriangle size={12} />
                              <span>Doublon (24h)</span>
                            </button>
                          )}

                          {/* Décisions */}
                          <button
                            type="button"
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                item,
                                type: 'REQUEST_CHANGES',
                                reason: '',
                              })
                            }
                            disabled={isBusy}
                            title="Demander des ajustements à l'auteur"
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] text-xs font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <FileEdit size={13} />
                            <span>Ajustements</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                item,
                                type: 'REJECT',
                                reason: '',
                              })
                            }
                            disabled={isBusy}
                            title="Rejeter la contribution"
                            className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <XCircle size={13} />
                            <span>Rejeter</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleApprove(item)}
                            disabled={isBusy}
                            title="Approuver et intégrer au catalogue (+50 XP)"
                            className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={13} />
                            <span>Valider</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* ONGLET 3 : SIGNALEMENTS D'ABUS                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="space-y-3.5">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-[var(--accent)]" />
                <span>Chargement des signalements...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-14 text-center rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] p-6">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Aucun signalement actif
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                  Tous les signalements et abus rapportés ont été résolus avec succès.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {reports.map((report) => {
                  const isBusy = isProcessing === report.id;

                  return (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-rose-500/30 bg-[var(--card)] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <ShieldAlert size={12} />
                            <span>MOTIF : {report.reason}</span>
                          </span>

                          <span className="text-[11px] font-mono text-[var(--text-subtle)]">
                            {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleResolveReport(report)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />
                          <span>Marquer résolu</span>
                        </button>
                      </div>

                      {/* Description du signalement */}
                      {report.description && (
                        <div className="p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-xs">
                          <span className="text-[var(--text-subtle)] font-mono text-[10px] uppercase block mb-0.5">
                            Commentaire du signaleur :
                          </span>
                          <p className="text-[var(--foreground)]">{report.description}</p>
                        </div>
                      )}

                      <div className="text-[11px] text-[var(--text-subtle)] font-mono">
                        Signalé par : <span className="text-[var(--foreground)]">{report.reporterName || report.reportedBy}</span> &bull; Ref : <code className="text-[10px]">{report.contentId}</code>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL DE DÉCISION ADMINISTRATIVE                              */}
        {/* ───────────────────────────────────────────────────────────── */}
        {actionModal?.isOpen && actionModal.item && (
          <Modal
            isOpen={actionModal.isOpen}
            onClose={() => setActionModal(null)}
            title={
              actionModal.type === 'REQUEST_CHANGES'
                ? "Demander des ajustements à l'auteur"
                : 'Rejeter la proposition'
            }
            subtitle={
              actionModal.type === 'REQUEST_CHANGES'
                ? "L'auteur recevra vos consignes afin d'améliorer sa contribution."
                : 'Le motif de rejet sera communiqué au membre par notification.'
            }
            maxWidth="lg"
            footer={
              <div className="flex items-center justify-end gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3 py-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmitDecision()}
                  disabled={!actionModal.reason.trim() || isProcessing === actionModal.item.id}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                    actionModal.type === 'REQUEST_CHANGES'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessing === actionModal.item.id ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : actionModal.type === 'REQUEST_CHANGES' ? (
                    'Envoyer les consignes'
                  ) : (
                    'Confirmer le rejet'
                  )}
                </button>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--text-muted)] space-y-1">
                <div>
                  Contribution :{' '}
                  <strong className="text-[var(--foreground)]">
                    « {actionModal.item.title || actionModal.item.content.slice(0, 45)} »
                  </strong>
                </div>
                <div>
                  Auteur :{' '}
                  <strong className="text-[var(--foreground)]">
                    {actionModal.item.userName || 'Membre'}
                  </strong>
                </div>
              </div>

              <div>
                <label
                  htmlFor="action-decision-reason"
                  className="block text-xs font-medium text-[var(--text-muted)] mb-1"
                >
                  {actionModal.type === 'REQUEST_CHANGES'
                    ? 'Consignes & ajustements attendus *'
                    : 'Motif du rejet (transmis à l’auteur) *'}
                </label>
                <textarea
                  id="action-decision-reason"
                  name="decisionReason"
                  aria-label={
                    actionModal.type === 'REQUEST_CHANGES'
                      ? 'Consignes et ajustements attendus'
                      : 'Motif du rejet transmis à l’auteur'
                  }
                  value={actionModal.reason}
                  onChange={(e) =>
                    setActionModal((prev) =>
                      prev ? { ...prev, reason: e.target.value } : null
                    )
                  }
                  rows={3}
                  placeholder={
                    actionModal.type === 'REQUEST_CHANGES'
                      ? 'Ex: Préciser le dialecte ou affiner la traduction française...'
                      : 'Ex: Contenu non conforme aux règles de la communauté ou doublon...'
                  }
                  className="w-full p-2.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  required
                />
              </div>
            </div>
          </Modal>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL D'HISTORIQUE D'AUDIT                                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        {auditModal?.isOpen && auditModal.item && (
          <Modal
            isOpen={auditModal.isOpen}
            onClose={() => setAuditModal(null)}
            title="Historique des décisions & Audit"
            subtitle={`Traçabilité des actions pour « ${auditModal.item.title || auditModal.item.content.slice(0, 35)} »`}
            maxWidth="lg"
            footer={
              <div className="flex justify-end w-full">
                <button
                  type="button"
                  onClick={() => setAuditModal(null)}
                  className="px-3.5 py-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--foreground)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            }
          >
            <div className="space-y-3">
              {auditModal.isLoading ? (
                <div className="py-10 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-[var(--accent)]" />
                  <span>Chargement du journal d&apos;audit...</span>
                </div>
              ) : auditModal.logs.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  Aucun événement d&apos;audit archivé pour cette contribution.
                </div>
              ) : (
                auditModal.logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--foreground)] text-[11px] font-mono uppercase">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-[var(--text-subtle)] font-mono">
                        {new Date(log.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                      <span>
                        Par :{' '}
                        <strong className="text-[var(--foreground)] font-mono">
                          {log.userRole || 'SYSTEM'}
                        </strong>
                      </span>
                      {log.fromStatus && log.toStatus && (
                        <span>
                          ({log.fromStatus} →{' '}
                          <strong className="text-[var(--foreground)]">{log.toStatus}</strong>)
                        </span>
                      )}
                    </div>

                    {log.reason && (
                      <p className="text-[11px] bg-[var(--card)] p-2 rounded-md border border-[var(--card-border)] italic text-[var(--foreground)] mt-1">
                        « {log.reason} »
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Modal>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL DE RÉSOLUTION DE RÉCLAMATION                           */}
        {/* ───────────────────────────────────────────────────────────── */}
        {disputeModal?.isOpen && disputeModal.item && (
          <Modal
            isOpen={disputeModal.isOpen}
            onClose={() => setDisputeModal(null)}
            title={
              disputeModal.approve
                ? 'Accepter la réclamation & Restaurer'
                : 'Rejeter la réclamation'
            }
            subtitle={
              disputeModal.approve
                ? 'La contribution sera rétablie et retirée du statut de doublon.'
                : 'Le compte à rebours final de 24h avant suppression sera réactivé.'
            }
            maxWidth="md"
            footer={
              <div className="flex items-center justify-end gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setDisputeModal(null)}
                  className="px-3 py-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void executeResolveDispute()}
                  disabled={!disputeModal.note.trim() || isProcessing === disputeModal.item.id}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium text-white transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                    disputeModal.approve
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessing === disputeModal.item.id ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Traitement...</span>
                    </>
                  ) : disputeModal.approve ? (
                    'Rétablir la contribution'
                  ) : (
                    'Confirmer le rejet'
                  )}
                </button>
              </div>
            }
          >
            <div className="space-y-3">
              <div className="p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--text-muted)]">
                Contribution :{' '}
                <strong className="text-[var(--foreground)]">
                  « {disputeModal.item.title || disputeModal.item.content.slice(0, 45)} »
                </strong>
              </div>

              <div>
                <label
                  htmlFor="dispute-explanation-note"
                  className="block text-xs font-medium text-[var(--text-muted)] mb-1"
                >
                  Note explicative pour l&apos;auteur *
                </label>
                <textarea
                  id="dispute-explanation-note"
                  name="disputeNote"
                  aria-label="Note explicative pour l'auteur"
                  value={disputeModal.note}
                  onChange={(e) =>
                    setDisputeModal((prev) => (prev ? { ...prev, note: e.target.value } : null))
                  }
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  required
                />
              </div>
            </div>
          </Modal>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL DE CONFIRMATION GÉNÉRIQUE                              */}
        {/* ───────────────────────────────────────────────────────────── */}
        {confirmModalState?.isOpen && (
          <ConfirmModal
            isOpen={confirmModalState.isOpen}
            onClose={() => setConfirmModalState(null)}
            onConfirm={confirmModalState.action}
            title={confirmModalState.title}
            description={confirmModalState.description}
            confirmText={confirmModalState.confirmText || 'Confirmer'}
            variant={confirmModalState.variant || 'primary'}
            isLoading={!!isProcessing}
          />
        )}
      </div>
    </AdminShell>
  );
}

