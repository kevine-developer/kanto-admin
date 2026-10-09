'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui';
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
  Info,
  Copy,
  History,
  FileEdit,
  Flag,
} from 'lucide-react';

type TabType = 'pending' | 'duplicates' | 'reports';

const CATEGORY_CONFIG: Record<
  ContributionCategory,
  { label: string; icon: React.ElementType; color: string; badgeBg: string }
> = {
  KABARY: {
    label: 'Kabary',
    icon: Mic,
    color: 'text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
  },
  PROVERBE: {
    label: 'Proverbe',
    icon: ScrollText,
    color: 'text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
  },
  CITATION: {
    label: 'Citation',
    icon: Quote,
    color: 'text-sky-700 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800',
  },
  CONTE: {
    label: 'Conte',
    icon: BookOpen,
    color: 'text-purple-700 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
  },
};

/**
 * Page de modération des contributions citoyennes et gestion des signalements.
 * Permet la validation/rejet des contes, proverbes, kabary et citations proposés, ainsi que la résolution des signalements.
 */
export default function AdminContributionsPage() {
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

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
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
      setFeedback({
        type: 'error',
        text: 'Impossible de charger les données de modération.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Action : Valider une contribution (Approbation)
  const handleApprove = async (item: ContributionItem) => {
    if (!confirm(`Confirmez-vous l'approbation et l'intégration au catalogue officiel de la proposition de "${item.userName || 'un membre'}" ? (+50 XP attribués)`)) {
      return;
    }

    try {
      setIsProcessing(item.id);
      await contributionsService.validate(item.id, true);
      setFeedback({
        type: 'success',
        text: `La contribution « ${item.title || item.content.slice(0, 30)} » a été approuvée et publiée.`,
      });
      setContributions((prev) => prev.filter((c) => c.id !== item.id));
      const newStats = await contributionsService.getStats();
      setStats(newStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l approbation';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  // Action : Soumettre une décision de rejet ou demande de modifications
  const handleSubmitDecision = async () => {
    if (!actionModal || !actionModal.item) return;
    if (!actionModal.reason.trim()) {
      alert('Veuillez spécifier un motif ou des consignes pour le contributeur.');
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

      setFeedback({
        type: isRequestChanges ? 'info' : 'success',
        text: isRequestChanges
          ? `Des modifications ont été demandées à l'auteur pour « ${item.title || item.content.slice(0, 30)} ».`
          : `La proposition a été rejetée. Le motif a été transmis à l'auteur.`,
      });

      setContributions((prev) => prev.filter((c) => c.id !== item.id));
      setActionModal(null);
      const newStats = await contributionsService.getStats();
      setStats(newStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l enregistrement de la décision';
      setFeedback({ type: 'error', text: msg });
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
  const handleResolveReport = async (report: ContentReport) => {
    if (!confirm('Confirmez-vous le traitement et la résolution de ce signalement ?')) {
      return;
    }

    try {
      setIsProcessing(report.id);
      await contributionsService.resolveReport(report.id);
      setFeedback({
        type: 'success',
        text: 'Signalement marqué comme résolu.',
      });
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      const newStats = await contributionsService.getStats();
      setStats(newStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la résolution';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  // Action : Supprimer définitivement
  const handleDeleteContribution = async (item: ContributionItem) => {
    if (!confirm(`Attention : supprimer définitivement la contribution « ${item.title || item.content.slice(0, 30)} » ?`)) {
      return;
    }

    try {
      setIsProcessing(item.id);
      await contributionsService.deleteContribution(item.id);
      setFeedback({
        type: 'success',
        text: 'Contribution supprimée définitivement.',
      });
      setContributions((prev) => prev.filter((c) => c.id !== item.id));
      const newStats = await contributionsService.getStats();
      setStats(newStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  // Action : Confirmer qu'une contribution est un doublon (24h)
  const handleConfirmDuplicate = async (item: ContributionItem) => {
    if (
      !confirm(
        `Confirmer que cette contribution est un doublon ?\n\n- Une bannière "Doublon identifié" et un compte à rebours de 24h seront affichés.\n- L'auteur recevra une notification lui permettant de déposer une réclamation.\n- Les commentaires seront immédiatement bloqués.\n- À expiration des 24h sans réclamation, elle sera automatiquement supprimée.`
      )
    ) {
      return;
    }

    try {
      setIsProcessing(item.id);
      const updated = await contributionsService.confirmDuplicate(item.id);
      setFeedback({
        type: 'info',
        text: `Doublon confirmé pour « ${item.title || item.content.slice(0, 30)} ». Le compte à rebours de 24h a démarré.`,
      });
      setContributions((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, ...updated, isDuplicateConfirmed: true, markedForDeletionAt: updated.markedForDeletionAt }
            : c
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la confirmation du doublon';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsProcessing(null);
    }
  };

  // Action : Traiter une réclamation d'auteur de contribution
  const handleResolveDispute = async (item: ContributionItem, approve: boolean) => {
    const defaultNote = approve
      ? 'Réclamation acceptée par la modération'
      : 'Doublon confirmé après nouvel examen';
    const note = prompt(
      approve
        ? 'Accepter la réclamation et restaurer la contribution ?\nNote pour l’auteur :'
        : 'Rejeter la réclamation et relancer le délai de 24h avant suppression ?\nNote pour l’auteur :',
      defaultNote
    );
    if (note === null) return;

    try {
      setIsProcessing(item.id);
      const updated = await contributionsService.resolveDispute(item.id, approve, note);
      setFeedback({
        type: approve ? 'success' : 'info',
        text: approve
          ? `Réclamation acceptée. La contribution a été rétablie.`
          : `Réclamation rejetée. Le compte à rebours final de 24h a été réactivé.`,
      });
      setContributions((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, ...updated } : c))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du traitement de la contestation';
      setFeedback({ type: 'error', text: msg });
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

  // Objectif hebdomadaire (cible 10)
  const weeklyTarget = stats.weeklyTarget || 10;
  const weeklyProgressPercent = Math.min(
    100,
    Math.round((stats.approvedThisWeek / weeklyTarget) * 100)
  );

  return (
    <AdminShell>
      <div className="w-full space-y-6 pb-8">
        {/* Header standardisé */}
        <PageHeader
          title="Modération & Contributions"
          description="Supervision du flux communautaire, analyse des votes et validation vers le catalogue officiel."
          icon={HeartHandshake}
          actions={
            <button
              onClick={() => void loadData()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-xs font-medium text-[var(--foreground)] transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>
          }
        />

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-lg flex items-center justify-between text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />}
              {feedback.type === 'error' && <AlertTriangle size={15} className="shrink-0 text-rose-600" />}
              {feedback.type === 'info' && <Info size={15} className="shrink-0 text-blue-600" />}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Bannière Objectif Hebdomadaire & Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Carte Objectif Hebdo */}
          <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
                Objectif Hebdo
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Target size={15} />
              </div>
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-heritage text-[var(--foreground)]">
                  {stats.approvedThisWeek}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  / {weeklyTarget} validés
                </span>
              </div>
              {/* Barre de progression */}
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${weeklyProgressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {weeklyProgressPercent}% de la cible hebdomadaire
            </span>
          </div>

          <StatCard
            title="En attente d'examen"
            value={isLoading ? '...' : stats.totalPending}
            subtitle="Soumissions à modérer"
            icon={Clock}
            variant="warning"
          />

          <StatCard
            title="Validées au catalogue"
            value={isLoading ? '...' : stats.totalApproved}
            subtitle="Patrimoine enrichi"
            icon={CheckCircle2}
            variant="success"
          />

          <StatCard
            title="Signalements ouverts"
            value={isLoading ? '...' : stats.totalReportsPending}
            subtitle="Alertes de la communauté"
            icon={ShieldAlert}
            variant={stats.totalReportsPending > 0 ? 'warning' : 'default'}
          />
        </div>

        {/* Sélecteur d'Onglets */}
        <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <Clock size={14} />
            <span>Contributions en attente</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-[var(--foreground)]">
              {contributions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('duplicates')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'duplicates'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <Copy size={14} />
            <span>Doublons & Litiges</span>
            {duplicateAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-white font-bold">
                {duplicateAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Signalements & Abus</span>
            {reports.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-600 text-white font-bold">
                {reports.length}
              </span>
            )}
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* ONGLET 1 & 2 : CONTRIBUTIONS & DOUBLONS                       */}
        {/* ───────────────────────────────────────────────────────────── */}
        {(activeTab === 'pending' || activeTab === 'duplicates') && (
          <div className="space-y-4">
            {/* Barre d'outils : Recherche, Catégories, Statut et Alerte Modération */}
            <div className="flex flex-col gap-3 bg-[var(--card)] p-3 rounded-xl border border-[var(--card-border)]">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Recherche */}
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par titre, extrait ou auteur..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                {/* Filtres de catégorie */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'KABARY', 'PROVERBE', 'CITATION', 'CONTE'].map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const label =
                      cat === 'ALL'
                        ? 'Toutes catégories'
                        : CATEGORY_CONFIG[cat as ContributionCategory]?.label || cat;

                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap border ${
                          isSelected
                            ? 'bg-[var(--accent-light)] text-[var(--accent-text)] border-[var(--accent)] font-semibold'
                            : 'border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--card-hover)]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ligne secondaire : Filtres Modération & Statut */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--card-border)] text-xs">
                {/* Alerte de modération automatique */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--text-subtle)] font-medium">Modération :</span>
                  <button
                    onClick={() => setModerationFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                      moderationFilter === 'ALL'
                        ? 'bg-[var(--foreground)] text-[var(--background)]'
                        : 'border-[var(--card-border)] text-[var(--text-muted)]'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setModerationFilter('FLAGGED')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1 transition cursor-pointer ${
                      moderationFilter === 'FLAGGED'
                        ? 'bg-rose-600 text-white font-semibold border-rose-600'
                        : 'border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50'
                    }`}
                  >
                    <Flag size={11} />
                    <span>Signalées ({moderationAlertsCount})</span>
                  </button>
                  <button
                    onClick={() => setModerationFilter('CLEAN')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                      moderationFilter === 'CLEAN'
                        ? 'bg-emerald-600 text-white font-semibold border-emerald-600'
                        : 'border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    Saines
                  </button>
                </div>

                {/* Filtre par statut */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--text-subtle)] font-medium">Statut :</span>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                      statusFilter === 'ALL'
                        ? 'bg-[var(--accent-light)] text-[var(--accent-text)] border-[var(--accent)] font-semibold'
                        : 'border-[var(--card-border)] text-[var(--text-muted)]'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING_REVIEW')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                      statusFilter === 'PENDING_REVIEW'
                        ? 'bg-[var(--accent-light)] text-[var(--accent-text)] border-[var(--accent)] font-semibold'
                        : 'border-[var(--card-border)] text-[var(--text-muted)]'
                    }`}
                  >
                    En attente
                  </button>
                  <button
                    onClick={() => setStatusFilter('CHANGES_REQUESTED')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition cursor-pointer ${
                      statusFilter === 'CHANGES_REQUESTED'
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold dark:bg-amber-950/60 dark:text-amber-200'
                        : 'border-[var(--card-border)] text-[var(--text-muted)]'
                    }`}
                  >
                    Modifs demandées
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des contributions */}
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <RefreshCw size={15} className="animate-spin" />
                <span>Chargement des contributions...</span>
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="py-16 text-center rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] p-8">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2 opacity-80" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Aucune contribution en attente
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'ALL'
                    ? 'Aucun résultat ne correspond aux filtres appliqués.'
                    : 'Toutes les propositions communautaires soumises ont été examinées.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredContributions.map((item) => {
                  const catConfig =
                    CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.PROVERBE;
                  const CategoryIcon = catConfig.icon;
                  const isBusy = isProcessing === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:border-neutral-300 dark:hover:border-neutral-700 transition space-y-3"
                    >
                      {/* Top ligne : Catégorie + Score communautaire + Date */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${catConfig.badgeBg} ${catConfig.color}`}
                          >
                            <CategoryIcon size={12} />
                            <span>{catConfig.label}</span>
                          </span>

                          <span className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1">
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

                        {/* Votes de la communauté */}
                        <div className="flex items-center gap-2 text-xs">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${
                              item.score > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                : item.score < 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                            }`}
                          >
                            <span>Score : {item.score > 0 ? `+${item.score}` : item.score}</span>
                          </div>

                          <span className="text-[10.5px] text-[var(--text-subtle)] flex items-center gap-1">
                            <ThumbsUp size={11} className="text-emerald-600" />
                            <span>{item.upvotesCount}</span>
                            <span className="opacity-50">/</span>
                            <ThumbsDown size={11} className="text-rose-600" />
                            <span>{item.downvotesCount}</span>
                          </span>
                        </div>
                      </div>

                      {/* Alerte de modération automatique */}
                      {item.moderationFlagged && (
                        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-1.5">
                          <div className="flex items-center gap-2 font-semibold text-rose-700 dark:text-rose-300">
                            <Flag size={14} className="text-rose-600 shrink-0" />
                            <span>🚩 Alerte de modération automatique — Contenu suspect détecté</span>
                          </div>
                          {item.moderationCategories && item.moderationCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="text-[11px] text-rose-700 dark:text-rose-400">Catégories de risque :</span>
                              {item.moderationCategories.map((cat) => (
                                <span
                                  key={cat}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-200 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100 font-bold"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.moderationReason && (
                            <p className="text-[11px] text-rose-800 dark:text-rose-300 font-mono bg-white/70 dark:bg-black/30 p-1.5 rounded border border-rose-200 dark:border-rose-900/50">
                              {item.moderationReason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Statut de modifications demandées */}
                      {item.status === 'CHANGES_REQUESTED' && (
                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-300">
                            <FileEdit size={13} />
                            <span>Ajustements en attente de l&apos;auteur</span>
                          </div>
                          {item.adminFeedback && (
                            <p className="text-[11px] italic text-amber-800 dark:text-amber-300">
                              Consignes : « {item.adminFeedback} »
                            </p>
                          )}
                        </div>
                      )}

                      {/* Alertes Doublons & Litiges */}
                      {item.isDuplicateConfirmed && (
                        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                            <div>
                              <span className="font-semibold">Doublon confirmé — Suppression auto : </span>
                              <span className="font-mono">
                                {item.markedForDeletionAt
                                   ? new Date(item.markedForDeletionAt).toLocaleString('fr-FR')
                                   : 'Suspendue par réclamation'}
                              </span>
                              <div className="text-[11px] text-rose-600 dark:text-rose-400">
                                Commentaires bloqués côté application. Compte à rebours 24h actif.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {Boolean(item.duplicateScore && item.duplicateScore >= 0.65 && !item.isDuplicateConfirmed) && (
                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                            <div>
                              <span className="font-semibold">
                                Similarité détectée : {Math.round((item.duplicateScore || 0) * 100)}%{' '}
                              </span>
                              <span>
                                avec {item.duplicateTypeOf || 'catalogue'} « {item.duplicateTargetTitle || item.duplicateOfId || ''} »
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.disputeStatus === 'PENDING' && (
                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-semibold text-purple-700 dark:text-purple-300">
                            <ShieldAlert size={15} />
                            <span>Réclamation du contributeur (Suppression 24h gelée) :</span>
                          </div>
                          <p className="italic bg-white dark:bg-neutral-900 p-2 rounded border border-purple-100 dark:border-purple-900/50">
                            « {item.disputeMessage} »
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => void handleResolveDispute(item, true)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition cursor-pointer"
                            >
                              Accepter réclamation (Rétablir)
                            </button>
                            <button
                              onClick={() => void handleResolveDispute(item, false)}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded border border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-xs transition cursor-pointer"
                            >
                              Rejeter (Délai 24h final)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Contenu principal */}
                      <div className="space-y-1.5">
                        {item.title && (
                          <h4 className="text-sm font-semibold font-heritage text-[var(--foreground)]">
                            {item.title}
                            {item.titleFr && (
                              <span className="text-xs font-normal text-[var(--text-muted)] ml-2">
                                ({item.titleFr})
                              </span>
                            )}
                          </h4>
                        )}

                        {/* Texte en Malagasy */}
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800/80">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)] mb-1">
                            Malagasy (Original)
                          </div>
                          <p className="text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-line font-medium">
                            {item.content}
                          </p>
                        </div>

                        {/* Texte en Français (si présent) */}
                        {item.contentFr && (
                          <div className="p-3 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-100 dark:border-neutral-800/50">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)] mb-1">
                              Français (Traduction)
                            </div>
                            <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-line italic">
                              {item.contentFr}
                            </p>
                          </div>
                        )}

                        {/* Contexte / Explication / Auteur */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-[var(--text-muted)]">
                          {item.author && (
                            <div>
                              <span className="text-[var(--text-subtle)]">Auteur : </span>
                              <span className="font-medium text-[var(--foreground)]">{item.author}</span>
                            </div>
                          )}
                          {item.origin && (
                            <div>
                              <span className="text-[var(--text-subtle)]">Origine : </span>
                              <span>{item.origin}</span>
                            </div>
                          )}
                          {item.theme && (
                            <div>
                              <span className="text-[var(--text-subtle)]">Thème : </span>
                              <span>{item.theme}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer : Auteur de la soumission + Actions */}
                      <div className="pt-2 border-t border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <User size={13} className="text-[var(--text-subtle)]" />
                          <span>Proposé par : </span>
                          <span className="font-semibold text-[var(--foreground)]">
                            {item.userName || 'Membre Kanto'}
                          </span>
                        </div>

                        {/* Boutons d'action modérateur */}
                        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                          <button
                            onClick={() => void handleOpenAuditModal(item)}
                            disabled={isBusy}
                            title="Consulter l'historique d'audit des décisions"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition cursor-pointer"
                          >
                            <History size={13} />
                            <span>Historique</span>
                          </button>

                          <button
                            onClick={() => handleDeleteContribution(item)}
                            disabled={isBusy}
                            title="Supprimer définitivement"
                            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>

                          {!item.isDuplicateConfirmed && (
                            <button
                              onClick={() => void handleConfirmDuplicate(item)}
                              disabled={isBusy}
                              title="Marquer comme doublon (active le compte à rebours 24h et bloque les commentaires)"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                            >
                              <AlertTriangle size={13} />
                              <span>Doublon (24h)</span>
                            </button>
                          )}

                          <button
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                          >
                            <FileEdit size={13} />
                            <span>Ajustements</span>
                          </button>

                          <button
                            onClick={() =>
                              setActionModal({
                                isOpen: true,
                                item,
                                type: 'REJECT',
                                reason: '',
                              })
                            }
                            disabled={isBusy}
                            title="Rejeter la contribution avec un motif obligatoire"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                          >
                            <XCircle size={13} />
                            <span>Rejeter</span>
                          </button>

                          <button
                            onClick={() => void handleApprove(item)}
                            disabled={isBusy}
                            title="Approuver et intégrer au catalogue officiel (+50 XP)"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            <span>Valider & Publier</span>
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
        {/* ONGLET 2 : SIGNALEMENTS D'ABUS                                */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <RefreshCw size={15} className="animate-spin" />
                <span>Chargement des signalements...</span>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-16 text-center rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] p-8">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2 opacity-80" />
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Aucun signalement en attente
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
                  La communauté se porte bien ! Aucun contenu n&apos;a été signalé comme inapproprié ou abusif.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => {
                  const isBusy = isProcessing === report.id;

                  return (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-[var(--card)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                            <ShieldAlert size={12} />
                            <span>MOTIF : {report.reason}</span>
                          </span>

                          <span className="text-[11px] text-[var(--text-subtle)]">
                            {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <button
                          onClick={() => void handleResolveReport(report)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />
                          <span>Marquer comme résolu</span>
                        </button>
                      </div>

                      {/* Description du signalement */}
                      {report.description && (
                        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 text-xs">
                          <span className="text-[var(--text-subtle)] font-mono text-[10px] uppercase block mb-0.5">
                            Commentaire du signaleur :
                          </span>
                          <p className="text-[var(--foreground)]">{report.description}</p>
                        </div>
                      )}

                      <div className="text-[11px] text-[var(--text-subtle)]">
                        Signalé par : <span className="text-[var(--foreground)]">{report.reporterName || report.reportedBy}</span> &bull; Identifiant contenu : <code className="font-mono text-[10px]">{report.contentId}</code>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL DE DÉCISION (REJET OU DEMANDE DE MODIFICATIONS)          */}
        {/* ───────────────────────────────────────────────────────────── */}
        {actionModal?.isOpen && actionModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                  {actionModal.type === 'REQUEST_CHANGES' ? (
                    <>
                      <FileEdit size={16} className="text-amber-600" />
                      <span>Demander des ajustements à l&apos;auteur</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-rose-600" />
                      <span>Rejeter la contribution</span>
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setActionModal(null)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-[var(--text-muted)] space-y-1">
                <p>
                  Contribution :{' '}
                  <strong className="text-[var(--foreground)]">
                    « {actionModal.item.title || actionModal.item.content.slice(0, 40)} »
                  </strong>
                </p>
                <p>
                  Auteur :{' '}
                  <strong className="text-[var(--foreground)]">
                    {actionModal.item.userName || 'Membre'}
                  </strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)] block">
                  {actionModal.type === 'REQUEST_CHANGES'
                    ? 'Consignes & ajustements attendus :'
                    : 'Motif du rejet (transmis à l’auteur) :'}
                </label>
                <textarea
                  value={actionModal.reason}
                  onChange={(e) =>
                    setActionModal((prev) =>
                      prev ? { ...prev, reason: e.target.value } : null
                    )
                  }
                  rows={4}
                  placeholder={
                    actionModal.type === 'REQUEST_CHANGES'
                      ? 'Ex: Veuillez préciser le dialecte ou reformuler la traduction pour plus de clarté...'
                      : 'Ex: Contenu non conforme aux règles de la communauté ou propos inappropriés...'
                  }
                  className="w-full p-2.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--text-muted)] hover:bg-[var(--card-hover)] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => void handleSubmitDecision()}
                  disabled={!actionModal.reason.trim() || isProcessing === actionModal.item.id}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50 ${
                    actionModal.type === 'REQUEST_CHANGES'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isProcessing === actionModal.item.id
                    ? 'Enregistrement...'
                    : actionModal.type === 'REQUEST_CHANGES'
                    ? 'Envoyer les consignes'
                    : 'Confirmer le rejet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL D'HISTORIQUE D'AUDIT                                    */}
        {/* ───────────────────────────────────────────────────────────── */}
        {auditModal?.isOpen && auditModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--card-border)]">
                <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                  <History size={16} className="text-blue-600" />
                  <span>Historique des décisions & Audit</span>
                </h3>
                <button
                  onClick={() => setAuditModal(null)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-[var(--text-muted)]">
                Contribution :{' '}
                <strong className="text-[var(--foreground)]">
                  « {auditModal.item.title || auditModal.item.content.slice(0, 45)} »
                </strong>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {auditModal.isLoading ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Chargement de l&apos;historique...</span>
                  </div>
                ) : auditModal.logs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    Aucun événement d&apos;audit archivé pour cette contribution.
                  </div>
                ) : (
                  auditModal.logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--foreground)] uppercase text-[11px] font-mono">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-[var(--text-subtle)] font-mono">
                          {new Date(log.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>

                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                        <span>Acteur : <strong className="text-[var(--foreground)]">{log.userRole || 'SYSTEM'}</strong></span>
                        {log.fromStatus && log.toStatus && (
                          <span>
                            ({log.fromStatus} → <strong className="text-[var(--foreground)]">{log.toStatus}</strong>)
                          </span>
                        )}
                      </div>

                      {log.reason && (
                        <p className="text-[11px] bg-[var(--card)] p-2 rounded border border-[var(--card-border)] italic text-[var(--foreground)]">
                          « {log.reason} »
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-[var(--card-border)] flex justify-end">
                <button
                  onClick={() => setAuditModal(null)}
                  className="px-4 py-1.5 rounded-lg border border-[var(--card-border)] text-xs text-[var(--foreground)] hover:bg-[var(--card-hover)] cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
