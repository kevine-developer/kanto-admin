'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminShell } from '@/components/layout/AdminShell';
import { useToast } from '@/lib/hooks/useToast';
import {
  eventsAdminService,
  EventAdminItem,
  EventAdminOverview,
  EventCategory,
  EventStatus,
  EventParticipationType,
  EventRewardType,
  AdminEventParticipantItem,
  CreateEventInput,
} from '@/services/events.service';
import {
  Calendar,
  Plus,
  Search,
  Users,
  Gift,
  Zap,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
  Trash2,
  Edit,
  RefreshCw,
  Loader2,
  X,
  Play,
  Pause,
  Ban,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';

function EventsAdminPageContent() {
  const { toast } = useToast();

  // États principaux
  const [overview, setOverview] = useState<EventAdminOverview | null>(null);
  const [events, setEvents] = useState<EventAdminItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);


  // Debounce de recherche pour éviter de saturer l'API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Modal Création / Édition
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventAdminItem | null>(null);

  // Champs de formulaire
  const [formSlug, setFormSlug] = useState('');
  const [formTitleFr, setFormTitleFr] = useState('');
  const [formTitleMg, setFormTitleMg] = useState('');
  const [formShortDescFr, setFormShortDescFr] = useState('');
  const [formShortDescMg, setFormShortDescMg] = useState('');
  const [formDescriptionFr, setFormDescriptionFr] = useState('');
  const [formDescriptionMg, setFormDescriptionMg] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('CULTURE');
  const [formParticipationType, setFormParticipationType] = useState<EventParticipationType>('OPEN');
  const [formMinTier, setFormMinTier] = useState('FREE');
  const [formLocation, setFormLocation] = useState('');
  const [formExternalUrl, setFormExternalUrl] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formRegistrationDeadline, setFormRegistrationDeadline] = useState('');
  const [formMaxParticipants, setFormMaxParticipants] = useState<string>('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formRulesFr, setFormRulesFr] = useState('');
  const [formRulesMg, setFormRulesMg] = useState('');
  const [formGameModuleId, setFormGameModuleId] = useState('');

  // Récompenses en formulaire
  const [formRewards, setFormRewards] = useState<
    {
      rewardType: EventRewardType;
      titleFr: string;
      titleMg: string;
      amount?: number;
      badgeId?: string;
      lotDescription?: string;
      criteria?: string;
    }[]
  >([]);

  // Modal Participants
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<EventAdminItem | null>(null);
  const [participants, setParticipants] = useState<AdminEventParticipantItem[]>([]);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
  const [participantsPage, setParticipantsPage] = useState(1);
  const [participantsTotalPages, setParticipantsTotalPages] = useState(1);
  const [participantsTotal, setParticipantsTotal] = useState(0);

  // Modal Statut / Annulation
  const [statusModalEvent, setStatusModalEvent] = useState<EventAdminItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<EventStatus | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Modal Suppression / Archivage
  const [deleteModalEvent, setDeleteModalEvent] = useState<EventAdminItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Chargement des données réelles ─────────────────────────────────────────

  const loadOverview = useCallback(async () => {
    try {
      setIsOverviewLoading(true);
      const data = await eventsAdminService.getOverview();
      setOverview(data);
    } catch (err: unknown) {
      console.error('Erreur chargement overview:', err);
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await eventsAdminService.getEvents({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
        category: categoryFilter,
        search: debouncedSearch.trim() || undefined,
      });
      setEvents(res.items || []);
      setPagination((prev) => ({
        ...prev,
        total: res.pagination?.total ?? 0,
        totalPages: res.pagination?.totalPages ?? 1,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger la liste des événements.';
      toastRef.current.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, categoryFilter, debouncedSearch]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ─── Gestion des participants ───────────────────────────────────────────────

  const openParticipantsModal = async (event: EventAdminItem, page = 1) => {
    setSelectedEventForParticipants(event);
    setIsParticipantsModalOpen(true);
    setIsParticipantsLoading(true);
    setParticipantsPage(page);

    try {
      const res = await eventsAdminService.getParticipants(event.id, { page, limit: 15 });
      setParticipants(res.items || []);
      setParticipantsTotal(res.pagination?.total ?? 0);
      setParticipantsTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des participants.';
      toast.error(msg);
    } finally {
      setIsParticipantsLoading(false);
    }
  };

  // ─── Formulaire Création & Édition ──────────────────────────────────────────

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormSlug('');
    setFormTitleFr('');
    setFormTitleMg('');
    setFormShortDescFr('');
    setFormShortDescMg('');
    setFormDescriptionFr('');
    setFormDescriptionMg('');
    setFormCategory('CULTURE');
    setFormParticipationType('OPEN');
    setFormMinTier('FREE');
    setFormLocation('Fampiharana Kanto MG');
    setFormExternalUrl('');

    // Dates par défaut (aujourd'hui -> +7 jours)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    setFormStartDate(now.toISOString().slice(0, 16));
    setFormEndDate(nextWeek.toISOString().slice(0, 16));
    setFormRegistrationDeadline('');
    setFormMaxParticipants('');
    setFormIsFeatured(false);
    setFormRulesFr('');
    setFormRulesMg('');
    setFormGameModuleId('');
    setFormRewards([
      {
        rewardType: 'XP',
        titleFr: 'Bonus d’expérience +150 XP',
        titleMg: 'Traikefa +150 XP',
        amount: 150,
        criteria: 'completion',
      },
    ]);

    setIsFormModalOpen(true);
  };

  const searchParams = useSearchParams();
  const hasAutoCreatedRef = useRef(false);

  useEffect(() => {
    if (hasAutoCreatedRef.current) return;
    if (searchParams?.get('create') === 'true' || searchParams?.get('create') === '1') {
      hasAutoCreatedRef.current = true;
      openCreateModal();
    }
  }, [searchParams]);

  const openEditModal = (event: EventAdminItem) => {
    setEditingEvent(event);
    setFormSlug(event.slug);
    setFormTitleFr(event.titleFr);
    setFormTitleMg(event.titleMg);
    setFormShortDescFr(event.shortDescFr || '');
    setFormShortDescMg(event.shortDescMg || '');
    setFormDescriptionFr(event.descriptionFr);
    setFormDescriptionMg(event.descriptionMg);
    setFormCategory(event.category);
    setFormParticipationType(event.participationType);
    setFormMinTier(event.minTier || 'FREE');
    setFormLocation(event.location || '');
    setFormExternalUrl(event.externalUrl || '');
    setFormStartDate(new Date(event.startDate).toISOString().slice(0, 16));
    setFormEndDate(new Date(event.endDate).toISOString().slice(0, 16));
    setFormRegistrationDeadline(
      event.registrationDeadline
        ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
        : ''
    );
    setFormMaxParticipants(event.maxParticipants ? String(event.maxParticipants) : '');
    setFormIsFeatured(event.isFeatured);
    setFormRulesFr(event.rulesFr || '');
    setFormRulesMg(event.rulesMg || '');
    const moduleMetadata =
      typeof event.metadata?.gameModuleId === 'string'
        ? event.metadata.gameModuleId
        : '';
    setFormGameModuleId(moduleMetadata);
    setFormRewards(
      event.rewards?.map((r) => ({
        rewardType: r.rewardType,
        titleFr: r.titleFr,
        titleMg: r.titleMg,
        amount: r.amount || undefined,
        badgeId: r.badgeId || undefined,
        lotDescription: r.lotDescription || undefined,
        criteria: r.criteria || 'completion',
      })) || []
    );

    setIsFormModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitleFr.trim() || !formTitleMg.trim()) {
      toast.error('Le titre en français et en malgache est obligatoire.');
      return;
    }
    if (!formDescriptionFr.trim() || !formDescriptionMg.trim()) {
      toast.error('La description en français et en malgache est obligatoire.');
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast.error('Les dates de début et de fin sont obligatoires.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateEventInput = {
        titleFr: formTitleFr.trim(),
        titleMg: formTitleMg.trim(),
        shortDescFr: formShortDescFr.trim() || undefined,
        shortDescMg: formShortDescMg.trim() || undefined,
        descriptionFr: formDescriptionFr.trim(),
        descriptionMg: formDescriptionMg.trim(),
        category: formCategory,
        participationType: formParticipationType,
        minTier: formMinTier,
        location: formLocation.trim() || undefined,
        externalUrl: formExternalUrl.trim() || undefined,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        registrationDeadline: formRegistrationDeadline
          ? new Date(formRegistrationDeadline).toISOString()
          : undefined,
        maxParticipants: formMaxParticipants ? parseInt(formMaxParticipants, 10) : undefined,
        isFeatured: formIsFeatured,
        rulesFr: formRulesFr.trim() || undefined,
        rulesMg: formRulesMg.trim() || undefined,
        metadata: formGameModuleId ? { gameModuleId: formGameModuleId } : undefined,
      };

      if (editingEvent) {
        await eventsAdminService.updateEvent(editingEvent.id, payload);
        toast.success(`Événement "${payload.titleFr}" mis à jour avec succès.`);
      } else {
        payload.slug = formSlug.trim() || undefined;
        payload.rewards = formRewards;
        await eventsAdminService.createEvent(payload);
        toast.success(`Événement "${payload.titleFr}" créé avec succès (Brouillon).`);
      }

      setIsFormModalOpen(false);
      await Promise.all([loadEvents(), loadOverview()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement de l’événement.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Changement de Statut ──────────────────────────────────────────────────

  const openStatusModal = (event: EventAdminItem, nextStatus: EventStatus) => {
    setStatusModalEvent(event);
    setTargetStatus(nextStatus);
    setCancelReason('');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalEvent || !targetStatus) return;

    try {
      setIsStatusUpdating(true);
      await eventsAdminService.updateStatus(
        statusModalEvent.id,
        targetStatus,
        targetStatus === 'CANCELLED' ? cancelReason.trim() : undefined
      );

      toast.success(
        `Statut mis à jour : l'événement est désormais "${targetStatus}".`
      );
      setStatusModalEvent(null);
      setTargetStatus(null);
      await Promise.all([loadEvents(), loadOverview()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de modifier le statut de l’événement.';
      toast.error(msg);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // ─── Suppression / Archivage ───────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!deleteModalEvent) return;

    try {
      setIsDeleting(true);
      const res = await eventsAdminService.deleteEvent(deleteModalEvent.id);
      if (res.action === 'ARCHIVED') {
        toast.info(res.message);
      } else {
        toast.success(res.message);
      }
      setDeleteModalEvent(null);
      await Promise.all([loadEvents(), loadOverview()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression de l’événement.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Helpers visuels ───────────────────────────────────────────────────────

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En cours (Actif)
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-300">
            Publié
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300">
            <Clock size={11} /> Programmé
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300">
            Brouillon
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-300">
            <Pause size={11} /> Suspendu
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300">
            <CheckCircle2 size={11} /> Terminé
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-300">
            <Ban size={11} /> Annulé
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300">
            <Archive size={11} /> Archivé
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const getCategoryBadge = (cat: EventCategory) => {
    const map: Record<EventCategory, { label: string; bg: string }> = {
      CULTURE: { label: 'Culture', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      CHALLENGE: { label: 'Défi', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      REWARD: { label: 'Récompense', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
      COMMUNITY: { label: 'Communauté', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
      SEASONAL: { label: 'Saisonnier', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
      SPECIAL: { label: 'Spécial', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    };
    const c = map[cat] || { label: cat, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* En-tête de page */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--accent)] text-white">
                <Calendar size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                  Événements & Défis Kanto MG
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  Gestion centralisée, cycle de vie, récompenses et suivi en direct des participants réels.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadOverview();
                loadEvents();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition-colors"
              title="Rafraîchir les données"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] hover:opacity-90 text-white shadow-sm transition-opacity"
            >
              <Plus size={16} />
              <span>Créer un événement</span>
            </button>
          </div>
        </div>

        {/* ─── TABLEAU DE BORD KPI RÉEL ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
            <span className="text-xs text-[var(--text-muted)] font-medium">Total Événements</span>
            <div className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.totalEvents ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">En base de données</span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">En cours (Actifs)</span>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.activeCount ?? 0}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500">Visibles sur mobile</span>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs">
            <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">Programmés</span>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.scheduledCount ?? 0}
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-500">Démarrage planifié</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
            <span className="text-xs text-[var(--text-muted)] font-medium">Inscriptions réelles</span>
            <div className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.totalRegistrations ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Participants enregistrés</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Défis complétés</span>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.completedParticipations ?? 0}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-500">Participations terminées</span>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs">
            <span className="text-xs text-purple-800 dark:text-purple-300 font-medium">Récompenses remises</span>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.totalRewardsDistributed ?? 0}
            </div>
            <span className="text-[11px] text-purple-600 dark:text-purple-500">XP, Vola & Badges réels</span>
          </div>
        </div>

        {/* ─── FILTRES & RECHERCHE ───────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Rechercher par titre ou slug..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filtre Statut */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">En cours (Actifs)</option>
              <option value="PUBLISHED">Publiés</option>
              <option value="SCHEDULED">Programmés</option>
              <option value="DRAFT">Brouillons</option>
              <option value="SUSPENDED">Suspendus</option>
              <option value="COMPLETED">Terminés</option>
              <option value="CANCELLED">Annulés</option>
              <option value="ARCHIVED">Archivés</option>
            </select>

            {/* Filtre Catégorie */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
            >
              <option value="ALL">Toutes les catégories</option>
              <option value="CULTURE">Culture</option>
              <option value="CHALLENGE">Défis & Jeux</option>
              <option value="REWARD">Récompenses</option>
              <option value="COMMUNITY">Communauté</option>
              <option value="SEASONAL">Saisonnier</option>
              <option value="SPECIAL">Spécial Kanto</option>
            </select>
          </div>
        </div>

        {/* ─── TABLEAU DES ÉVÉNEMENTS ────────────────────────────────────────── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--background)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Événement & Thème</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 font-semibold">Période</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold text-center">Participants</th>
                  <th className="px-4 py-3 font-semibold">Récompenses</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
                        <span className="text-xs text-[var(--text-muted)]">
                          Chargement des événements réels...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                        <Calendar size={36} className="opacity-40" />
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          Aucun événement trouvé
                        </p>
                        <p className="text-xs max-w-sm">
                          {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                            ? 'Aucun résultat ne correspond à vos filtres de recherche actuels.'
                            : 'Aucun événement n’est encore enregistré en base de données. Cliquez sur « Créer un événement ».'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  events.map((item) => {
                    const startDateStr = new Date(item.startDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const endDateStr = new Date(item.endDate).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[var(--card-hover)] transition-colors group"
                      >
                        {/* Titre & Slug */}
                        <td className="px-4 py-3.5 max-w-xs">
                          <div className="flex items-center gap-2">
                            {item.isFeatured && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                                title="Événement à la une"
                              >
                                <Flame size={10} /> À la une
                              </span>
                            )}
                            <span className="font-semibold text-[var(--foreground)] line-clamp-1">
                              {item.titleFr}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] line-clamp-1 italic mt-0.5">
                            {item.titleMg}
                          </p>
                          <span className="text-[11px] font-mono text-[var(--text-muted)] opacity-75">
                            /{item.slug}
                          </span>
                        </td>

                        {/* Catégorie */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getCategoryBadge(item.category)}
                        </td>

                        {/* Période */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--foreground)]">
                          <div>Du {startDateStr}</div>
                          <div className="text-[var(--text-muted)]">au {endDateStr}</div>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Participants réels */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => openParticipantsModal(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--border)] border border-[var(--border)] transition-colors"
                            title="Consulter les participants réels"
                          >
                            <Users size={12} className="text-[var(--accent)]" />
                            <span>
                              {item.currentParticipantsCount}
                              {item.maxParticipants ? ` / ${item.maxParticipants}` : ''}
                            </span>
                          </button>
                        </td>

                        {/* Récompenses */}
                        <td className="px-4 py-3.5 max-w-xs">
                          {item.rewards && item.rewards.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.rewards.map((r) => (
                                <span
                                  key={r.id}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--background)] border border-[var(--border)]"
                                >
                                  {r.rewardType === 'XP' && <Zap size={10} className="text-amber-500" />}
                                  {r.rewardType === 'COINS' && <Gift size={10} className="text-amber-600" />}
                                  {r.rewardType === 'BADGE' && <Award size={10} className="text-emerald-600" />}
                                  <span>
                                    {r.rewardType === 'XP'
                                      ? `+${r.amount} XP`
                                      : r.rewardType === 'COINS'
                                      ? `+${r.amount} Vola`
                                      : r.titleFr}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)] italic">
                              Aucune récompense
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Bouton Transition de statut rapide */}
                            {item.status === 'DRAFT' && (
                              <button
                                onClick={() => openStatusModal(item, 'PUBLISHED')}
                                className="p-1.5 text-xs text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded-lg transition-colors"
                                title="Publier l'événement"
                              >
                                <Play size={14} />
                              </button>
                            )}

                            {item.status === 'PUBLISHED' && (
                              <button
                                onClick={() => openStatusModal(item, 'ACTIVE')}
                                className="p-1.5 text-xs text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                                title="Activer immédiatement"
                              >
                                <Play size={14} />
                              </button>
                            )}

                            {item.status === 'ACTIVE' && (
                              <button
                                onClick={() => openStatusModal(item, 'COMPLETED')}
                                className="p-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="Clôturer l'événement (Terminer)"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}

                            {/* Éditer */}
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--border)] rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={14} />
                            </button>

                            {/* Annuler */}
                            {item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                              <button
                                onClick={() => openStatusModal(item, 'CANCELLED')}
                                className="p-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                                title="Annuler l'événement"
                              >
                                <Ban size={14} />
                              </button>
                            )}

                            {/* Supprimer / Archiver */}
                            <button
                              onClick={() => setDeleteModalEvent(item)}
                              className="p-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                              title="Supprimer ou Archiver"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text-muted)]">
              <span>
                Total : {pagination.total} événement(s) — Page {pagination.page} sur{' '}
                {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] disabled:opacity-40 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] disabled:opacity-40 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── ACTIVITÉ RÉCENTE RÉELLE DU SYSTÈME ─────────────────────────────── */}
        {overview?.recentActivity && overview.recentActivity.length > 0 && (
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Clock size={16} className="text-[var(--accent)]" />
              <span>Activité récente enregistrée en base de données</span>
            </h3>
            <div className="divide-y divide-[var(--border)] text-xs">
              {overview.recentActivity.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center font-bold text-[11px] text-[var(--accent)]">
                      {act.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-[var(--foreground)]">
                        {act.userName}
                      </span>{' '}
                      <span className="text-[var(--text-muted)]">
                        s’est inscrit à « {act.eventTitle} »
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[var(--text-muted)] whitespace-nowrap">
                    {new Date(act.registeredAt).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── MODAL : PARTICIPANTS RÉELS ────────────────────────────────────── */}
        {isParticipantsModalOpen && selectedEventForParticipants && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    Participants réels — {selectedEventForParticipants.titleFr}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {participantsTotal} participant(s) enregistré(s) dans la base PostgreSQL
                  </p>
                </div>
                <button
                  onClick={() => setIsParticipantsModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--card-hover)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                {isParticipantsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
                    <span className="text-xs text-[var(--text-muted)]">
                      Chargement des participants réels...
                    </span>
                  </div>
                ) : participants.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                    Aucun participant inscrit à cet événement pour le moment.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--background)] border-b border-[var(--border)] uppercase text-[var(--text-muted)]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Membre</th>
                        <th className="px-3 py-2 font-semibold">Statut</th>
                        <th className="px-3 py-2 font-semibold">Score</th>
                        <th className="px-3 py-2 font-semibold">Date inscription</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {participants.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-[var(--foreground)]">{p.userName}</div>
                            {p.userEmail && (
                              <div className="text-[11px] text-[var(--text-muted)]">{p.userEmail}</div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {p.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-[var(--foreground)]">
                            {p.score} pts
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-muted)]">
                            {new Date(p.registeredAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {participantsTotalPages > 1 && (
                <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>
                    Page {participantsPage} sur {participantsTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={participantsPage <= 1}
                      onClick={() =>
                        openParticipantsModal(selectedEventForParticipants, participantsPage - 1)
                      }
                      className="px-2 py-1 rounded border border-[var(--border)] disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      disabled={participantsPage >= participantsTotalPages}
                      onClick={() =>
                        openParticipantsModal(selectedEventForParticipants, participantsPage + 1)
                      }
                      className="px-2 py-1 rounded border border-[var(--border)] disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── MODAL : CRÉATION & ÉDITION D'ÉVÉNEMENT ─────────────────────────── */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--foreground)]">
                    {editingEvent ? `Modifier : ${editingEvent.titleFr}` : 'Créer un nouvel événement'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Remplissez les détails bilingues et configurez les règles réelles de l’événement.
                  </p>
                </div>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--card-hover)]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Ligne Titre Français & Malgache */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Titre de l&apos;événement (Français) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitleFr}
                      onChange={(e) => setFormTitleFr(e.target.value)}
                      placeholder="Ex: Semaine de la Langue Malgache"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Lohatenin&apos;ny hetsika (Malagasy) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitleMg}
                      onChange={(e) => setFormTitleMg(e.target.value)}
                      placeholder="Ex: Herinandron'ny Teny Malagasy"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Description courte (pour cartes d'aperçu) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Description courte (Français)
                    </label>
                    <input
                      type="text"
                      value={formShortDescFr}
                      onChange={(e) => setFormShortDescFr(e.target.value)}
                      placeholder="Accroche en une phrase pour la carte mobile"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Famaritana fohy (Malagasy)
                    </label>
                    <input
                      type="text"
                      value={formShortDescMg}
                      onChange={(e) => setFormShortDescMg(e.target.value)}
                      placeholder="Famaritana fohy ho an'ny karatra finday"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Description complète bilingue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Description complète (Français) *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formDescriptionFr}
                      onChange={(e) => setFormDescriptionFr(e.target.value)}
                      placeholder="Contexte, présentation et déroulement détaillé..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Famaritana feno (Malagasy) *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formDescriptionMg}
                      onChange={(e) => setFormDescriptionMg(e.target.value)}
                      placeholder="Fanazavana feno momba ny hetsika..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Catégorie, Type & Tier */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Catégorie *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as EventCategory)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                    >
                      <option value="CULTURE">Culture & Patrimoine</option>
                      <option value="CHALLENGE">Défis & Compétitions</option>
                      <option value="REWARD">Récompenses & Lots</option>
                      <option value="COMMUNITY">Communauté & Fihavanana</option>
                      <option value="SEASONAL">Saisonnier & Fêtes</option>
                      <option value="SPECIAL">Spécial Kanto MG</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Type de participation *
                    </label>
                    <select
                      value={formParticipationType}
                      onChange={(e) =>
                        setFormParticipationType(e.target.value as EventParticipationType)
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                    >
                      <option value="OPEN">Ouvert à tous (Sans inscription préalable)</option>
                      <option value="REGISTRATION_REQUIRED">Inscription préalable obligatoire</option>
                      <option value="EXCLUSIVE_TIER">Réservé aux membres VIP / Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Niveau / Tier requis
                    </label>
                    <select
                      value={formMinTier}
                      onChange={(e) => setFormMinTier(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                    >
                      <option value="FREE">Tous (Gratuit)</option>
                      <option value="PREMIUM">Premium uniquement</option>
                      <option value="VIP">VIP uniquement</option>
                    </select>
                  </div>
                </div>

                {/* Dates & Limites */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Date & Heure de début *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Date & Heure de fin *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Limite de participants (optionnel)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formMaxParticipants}
                      onChange={(e) => setFormMaxParticipants(e.target.value)}
                      placeholder="Illimité si vide"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Lieu & Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Lieu / Format
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="Ex: Fampiharana Kanto MG ou Palais de la Reine"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Module de jeu associé (pour Défis)
                    </label>
                    <select
                      value={formGameModuleId}
                      onChange={(e) => setFormGameModuleId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                    >
                      <option value="">Aucun jeu associé (Événement culturel)</option>
                      <option value="quizGame">Kanto Quiz Culturel</option>
                      <option value="trueFalseGame">Vrai ou Faux (Marina sa Diso)</option>
                      <option value="riddleGame">Devinettes (Ankamantatra)</option>
                    </select>
                  </div>
                </div>

                {/* Option Vedette */}
                <div className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--accent)]"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-semibold text-[var(--foreground)] cursor-pointer">
                    Mettre en avant comme événement « À la une » (affiché en tête du carrousel d&apos;accueil mobile)
                  </label>
                </div>

                {/* Boutons d'action du formulaire */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] hover:opacity-90 text-white disabled:opacity-50 transition-opacity"
                  >
                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                    <span>{editingEvent ? 'Mettre à jour' : 'Créer l’événement'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODAL : TRANSITION DE STATUT & ANNULATION ─────────────────────── */}
        {statusModalEvent && targetStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
              <h3 className="text-base font-bold text-[var(--foreground)]">
                {targetStatus === 'CANCELLED'
                  ? 'Confirmer l’annulation de l’événement'
                  : `Passer au statut : ${targetStatus}`}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Événement : <strong className="text-[var(--foreground)]">{statusModalEvent.titleFr}</strong>
              </p>

              {targetStatus === 'CANCELLED' && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Motif de l’annulation (notifié aux participants inscrits)
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex: Report pour raisons organisationnelles..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setStatusModalEvent(null);
                    setTargetStatus(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isStatusUpdating}
                  onClick={handleConfirmStatusChange}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg text-white disabled:opacity-50 ${
                    targetStatus === 'CANCELLED'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[var(--accent)] hover:opacity-90'
                  }`}
                >
                  {isStatusUpdating && <Loader2 size={12} className="animate-spin" />}
                  <span>Confirmer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL : CONFIRMATION SUPPRESSION / ARCHIVAGE ───────────────────── */}
        {deleteModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <AlertCircle size={18} />
                <span>Suppression ou Archivage</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Voulez-vous supprimer l’événement{' '}
                <strong className="text-[var(--foreground)]">{deleteModalEvent.titleFr}</strong> ?
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Règle de sécurité : si des participants sont déjà inscrits, l’événement sera
                automatiquement basculé en statut <strong>ARCHIVÉ</strong> pour préserver l’historique
                et les points des utilisateurs. S’il est encore en brouillon sans inscription, il sera
                définitivement supprimé.
              </p>

              <div className="flex items-center justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setDeleteModalEvent(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {isDeleting && <Loader2 size={12} className="animate-spin" />}
                  <span>Confirmer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}


export default function EventsAdminPage() {
  return (
    <Suspense
      fallback={
        <AdminShell>
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
          </div>
        </AdminShell>
      }
    >
      <EventsAdminPageContent />
    </Suspense>
  );
}
