'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminShell } from '@/components/layout/AdminShell';
import { useToast } from '@/lib/hooks/useToast';
import { EventWizardModal } from '@/components/events/EventWizardModal';
import { EventParticipantsModal } from '@/components/events/EventParticipantsModal';
import {
  eventsAdminService,
  EventAdminItem,
  EventAdminOverview,
  EventCategory,
  EventStatus,
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
  Play,
  Pause,
  Ban,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';

function EventsAdminPageContent() {
  const { toast } = useToast();

  // Ãƒâ€°tats principaux
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


  // Debounce de recherche pour ÃƒÂ©viter de saturer l'API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Modales d'administration
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventAdminItem | null>(null);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<EventAdminItem | null>(null);

  // Modal Statut / Annulation globale
  const [statusModalEvent, setStatusModalEvent] = useState<EventAdminItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<EventStatus | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Modal Suppression / Archivage
  const [deleteModalEvent, setDeleteModalEvent] = useState<EventAdminItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Chargement des données réelles
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

  // Actions d'ouverture
  const openCreateModal = () => {
    setEditingEvent(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (event: EventAdminItem) => {
    setEditingEvent(event);
    setIsFormModalOpen(true);
  };

  const openParticipantsModal = (event: EventAdminItem) => {
    setSelectedEventForParticipants(event);
    setIsParticipantsModalOpen(true);
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

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Changement de Statut Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
        `Statut mis ÃƒÂ  jour : l'ÃƒÂ©vÃƒÂ©nement est dÃƒÂ©sormais "${targetStatus}".`
      );
      setStatusModalEvent(null);
      setTargetStatus(null);
      await Promise.all([loadEvents(), loadOverview()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de modifier le statut de lÃ¢â‚¬â„¢ÃƒÂ©vÃƒÂ©nement.';
      toast.error(msg);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Suppression / Archivage Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression de lÃ¢â‚¬â„¢ÃƒÂ©vÃƒÂ©nement.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Helpers visuels Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

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
            PubliÃƒÂ©
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-300">
            <Clock size={11} /> ProgrammÃƒÂ©
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
            <CheckCircle2 size={11} /> TerminÃƒÂ©
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-300">
            <Ban size={11} /> AnnulÃƒÂ©
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300">
            <Archive size={11} /> ArchivÃƒÂ©
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{status}</span>;
    }
  };

  const getCategoryBadge = (cat: EventCategory) => {
    const map: Record<EventCategory, { label: string; bg: string }> = {
      CULTURE: { label: 'Culture', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      CHALLENGE: { label: 'DÃƒÂ©fi', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      REWARD: { label: 'RÃƒÂ©compense', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
      COMMUNITY: { label: 'CommunautÃƒÂ©', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
      SEASONAL: { label: 'Saisonnier', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
      SPECIAL: { label: 'SpÃƒÂ©cial', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
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
        {/* En-tÃƒÂªte de page */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--accent)] text-white">
                <Calendar size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                  Ãƒâ€°vÃƒÂ©nements & DÃƒÂ©fis Kanto MG
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  Gestion centralisÃƒÂ©e, cycle de vie, rÃƒÂ©compenses et suivi en direct des participants rÃƒÂ©els.
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
              title="RafraÃƒÂ®chir les donnÃƒÂ©es"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] hover:opacity-90 text-white shadow-sm transition-opacity"
            >
              <Plus size={16} />
              <span>CrÃƒÂ©er un ÃƒÂ©vÃƒÂ©nement</span>
            </button>
          </div>
        </div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ TABLEAU DE BORD KPI RÃƒâ€°EL Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
            <span className="text-xs text-[var(--text-muted)] font-medium">Total Ãƒâ€°vÃƒÂ©nements</span>
            <div className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.totalEvents ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">En base de donnÃƒÂ©es</span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">En cours (Actifs)</span>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.activeCount ?? 0}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-500">Visibles sur mobile</span>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs">
            <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">ProgrammÃƒÂ©s</span>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.scheduledCount ?? 0}
            </div>
            <span className="text-[11px] text-blue-600 dark:text-blue-500">DÃƒÂ©marrage planifiÃƒÂ©</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xs">
            <span className="text-xs text-[var(--text-muted)] font-medium">Inscriptions rÃƒÂ©elles</span>
            <div className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.totalRegistrations ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Participants enregistrÃƒÂ©s</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">DÃƒÂ©fis complÃƒÂ©tÃƒÂ©s</span>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.completedParticipations ?? 0}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-500">Participations terminÃƒÂ©es</span>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs">
            <span className="text-xs text-purple-800 dark:text-purple-300 font-medium">RÃƒÂ©compenses remises</span>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1">
              {isOverviewLoading ? '...' : overview?.metrics.totalRewardsDistributed ?? 0}
            </div>
            <span className="text-[11px] text-purple-600 dark:text-purple-500">XP, Vola & Badges rÃƒÂ©els</span>
          </div>
        </div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ FILTRES & RECHERCHE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
              <option value="PUBLISHED">PubliÃƒÂ©s</option>
              <option value="SCHEDULED">ProgrammÃƒÂ©s</option>
              <option value="DRAFT">Brouillons</option>
              <option value="SUSPENDED">Suspendus</option>
              <option value="COMPLETED">TerminÃƒÂ©s</option>
              <option value="CANCELLED">AnnulÃƒÂ©s</option>
              <option value="ARCHIVED">ArchivÃƒÂ©s</option>
            </select>

            {/* Filtre CatÃƒÂ©gorie */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden"
            >
              <option value="ALL">Toutes les catÃƒÂ©gories</option>
              <option value="CULTURE">Culture</option>
              <option value="CHALLENGE">DÃƒÂ©fis & Jeux</option>
              <option value="REWARD">RÃƒÂ©compenses</option>
              <option value="COMMUNITY">CommunautÃƒÂ©</option>
              <option value="SEASONAL">Saisonnier</option>
              <option value="SPECIAL">SpÃƒÂ©cial Kanto</option>
            </select>
          </div>
        </div>

        {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ TABLEAU DES Ãƒâ€°VÃƒâ€°NEMENTS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--background)] border-b border-[var(--border)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ãƒâ€°vÃƒÂ©nement & ThÃƒÂ¨me</th>
                  <th className="px-4 py-3 font-semibold">CatÃƒÂ©gorie</th>
                  <th className="px-4 py-3 font-semibold">PÃƒÂ©riode</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold text-center">Participants</th>
                  <th className="px-4 py-3 font-semibold">RÃƒÂ©compenses</th>
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
                          Chargement des ÃƒÂ©vÃƒÂ©nements rÃƒÂ©els...
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
                          Aucun ÃƒÂ©vÃƒÂ©nement trouvÃƒÂ©
                        </p>
                        <p className="text-xs max-w-sm">
                          {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                            ? 'Aucun rÃƒÂ©sultat ne correspond ÃƒÂ  vos filtres de recherche actuels.'
                            : 'Aucun ÃƒÂ©vÃƒÂ©nement nÃ¢â‚¬â„¢est encore enregistrÃƒÂ© en base de donnÃƒÂ©es. Cliquez sur Ã‚Â« CrÃƒÂ©er un ÃƒÂ©vÃƒÂ©nement Ã‚Â».'}
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
                                title="Ãƒâ€°vÃƒÂ©nement ÃƒÂ  la une"
                              >
                                <Flame size={10} /> Ãƒâ‚¬ la une
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

                        {/* CatÃƒÂ©gorie */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getCategoryBadge(item.category)}
                        </td>

                        {/* PÃƒÂ©riode */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-[var(--foreground)]">
                          <div>Du {startDateStr}</div>
                          <div className="text-[var(--text-muted)]">au {endDateStr}</div>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Participants rÃƒÂ©els */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => openParticipantsModal(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--background)] hover:bg-[var(--border)] border border-[var(--border)] transition-colors"
                            title="Consulter les participants rÃƒÂ©els"
                          >
                            <Users size={12} className="text-[var(--accent)]" />
                            <span>
                              {item.currentParticipantsCount}
                              {item.maxParticipants ? ` / ${item.maxParticipants}` : ''}
                            </span>
                          </button>
                        </td>

                        {/* RÃƒÂ©compenses */}
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
                              Aucune rÃƒÂ©compense
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
                                title="Publier l'ÃƒÂ©vÃƒÂ©nement"
                              >
                                <Play size={14} />
                              </button>
                            )}

                            {item.status === 'PUBLISHED' && (
                              <button
                                onClick={() => openStatusModal(item, 'ACTIVE')}
                                className="p-1.5 text-xs text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                                title="Activer immÃƒÂ©diatement"
                              >
                                <Play size={14} />
                              </button>
                            )}

                            {item.status === 'ACTIVE' && (
                              <button
                                onClick={() => openStatusModal(item, 'COMPLETED')}
                                className="p-1.5 text-xs text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="ClÃƒÂ´turer l'ÃƒÂ©vÃƒÂ©nement (Terminer)"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}

                            {/* Ãƒâ€°diter */}
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
                                title="Annuler l'ÃƒÂ©vÃƒÂ©nement"
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
                Total : {pagination.total} ÃƒÂ©vÃƒÂ©nement(s) Ã¢â‚¬â€ Page {pagination.page} sur{' '}
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

        {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ACTIVITÃƒâ€° RÃƒâ€°CENTE RÃƒâ€°ELLE DU SYSTÃƒË†ME Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {overview?.recentActivity && overview.recentActivity.length > 0 && (
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Clock size={16} className="text-[var(--accent)]" />
              <span>ActivitÃƒÂ© rÃƒÂ©cente enregistrÃƒÂ©e en base de donnÃƒÂ©es</span>
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
                        sÃ¢â‚¬â„¢est inscrit ÃƒÂ  Ã‚Â« {act.eventTitle} Ã‚Â»
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

        {/* â”€â”€â”€ MODAL : SUIVI DES PARTICIPANTS RÃ‰ELS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {isParticipantsModalOpen && selectedEventForParticipants && (
          <EventParticipantsModal
            isOpen={isParticipantsModalOpen}
            onClose={() => setIsParticipantsModalOpen(false)}
            event={selectedEventForParticipants}
            onParticipantsUpdated={() => {
              loadEvents();
              loadOverview();
            }}
          />
        )}

        {/* â”€â”€â”€ MODAL : WIZARD STEPPER CRÃ‰ATION & Ã‰DITION (5 Ã‰TAPES) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {isFormModalOpen && (
          <EventWizardModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            editingEvent={editingEvent}
            onSaved={() => {
              loadEvents();
              loadOverview();
            }}
          />
        )}

        {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ MODAL : TRANSITION DE STATUT & ANNULATION Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {statusModalEvent && targetStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
              <h3 className="text-base font-bold text-[var(--foreground)]">
                {targetStatus === 'CANCELLED'
                  ? 'Confirmer lÃ¢â‚¬â„¢annulation de lÃ¢â‚¬â„¢ÃƒÂ©vÃƒÂ©nement'
                  : `Passer au statut : ${targetStatus}`}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Ãƒâ€°vÃƒÂ©nement : <strong className="text-[var(--foreground)]">{statusModalEvent.titleFr}</strong>
              </p>

              {targetStatus === 'CANCELLED' && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Motif de lÃ¢â‚¬â„¢annulation (notifiÃƒÂ© aux participants inscrits)
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

        {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ MODAL : CONFIRMATION SUPPRESSION / ARCHIVAGE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
        {deleteModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <AlertCircle size={18} />
                <span>Suppression ou Archivage</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Voulez-vous supprimer lÃ¢â‚¬â„¢ÃƒÂ©vÃƒÂ©nement{' '}
                <strong className="text-[var(--foreground)]">{deleteModalEvent.titleFr}</strong> ?
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                RÃƒÂ¨gle de sÃƒÂ©curitÃƒÂ© : si des participants sont dÃƒÂ©jÃƒÂ  inscrits, lÃ¢â‚¬â„¢ÃƒÂ©vÃƒÂ©nement sera
                automatiquement basculÃƒÂ© en statut <strong>ARCHIVÃƒâ€°</strong> pour prÃƒÂ©server lÃ¢â‚¬â„¢historique
                et les points des utilisateurs. SÃ¢â‚¬â„¢il est encore en brouillon sans inscription, il sera
                dÃƒÂ©finitivement supprimÃƒÂ©.
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