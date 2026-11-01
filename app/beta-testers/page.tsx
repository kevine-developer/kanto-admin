'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/lib/hooks/useToast';
import {
  betaTestersService,
  BetaTester,
  BetaGroup,
  BetaVersion,
  BetaFeedback,
  BetaEmailTemplate,
  BetaAutomationConfig,
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
  Download,
  Trash2,
  Smartphone,
  Layers,
  MessageSquare,
  Mail,
  Settings,
  Plus,
  Filter,
  Eye,
  Check,
  AlertCircle,
  ExternalLink,
  Edit3,
  Save,
  X,
  FileSpreadsheet,
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
    label: 'Invité',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/25',
  },
  REJECTED: {
    label: 'Refusé / Désinscrit',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/25',
  },
};

type ActiveTab =
  | 'participants'
  | 'groups'
  | 'versions'
  | 'feedbacks'
  | 'templates'
  | 'automations';

export default function BetaTestersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('participants');
  const [isLoading, setIsLoading] = useState(true);

  // ─── ÉTATS PARTICIPANTS ───
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [stats, setStats] = useState<BetaTesterStats>({
    total: 0,
    androidCount: 0,
    iosCount: 0,
    bothPlatformsCount: 0,
    pendingCount: 0,
    invitedCount: 0,
    activeCount: 0,
    unsubscribedCount: 0,
    feedbacksCount: 0,
  });
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'ALL' | 'ANDROID' | 'IOS'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTesterIds, setSelectedTesterIds] = useState<string[]>([]);

  // ─── ÉTATS GROUPES ───
  const [groups, setGroups] = useState<BetaGroup[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BetaGroup | null>(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormDescription, setGroupFormDescription] = useState('');
  const [groupFormColor, setGroupFormColor] = useState('#4A6741');
  const [groupFormIsDefault, setGroupFormIsDefault] = useState(false);

  // ─── ÉTATS VERSIONS ───
  const [versions, setVersions] = useState<BetaVersion[]>([]);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionFormVersion, setVersionFormVersion] = useState('');
  const [versionFormBuild, setVersionFormBuild] = useState(1);
  const [versionFormPlatform, setVersionFormPlatform] = useState<'ANDROID' | 'IOS' | 'ALL'>('ALL');
  const [versionFormTitle, setVersionFormTitle] = useState('');
  const [versionFormNotes, setVersionFormNotes] = useState('');
  const [versionFormNotify, setVersionFormNotify] = useState(true);

  // ─── ÉTATS RETOURS / FEEDBACK ───
  const [feedbacks, setFeedbacks] = useState<BetaFeedback[]>([]);
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState('ALL');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('ALL');
  const [editingFeedback, setEditingFeedback] = useState<BetaFeedback | null>(null);

  // ─── ÉTATS MODÈLES D'EMAILS ───
  const [templates, setTemplates] = useState<BetaEmailTemplate[]>([]);
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('CONFIRMATION');
  const [templateFormSubject, setTemplateFormSubject] = useState('');
  const [templateFormTitle, setTemplateFormTitle] = useState('');
  const [templateFormContentHtml, setTemplateFormContentHtml] = useState('');
  const [templateFormButtonText, setTemplateFormButtonText] = useState('');
  const [templateFormButtonUrl, setTemplateFormButtonUrl] = useState('');
  const [templateTestEmail, setTemplateTestEmail] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  // ─── ÉTATS AUTOMATISATIONS ───
  const [automationConfig, setAutomationConfig] = useState<BetaAutomationConfig | null>(null);

  // ─── MODALES PARTICIPANT & EXPORTS ───
  const [detailTester, setDetailTester] = useState<BetaTester | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportedEmailsText, setExportedEmailsText] = useState('');

  // ─── CHARGEMENT DES DONNÉES ───
  const loadTesters = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await betaTestersService.getTesters({
        platform: selectedPlatform,
        status: selectedStatus,
        groupId: selectedGroupId,
        search: search.trim() || undefined,
        page,
        limit: 20,
      });

      setTesters(res.data);
      setTotalPages(res.totalPages || 1);
      if (res.stats) setStats(res.stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement testeurs.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlatform, selectedStatus, selectedGroupId, search, page, toast]);

  const loadGroups = useCallback(async () => {
    try {
      const data = await betaTestersService.getGroups();
      setGroups(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement cohortes.';
      toast.error(msg);
    }
  }, [toast]);

  const loadVersions = useCallback(async () => {
    try {
      const data = await betaTestersService.getVersions();
      setVersions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement versions.';
      toast.error(msg);
    }
  }, [toast]);

  const loadFeedbacks = useCallback(async () => {
    try {
      const res = await betaTestersService.getFeedbacks({
        category: feedbackCategoryFilter,
        status: feedbackStatusFilter,
        page: 1,
        limit: 50,
      });
      setFeedbacks(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement feedbacks.';
      toast.error(msg);
    }
  }, [feedbackCategoryFilter, feedbackStatusFilter, toast]);

  const loadTemplates = useCallback(async () => {
    try {
      const list = await betaTestersService.getTemplates();
      setTemplates(list);
      if (list.length > 0) {
        const found = list.find((t) => t.code === selectedTemplateCode) || list[0];
        setSelectedTemplateCode(found.code);
        setTemplateFormSubject(found.subject);
        setTemplateFormTitle(found.title);
        setTemplateFormContentHtml(found.contentHtml);
        setTemplateFormButtonText(found.buttonText || '');
        setTemplateFormButtonUrl(found.buttonUrl || '');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement modèles.';
      toast.error(msg);
    }
  }, [selectedTemplateCode, toast]);

  const loadAutomationConfig = useCallback(async () => {
    try {
      const config = await betaTestersService.getAutomationConfig();
      setAutomationConfig(config);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement automatisation.';
      toast.error(msg);
    }
  }, [toast]);

  // Synchronisation au montage et selon l'onglet actif
  useEffect(() => {
    if (activeTab === 'participants') {
      loadTesters();
      loadGroups();
    } else if (activeTab === 'groups') {
      loadGroups();
    } else if (activeTab === 'versions') {
      loadVersions();
    } else if (activeTab === 'feedbacks') {
      loadFeedbacks();
    } else if (activeTab === 'templates') {
      loadTemplates();
    } else if (activeTab === 'automations') {
      loadAutomationConfig();
    }
  }, [activeTab, loadTesters, loadGroups, loadVersions, loadFeedbacks, loadTemplates, loadAutomationConfig]);

  // ─── GESTIONNAIRES PARTICIPANTS ───

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTesterIds(testers.map((t) => t.id));
    } else {
      setSelectedTesterIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTesterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSendAndroidInvite = async (tester: BetaTester) => {
    try {
      await betaTestersService.sendAndroidInvite(tester.id);
      toast.success(`Invitation Google Play expédiée à ${tester.email}`);
      loadTesters();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur envoi invitation Android.';
      toast.error(msg);
    }
  };

  const handleSendIosInvite = async (tester: BetaTester) => {
    try {
      await betaTestersService.sendIosInvite(tester.id);
      toast.success(`Invitation TestFlight expédiée à ${tester.email}`);
      loadTesters();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur envoi invitation iOS.';
      toast.error(msg);
    }
  };

  const handleBulkAction = async (
    action: 'INVITE_ANDROID' | 'INVITE_IOS' | 'INVITE_BOTH' | 'ASSIGN_GROUP' | 'CHANGE_STATUS' | 'DELETE',
    targetGroupId?: string,
    targetStatus?: string
  ) => {
    if (selectedTesterIds.length === 0) return;
    if (action === 'DELETE' && !confirm(`Supprimer définitivement ${selectedTesterIds.length} participant(s) ?`)) return;

    try {
      const res = await betaTestersService.bulkAction({
        testerIds: selectedTesterIds,
        action,
        targetGroupId,
        targetStatus,
      });
      toast.success(res.message);
      setSelectedTesterIds([]);
      loadTesters();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur action groupée.';
      toast.error(msg);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await betaTestersService.exportCsv({
        platform: selectedPlatform,
        status: selectedStatus,
      });
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `kanto_beta_testers_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${res.count} testeur(s) exporté(s) en CSV.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur export CSV.';
      toast.error(msg);
    }
  };

  const handleOpenExportEmails = async () => {
    try {
      const res = await betaTestersService.exportEmails(selectedStatus);
      setExportedEmailsText(res.emails.join(', '));
      setIsExportModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur export emails.';
      toast.error(msg);
    }
  };

  // ─── GESTIONNAIRES GROUPES ───

  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormName('');
    setGroupFormDescription('');
    setGroupFormColor('#4A6741');
    setGroupFormIsDefault(false);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupFormName.trim()) {
      toast.error('Le nom du groupe est obligatoire.');
      return;
    }
    try {
      if (editingGroup) {
        await betaTestersService.updateGroup(editingGroup.id, {
          name: groupFormName.trim(),
          description: groupFormDescription.trim() || undefined,
          color: groupFormColor,
          isDefault: groupFormIsDefault,
        });
        toast.success('Groupe mis à jour.');
      } else {
        await betaTestersService.createGroup({
          name: groupFormName.trim(),
          description: groupFormDescription.trim() || undefined,
          color: groupFormColor,
          isDefault: groupFormIsDefault,
        });
        toast.success('Groupe créé.');
      }
      setIsGroupModalOpen(false);
      loadGroups();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur sauvegarde groupe.';
      toast.error(msg);
    }
  };

  const handleDeleteGroup = async (group: BetaGroup) => {
    if (!confirm(`Supprimer le groupe "${group.name}" ? Les testeurs associés seront réaffectés au groupe par défaut.`)) return;
    try {
      await betaTestersService.deleteGroup(group.id);
      toast.success('Groupe supprimé.');
      loadGroups();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression groupe.';
      toast.error(msg);
    }
  };

  // ─── GESTIONNAIRES VERSIONS ───

  const handleCreateVersion = async () => {
    if (!versionFormVersion.trim() || !versionFormBuild) {
      toast.error('Version et build requis.');
      return;
    }
    try {
      await betaTestersService.createVersion({
        version: versionFormVersion.trim(),
        buildNumber: Number(versionFormBuild),
        platform: versionFormPlatform,
        title: versionFormTitle.trim() || undefined,
        releaseNotes: versionFormNotes.trim() || undefined,
        notifyTesters: versionFormNotify,
      });
      toast.success(`Version ${versionFormVersion} enregistrée avec succès.`);
      setIsVersionModalOpen(false);
      loadVersions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur enregistrement version.';
      toast.error(msg);
    }
  };

  const handleNotifyVersion = async (version: BetaVersion) => {
    if (!confirm(`Notifier tous les testeurs éligibles pour la version ${version.version} ?`)) return;
    try {
      const res = await betaTestersService.notifyVersion(version.id);
      toast.success(res.message);
      loadVersions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur notification version.';
      toast.error(msg);
    }
  };

  // ─── GESTIONNAIRES TEMPLATES D'EMAILS ───

  const handleSelectTemplate = (tpl: BetaEmailTemplate) => {
    setSelectedTemplateCode(tpl.code);
    setTemplateFormSubject(tpl.subject);
    setTemplateFormTitle(tpl.title);
    setTemplateFormContentHtml(tpl.contentHtml);
    setTemplateFormButtonText(tpl.buttonText || '');
    setTemplateFormButtonUrl(tpl.buttonUrl || '');
  };

  const handleSaveTemplate = async () => {
    try {
      await betaTestersService.updateTemplate(selectedTemplateCode, {
        subject: templateFormSubject,
        title: templateFormTitle,
        contentHtml: templateFormContentHtml,
        buttonText: templateFormButtonText || undefined,
        buttonUrl: templateFormButtonUrl || undefined,
      });
      toast.success('Modèle d’e-mail enregistré.');
      loadTemplates();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur sauvegarde modèle.';
      toast.error(msg);
    }
  };

  const handleSendTestEmail = async () => {
    if (!templateTestEmail.trim() || !templateTestEmail.includes('@')) {
      toast.error('Veuillez saisir une adresse e-mail valide pour le test.');
      return;
    }
    try {
      setIsSendingTestEmail(true);
      await betaTestersService.sendTestEmail(selectedTemplateCode, templateTestEmail.trim());
      toast.success(`E-mail de test expédié à ${templateTestEmail} via Resend.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur envoi email test.';
      toast.error(msg);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // ─── GESTIONNAIRES AUTOMATISATIONS ───

  const handleUpdateAutomation = async (partial: Partial<BetaAutomationConfig>) => {
    try {
      const updated = await betaTestersService.updateAutomationConfig(partial);
      setAutomationConfig(updated);
      toast.success('Paramètres d’automatisation mis à jour.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise à jour configuration.';
      toast.error(msg);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Programme Bêta Kanto MG"
          description="Plateforme unifiée de gestion des bêta-testeurs Android (Google Play) et iOS (TestFlight)."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handleOpenExportEmails}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Copier Emails</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'participants') loadTesters();
                  if (activeTab === 'groups') loadGroups();
                  if (activeTab === 'versions') loadVersions();
                  if (activeTab === 'feedbacks') loadFeedbacks();
                  if (activeTab === 'templates') loadTemplates();
                  if (activeTab === 'automations') loadAutomationConfig();
                }}
                className="p-2 text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition"
                title="Actualiser"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          }
        />

        {/* ─── KPIS GLOBAUX TEMPS RÉEL ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Total Inscrits</span>
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.total}</p>
          </div>

          <div className="p-4 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Android</span>
              <Smartphone className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.androidCount}</p>
          </div>

          <div className="p-4 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Apple iOS</span>
              <span className="text-xs font-semibold text-sky-500">iOS</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">{stats.iosCount}</p>
          </div>

          <div className="p-4 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">En attente</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingCount}</p>
          </div>

          <div className="p-4 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Invités</span>
              <Send className="w-4 h-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.invitedCount}</p>
          </div>

          <div className="p-4 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Retours & Bugs</span>
              <MessageSquare className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.feedbacksCount}</p>
          </div>
        </div>

        {/* ─── NAVIGATION PAR ONGLETS ─── */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === 'participants'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Participants ({stats.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === 'groups'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Groupes & Cohortes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === 'versions'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Versions Bêta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedbacks')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === 'feedbacks'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Retours Utilisateurs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === 'templates'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Modèles d'Emails (10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('automations')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === 'automations'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Automatisations</span>
          </button>
        </div>

        {/* ─── ONGLET 1 : PARTICIPANTS ─── */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            {/* Barre de filtres */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Rechercher par e-mail ou nom..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Filtre Plateforme */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-stone-400 mr-1">Plateforme :</span>
                {(['ALL', 'ANDROID', 'IOS'] as const).map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => {
                      setSelectedPlatform(plat);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      selectedPlatform === plat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {plat === 'ALL' ? 'Toutes' : plat === 'ANDROID' ? 'Android' : 'iOS'}
                  </button>
                ))}
              </div>

              {/* Filtre Statut */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-stone-400 mr-1">Statut :</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="APPROVED">Approuvé</option>
                  <option value="INVITED">Invité</option>
                  <option value="REJECTED">Refusé</option>
                </select>
              </div>

              {/* Filtre Groupe */}
              {groups.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-stone-400 mr-1">Cohorte :</span>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => {
                      setSelectedGroupId(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md focus:outline-none"
                  >
                    <option value="ALL">Toutes les cohortes</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Barre d'action groupée flottante */}
            {selectedTesterIds.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                  {selectedTesterIds.length} participant(s) sélectionné(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkAction('INVITE_ANDROID')}
                    className="px-2.5 py-1 font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition"
                  >
                    Inviter Android
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('INVITE_IOS')}
                    className="px-2.5 py-1 font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-md transition"
                  >
                    Inviter iOS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('INVITE_BOTH')}
                    className="px-2.5 py-1 font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
                  >
                    Inviter les Deux
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('CHANGE_STATUS', undefined, 'APPROVED')}
                    className="px-2.5 py-1 font-medium bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-md transition"
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction('DELETE')}
                    className="px-2.5 py-1 font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-md transition"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}

            {/* Tableau des participants */}
            <div className="bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-900/40 text-stone-500 dark:text-stone-400 font-semibold">
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedTesterIds.length === testers.length && testers.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3">Participant</th>
                    <th className="p-3">Plateformes</th>
                    <th className="p-3">Cohorte</th>
                    <th className="p-3">Statut Android</th>
                    <th className="p-3">Statut iOS</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        Chargement des testeurs...
                      </td>
                    </tr>
                  ) : testers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        Aucun testeur trouvé avec ces critères.
                      </td>
                    </tr>
                  ) : (
                    testers.map((tester) => {
                      const hasAndroid = tester.platforms.includes('ANDROID');
                      const hasIos = tester.platforms.includes('IOS');
                      return (
                        <tr
                          key={tester.id}
                          className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition"
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedTesterIds.includes(tester.id)}
                              onChange={() => handleToggleSelect(tester.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-stone-900 dark:text-stone-100">
                              {tester.email}
                            </div>
                            {tester.fullName && (
                              <div className="text-[11px] text-stone-400">{tester.fullName}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {hasAndroid && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                                  Android
                                </span>
                              )}
                              {hasIos && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded">
                                  iOS
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {tester.group ? (
                              <span
                                className="px-2 py-0.5 text-[10px] font-medium rounded-full border"
                                style={{
                                  borderColor: tester.group.color || '#4A6741',
                                  color: tester.group.color || '#4A6741',
                                }}
                              >
                                {tester.group.name}
                              </span>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {hasAndroid ? (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                                  tester.androidStatus === 'INVITED' || tester.androidStatus === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                                }`}
                              >
                                {tester.androidStatus}
                              </span>
                            ) : (
                              <span className="text-stone-300 dark:text-stone-600 text-[11px]">Non requis</span>
                            )}
                          </td>
                          <td className="p-3">
                            {hasIos ? (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                                  tester.iosStatus === 'INVITED' || tester.iosStatus === 'ACTIVE'
                                    ? 'bg-sky-500/10 text-sky-600 border-sky-500/25'
                                    : 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                                }`}
                              >
                                {tester.iosStatus}
                              </span>
                            ) : (
                              <span className="text-stone-300 dark:text-stone-600 text-[11px]">Non requis</span>
                            )}
                          </td>
                          <td className="p-3 text-stone-500 text-[11px]">
                            {new Date(tester.createdAt).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {hasAndroid && (
                                <button
                                  type="button"
                                  onClick={() => handleSendAndroidInvite(tester)}
                                  className="px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition"
                                  title="Envoyer invitation Google Play"
                                >
                                  Invite Play
                                </button>
                              )}
                              {hasIos && (
                                <button
                                  type="button"
                                  onClick={() => handleSendIosInvite(tester)}
                                  className="px-2 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded transition"
                                  title="Envoyer invitation TestFlight"
                                >
                                  Invite iOS
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDetailTester(tester)}
                                className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition"
                                title="Voir fiche détaillée"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-stone-200 dark:border-stone-700 text-xs">
                  <span className="text-stone-400">
                    Page {page} sur {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-stone-700 dark:text-stone-300 disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 text-stone-700 dark:text-stone-300 disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── ONGLET 2 : GROUPES & COHORTES ─── */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500">
                Segmentez vos testeurs en cohortes (Early Access, VIP, Beta 1, etc.) pour cibler vos annonces et versions.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateGroup}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau Groupe</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 w-1.5 h-full"
                    style={{ backgroundColor: group.color || '#4A6741' }}
                  />
                  <div className="pl-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {group.name}
                      </h3>
                      {group.isDefault && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-stone-500 line-clamp-2">
                      {group.description || 'Aucune description fournie.'}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-stone-100 dark:border-stone-700/60">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {group._count?.testers || 0} participant(s)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGroup(group);
                            setGroupFormName(group.name);
                            setGroupFormDescription(group.description || '');
                            setGroupFormColor(group.color || '#4A6741');
                            setGroupFormIsDefault(group.isDefault);
                            setIsGroupModalOpen(true);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!group.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDeleteGroup(group)}
                            className="p-1 text-rose-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ONGLET 3 : VERSIONS BÊTA ─── */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-stone-500">
                Historique des builds déployés et notification ciblée des testeurs par e-mail.
              </p>
              <button
                type="button"
                onClick={() => {
                  setVersionFormVersion('0.1.0');
                  setVersionFormBuild(32);
                  setVersionFormPlatform('ALL');
                  setVersionFormTitle('');
                  setVersionFormNotes('');
                  setVersionFormNotify(true);
                  setIsVersionModalOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enregistrer une Version</span>
              </button>
            </div>

            <div className="bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-900/40 text-stone-500 font-semibold">
                    <th className="p-3">Version & Build</th>
                    <th className="p-3">Plateforme</th>
                    <th className="p-3">Titre / Notes</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Date Notification</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {versions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        Aucune version enregistrée pour le moment.
                      </td>
                    </tr>
                  ) : (
                    versions.map((ver) => (
                      <tr key={ver.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                        <td className="p-3">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            v{ver.version}
                          </span>{' '}
                          <span className="text-stone-400">(build {ver.buildNumber})</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded">
                            {ver.platform}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs truncate text-stone-600 dark:text-stone-300">
                          {ver.title || ver.releaseNotes || '—'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 rounded">
                            {ver.status}
                          </span>
                        </td>
                        <td className="p-3 text-stone-400 text-[11px]">
                          {ver.notifiedAt
                            ? new Date(ver.notifiedAt).toLocaleDateString('fr-FR')
                            : 'Non notifié'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleNotifyVersion(ver)}
                            className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition"
                          >
                            Notifier Testeurs
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

        {/* ─── ONGLET 4 : RETOURS & FEEDBACK ─── */}
        {activeTab === 'feedbacks' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl text-xs">
              <span className="text-stone-400">Filtrer par catégorie :</span>
              <select
                value={feedbackCategoryFilter}
                onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
                className="px-2.5 py-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md"
              >
                <option value="ALL">Toutes les catégories</option>
                <option value="BUG">Bugs</option>
                <option value="UI_UX">Interface & Design</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="SUGGESTION">Suggestions</option>
              </select>

              <span className="text-stone-400 ml-2">Statut :</span>
              <select
                value={feedbackStatusFilter}
                onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="NEW">Nouveau</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="RESOLVED">Résolu</option>
                <option value="CLOSED">Fermé</option>
              </select>
            </div>

            <div className="bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-700/80 bg-stone-50 dark:bg-stone-900/40 text-stone-500 font-semibold">
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Testeur</th>
                    <th className="p-3">Plateforme</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Priorité</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {feedbacks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-400">
                        Aucun retour enregistré.
                      </td>
                    </tr>
                  ) : (
                    feedbacks.map((fb) => (
                      <tr key={fb.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              fb.category === 'BUG'
                                ? 'bg-rose-500/10 text-rose-600'
                                : 'bg-blue-500/10 text-blue-600'
                            }`}
                          >
                            {fb.category}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-stone-900 dark:text-stone-100">{fb.email}</div>
                        </td>
                        <td className="p-3 text-stone-500">{fb.platform}</td>
                        <td className="p-3 max-w-sm truncate text-stone-600 dark:text-stone-300">
                          {fb.description}
                        </td>
                        <td className="p-3">
                          <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                            {fb.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded">
                            {fb.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingFeedback(fb)}
                            className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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

        {/* ─── ONGLET 5 : MODÈLES D'EMAILS ─── */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des 10 modèles */}
            <div className="bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl p-3 space-y-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider px-2 block mb-2">
                Modèles de communication
              </span>
              {templates.map((tpl) => (
                <button
                  key={tpl.code}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition flex items-center justify-between ${
                    selectedTemplateCode === tpl.code
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                  }`}
                >
                  <span>{tpl.name}</span>
                  <span className="text-[10px] text-stone-400">{tpl.code}</span>
                </button>
              ))}
            </div>

            {/* Éditeur de modèle */}
            <div className="lg:col-span-2 bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-700/60">
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    Édition du modèle : {selectedTemplateCode}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Variables disponibles : &#123;&#123;userName&#125;&#125;, &#123;&#123;platform&#125;&#125;, &#123;&#123;downloadLink&#125;&#125;, &#123;&#123;testFlightLink&#125;&#125;, &#123;&#123;appVersion&#125;&#125;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Objet de l'e-mail
                </label>
                <input
                  type="text"
                  value={templateFormSubject}
                  onChange={(e) => setTemplateFormSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Titre d'accroche (Header)
                </label>
                <input
                  type="text"
                  value={templateFormTitle}
                  onChange={(e) => setTemplateFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Corps du message (HTML autorisé)
                </label>
                <textarea
                  rows={6}
                  value={templateFormContentHtml}
                  onChange={(e) => setTemplateFormContentHtml(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Libellé bouton principal
                  </label>
                  <input
                    type="text"
                    value={templateFormButtonText}
                    onChange={(e) => setTemplateFormButtonText(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Lien bouton principal
                  </label>
                  <input
                    type="text"
                    value={templateFormButtonUrl}
                    onChange={(e) => setTemplateFormButtonUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Envoi d'email de test */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <input
                    type="email"
                    placeholder="votre.email@test.com"
                    value={templateTestEmail}
                    onChange={(e) => setTemplateTestEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isSendingTestEmail}
                    onClick={handleSendTestEmail}
                    className="px-3 py-1.5 text-xs font-semibold bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 text-white rounded-lg transition whitespace-nowrap disabled:opacity-50"
                  >
                    {isSendingTestEmail ? 'Envoi...' : 'Tester le rendu'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ONGLET 6 : AUTOMATISATIONS ─── */}
        {activeTab === 'automations' && automationConfig && (
          <div className="max-w-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60 rounded-xl p-5 space-y-5">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 pb-2 border-b border-stone-100 dark:border-stone-700/60">
              Paramètres d’automatisation & Liens globaux
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                    Confirmation automatique d'inscription
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Envoie un e-mail de confirmation dès la soumission du formulaire bêta.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={automationConfig.autoConfirmRegistration}
                  onChange={(e) => handleUpdateAutomation({ autoConfirmRegistration: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                    Invitation automatique dès approbation
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Expédie immédiatement le lien Google Play / TestFlight lorsque le statut passe à "Approuvé".
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={automationConfig.autoInviteOnApproval}
                  onChange={(e) => handleUpdateAutomation({ autoInviteOnApproval: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                    Notification automatique des nouvelles versions
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Alerte par email tous les testeurs lors de la publication d'un nouveau build compatible.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={automationConfig.autoNotifyNewVersions}
                  onChange={(e) => handleUpdateAutomation({ autoNotifyNewVersions: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-700/60 space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Lien Web Closed Testing Google Play
                </label>
                <input
                  type="text"
                  value={automationConfig.playStoreWebLink}
                  onChange={(e) => handleUpdateAutomation({ playStoreWebLink: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Lien Public TestFlight Apple iOS
                </label>
                <input
                  type="text"
                  value={automationConfig.testFlightPublicLink || ''}
                  placeholder="https://testflight.apple.com/join/..."
                  onChange={(e) => handleUpdateAutomation({ testFlightPublicLink: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Adresse e-mail support bêta
                </label>
                <input
                  type="email"
                  value={automationConfig.supportEmail}
                  onChange={(e) => handleUpdateAutomation({ supportEmail: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── MODALE DÉTAILS TESTEUR ─── */}
        {detailTester && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-700">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Fiche participant : {detailTester.email}
                </h3>
                <button
                  type="button"
                  onClick={() => setDetailTester(null)}
                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-stone-400 block">Nom complet</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {detailTester.fullName || 'Non spécifié'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Cohorte</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {detailTester.group?.name || 'Aucune'}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Statut Android</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {detailTester.androidStatus} (invité {detailTester.androidInviteCount}x)
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">Statut iOS</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {detailTester.iosStatus} (invité {detailTester.iosInviteCount}x)
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-stone-400 block">Date d'inscription</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {new Date(detailTester.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDetailTester(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODALE COPIER EMAILS ─── */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-700">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Export des adresses e-mail
                </h3>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                readOnly
                rows={8}
                value={exportedEmailsText}
                className="w-full p-3 text-xs font-mono bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg select-all"
              />

              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-400">
                  Prêt à coller dans Google Play Console ou App Store Connect.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(exportedEmailsText);
                    toast.success('Adresses copiées dans le presse-papier !');
                  }}
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  Copier tout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODALE CRÉATION / ÉDITION GROUPE ─── */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                {editingGroup ? 'Modifier la cohorte' : 'Créer une nouvelle cohorte'}
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1">Nom du groupe</label>
                  <input
                    type="text"
                    value={groupFormName}
                    onChange={(e) => setGroupFormName(e.target.value)}
                    placeholder="Ex: Early Access VIP"
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={groupFormDescription}
                    onChange={(e) => setGroupFormDescription(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1">Couleur</label>
                  <input
                    type="color"
                    value={groupFormColor}
                    onChange={(e) => setGroupFormColor(e.target.value)}
                    className="w-12 h-8 p-0 border-0 rounded cursor-pointer"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={groupFormIsDefault}
                    onChange={(e) => setGroupFormIsDefault(e.target.checked)}
                    className="rounded"
                  />
                  <span>Groupe par défaut pour les nouveaux inscrits</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveGroup}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODALE CRÉATION VERSION ─── */}
        {isVersionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-200 dark:border-stone-700 shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Enregistrer une nouvelle version bêta
              </h3>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 mb-1">Version</label>
                    <input
                      type="text"
                      value={versionFormVersion}
                      onChange={(e) => setVersionFormVersion(e.target.value)}
                      placeholder="0.1.0"
                      className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 mb-1">Build Number</label>
                    <input
                      type="number"
                      value={versionFormBuild}
                      onChange={(e) => setVersionFormBuild(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1">Plateforme ciblée</label>
                  <select
                    value={versionFormPlatform}
                    onChange={(e) => setVersionFormPlatform(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg"
                  >
                    <option value="ALL">Android & iOS</option>
                    <option value="ANDROID">Android uniquement</option>
                    <option value="IOS">iOS uniquement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1">Titre de la release</label>
                  <input
                    type="text"
                    value={versionFormTitle}
                    onChange={(e) => setVersionFormTitle(e.target.value)}
                    placeholder="Mise à jour majeure quiz & contes"
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1">Release Notes</label>
                  <textarea
                    rows={3}
                    value={versionFormNotes}
                    onChange={(e) => setVersionFormNotes(e.target.value)}
                    placeholder="Améliorations de fluidité et corrections..."
                    className="w-full px-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={versionFormNotify}
                    onChange={(e) => setVersionFormNotify(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Notifier immédiatement les testeurs concernés par e-mail</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setIsVersionModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateVersion}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg"
                >
                  Enregistrer la version
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
