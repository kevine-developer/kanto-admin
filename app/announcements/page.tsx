'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  SearchBar,
  ConfirmModal,
  LoadingState,
  EmptyState,
  Modal,
} from '@/components/ui';
import { fetchApi } from '@/lib/api-client';
import { useToast } from '@/lib/hooks/useToast';
import {
  Megaphone,
  Plus,
  RotateCcw,
  Trash2,
  AlertCircle,
  Loader2,
  Info,
  Wrench,
  Flame,
  Pencil,
  CheckCircle2,
  Calendar,
  Languages,
} from 'lucide-react';

export interface SystemAnnouncement {
  id: string;
  titleFr: string;
  titleMg: string;
  messageFr: string;
  messageMg: string;
  type: 'INFO' | 'MAINTENANCE' | 'NEW_FEATURE';
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const ANNOUNCEMENT_TYPES = [
  {
    id: 'INFO' as const,
    label: 'Information',
    labelMg: 'Fampahafantarana',
    icon: Info,
    badgeCls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'MAINTENANCE' as const,
    label: 'Maintenance',
    labelMg: 'Fikojakojana',
    icon: Wrench,
    badgeCls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  {
    id: 'NEW_FEATURE' as const,
    label: 'Nouveauté',
    labelMg: 'Vaovao',
    icon: Flame,
    badgeCls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
];

const inputCls =
  'w-full px-2.5 py-1.5 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition';

export default function AnnouncementsAdminPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal suppression
  const [deletingItem, setDeletingItem] = useState<SystemAnnouncement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Onglet de prévisualisation de langue sur les cartes
  const [cardLang, setCardLang] = useState<Record<string, 'FR' | 'MG'>>({});

  // Form State
  const [titleMg, setTitleMg] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [messageMg, setMessageMg] = useState('');
  const [messageFr, setMessageFr] = useState('');
  const [type, setType] = useState<'INFO' | 'MAINTENANCE' | 'NEW_FEATURE'>('INFO');
  const [isActive, setIsActive] = useState(true);
  const [version, setVersion] = useState(1);

  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi<SystemAnnouncement[]>('/announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des annonces.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const resetForm = () => {
    setTitleMg('');
    setTitleFr('');
    setMessageMg('');
    setMessageFr('');
    setType('INFO');
    setIsActive(true);
    setVersion(1);
    setEditingId(null);
    setModalError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (ann: SystemAnnouncement) => {
    setTitleMg(ann.titleMg || '');
    setTitleFr(ann.titleFr || '');
    setMessageMg(ann.messageMg || '');
    setMessageFr(ann.messageFr || '');
    setType(ann.type || 'INFO');
    setIsActive(Boolean(ann.isActive));
    setVersion(Number(ann.version) || 1);
    setEditingId(ann.id);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!titleMg.trim() || !messageMg.trim() || !titleFr.trim() || !messageFr.trim()) {
      setModalError('Tous les champs de titre et de message (FR et MG) sont requis.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        titleMg: titleMg.trim(),
        titleFr: titleFr.trim(),
        messageMg: messageMg.trim(),
        messageFr: messageFr.trim(),
        type,
        isActive,
        version: Math.max(1, Number(version) || 1),
      };

      if (editingId) {
        await fetchApi(`/announcements/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Annonce modifiée avec succès.');
      } else {
        await fetchApi('/announcements', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Nouvelle annonce créée avec succès.');
      }

      setIsModalOpen(false);
      resetForm();
      await loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de l'enregistrement de l'annonce.";
      setModalError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (ann: SystemAnnouncement) => {
    const nextState = !ann.isActive;
    try {
      setAnnouncements((prev) =>
        prev.map((item) => {
          if (item.id === ann.id) {
            return { ...item, isActive: nextState };
          }
          if (nextState) {
            return { ...item, isActive: false };
          }
          return item;
        })
      );

      await fetchApi(`/announcements/${ann.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextState }),
      });
      toast.success(nextState ? 'Annonce activée sur l’application.' : 'Annonce désactivée.');
      await loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de modification.';
      toast.error(msg);
      await loadAnnouncements();
    }
  };

  const executeDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      await fetchApi(`/announcements/${deletingItem.id}`, { method: 'DELETE' });
      toast.success('Annonce supprimée avec succès.');
      setDeletingItem(null);
      await loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrage
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      // Type
      if (selectedType !== 'ALL' && ann.type !== selectedType) return false;

      // Statut
      if (statusFilter === 'ACTIVE' && !ann.isActive) return false;
      if (statusFilter === 'INACTIVE' && ann.isActive) return false;

      // Recherche
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchFr =
          ann.titleFr?.toLowerCase().includes(q) || ann.messageFr?.toLowerCase().includes(q);
        const matchMg =
          ann.titleMg?.toLowerCase().includes(q) || ann.messageMg?.toLowerCase().includes(q);
        if (!matchFr && !matchMg) return false;
      }

      return true;
    });
  }, [announcements, selectedType, statusFilter, search]);

  const activeAnnouncement = useMemo(() => {
    return announcements.find((a) => a.isActive);
  }, [announcements]);

  const toggleCardLang = (id: string) => {
    setCardLang((prev) => ({
      ...prev,
      [id]: prev[id] === 'MG' ? 'FR' : 'MG',
    }));
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">
        {/* En-tête standardisé */}
        <PageHeader
          title="Annonces Système"
          description="Modales d'information, maintenance et nouveautés diffusées au démarrage de l'application mobile."
          badge={`${announcements.length} annonce${announcements.length > 1 ? 's' : ''}${
            activeAnnouncement ? ' · 1 active' : ''
          }`}
          icon={Megaphone}
          actions={
            <button
              type="button"
              onClick={() => void loadAnnouncements()}
              title="Actualiser"
              className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
          primaryAction={{
            label: 'Nouvelle Annonce',
            icon: <Plus size={14} />,
            onClick: handleOpenCreateModal,
          }}
        />

        {/* Barre d'outils unifiée */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-3 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-lg">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Rechercher par titre ou contenu (FR ou MG)..."
                totalCount={filteredAnnouncements.length}
              />
            </div>

            {/* Pilules de statut actif */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] shrink-0 self-start sm:self-auto">
              {(
                [
                  { id: 'ALL', label: 'Toutes' },
                  { id: 'ACTIVE', label: 'Actives' },
                  { id: 'INACTIVE', label: 'Inactives' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pilules de types d'annonces */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[var(--card-border)]">
            <button
              type="button"
              onClick={() => setSelectedType('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                selectedType === 'ALL'
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Tous les types
            </button>
            {ANNOUNCEMENT_TYPES.map((t) => {
              const Icon = t.icon;
              const isSel = selectedType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                    isSel
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon size={12} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des annonces */}
        {isLoading && announcements.length === 0 ? (
          <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-6">
            <LoadingState message="Chargement des annonces système..." />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-4">
            <EmptyState
              title="Aucune annonce trouvée"
              description={
                search || selectedType !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Aucune annonce ne correspond à vos filtres de recherche.'
                  : 'Créez une annonce pour avertir les utilisateurs des nouveautés ou maintenances.'
              }
              action={{
                label: 'Créer une annonce',
                icon: <Plus size={14} />,
                onClick: handleOpenCreateModal,
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAnnouncements.map((ann) => {
              const catConfig =
                ANNOUNCEMENT_TYPES.find((c) => c.id === ann.type) || ANNOUNCEMENT_TYPES[0];
              const CatIcon = catConfig.icon;
              const currentLang = cardLang[ann.id] || 'FR';

              return (
                <div
                  key={ann.id}
                  className={`bg-[var(--card)] rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                    ann.isActive
                      ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/30 shadow-xs'
                      : 'border-[var(--card-border)] hover:border-[var(--card-border)]'
                  }`}
                >
                  {/* Bandeau d'en-tête de carte */}
                  <div className="p-3.5 pb-2.5 flex items-start justify-between gap-2 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10.5px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${catConfig.badgeCls}`}
                      >
                        <CatIcon size={11} />
                        <span>{catConfig.label}</span>
                      </span>

                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-subtle)]">
                        v{ann.version}
                      </span>

                      {ann.isActive && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(ann)}
                        title="Modifier l'annonce"
                        className="p-1 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingItem(ann)}
                        title="Supprimer l'annonce"
                        className="p-1 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div className="p-3.5 space-y-2 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
                        {currentLang === 'FR' ? 'Version Française' : 'Dikan-teny Malagasy'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCardLang(ann.id)}
                        className="text-[10.5px] font-mono px-1.5 py-0.5 rounded border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition flex items-center gap-1 cursor-pointer"
                        title="Basculer l'aperçu entre Français et Malagasy"
                      >
                        <Languages size={10} />
                        <span>{currentLang === 'FR' ? 'Afficher MG' : 'Afficher FR'}</span>
                      </button>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                        {currentLang === 'FR' ? ann.titleFr : ann.titleMg}
                      </h3>
                      {currentLang === 'FR' ? (
                        <p className="text-[11px] text-[var(--accent)] font-medium mt-0.5 line-clamp-1">
                          {ann.titleMg}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5 line-clamp-1">
                          {ann.titleFr}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                      {currentLang === 'FR' ? ann.messageFr : ann.messageMg}
                    </p>
                  </div>

                  {/* Pied de carte avec interrupteur rapide et date */}
                  <div className="px-3.5 py-2.5 bg-[var(--input-bg)]/40 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggleActive(ann)}
                      className={`text-xs font-medium px-2 py-1 rounded-md border flex items-center gap-1.5 transition cursor-pointer ${
                        ann.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                          : 'bg-[var(--card)] text-[var(--text-muted)] border-[var(--card-border)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      <CheckCircle2 size={12} className={ann.isActive ? 'text-emerald-500' : 'text-zinc-400'} />
                      <span>{ann.isActive ? 'Diffusée in-app' : 'Activer'}</span>
                    </button>

                    <span className="text-[10px] font-mono text-[var(--text-subtle)] flex items-center gap-1">
                      <Calendar size={10} />
                      <span>
                        {new Date(ann.updatedAt || ann.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Création / Édition Standardisée */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title={editingId ? "Modifier l'annonce système" : 'Créer une annonce système'}
          subtitle="Configurez le message diffusé aux utilisateurs au démarrage de l'application."
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-3 py-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] text-xs transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={(e) => void handleSubmit(e)}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-md bg-[var(--foreground)] text-[var(--background)] text-xs font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>{editingId ? 'Enregistrer les modifications' : "Publier l'annonce"}</span>
                )}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {modalError && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertCircle size={14} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Type d&apos;annonce *
                </label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as 'INFO' | 'MAINTENANCE' | 'NEW_FEATURE')
                  }
                  className={inputCls}
                  required
                >
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.labelMg})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Numéro de version *
                </label>
                <input
                  type="number"
                  min="1"
                  value={version}
                  onChange={(e) => setVersion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className={inputCls}
                  required
                />
                <span className="text-[10px] text-[var(--text-subtle)] mt-0.5 block">
                  Augmenter pour réafficher à ceux l&apos;ayant déjà fermée.
                </span>
              </div>
            </div>

            {/* Statut actif */}
            <div className="p-3 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[var(--foreground)]">
                  Annonce active sur l&apos;application
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  Si activée, elle remplacera toute autre annonce active dans l&apos;application mobile.
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-[var(--input-border)] text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Bloc Français */}
            <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] space-y-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)] font-medium">
                Contenu en Français
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Titre (Français) *
                </label>
                <input
                  type="text"
                  value={titleFr}
                  onChange={(e) => setTitleFr(e.target.value)}
                  placeholder="Ex: Mise à jour majeure disponible"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Message (Français) *
                </label>
                <textarea
                  rows={2}
                  value={messageFr}
                  onChange={(e) => setMessageFr(e.target.value)}
                  placeholder="Ex: Découvrez les nouveaux contes et proverbes de Madagascar..."
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Bloc Malgache */}
            <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] space-y-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)] font-medium">
                Contenu en Malagasy
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Titre (Malgache) *
                </label>
                <input
                  type="text"
                  value={titleMg}
                  onChange={(e) => setTitleMg(e.target.value)}
                  placeholder="Ex: Fanavaozana vaovao misy"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                  Message (Malgache) *
                </label>
                <textarea
                  rows={2}
                  value={messageMg}
                  onChange={(e) => setMessageMg(e.target.value)}
                  placeholder="Ex: Fantaro ireo angano sy ohabolana vaovao malagasy..."
                  className={inputCls}
                  required
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Modal Confirmation de Suppression Standardisée */}
        <ConfirmModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={executeDelete}
          title="Supprimer l'annonce système"
          description={`Êtes-vous sûr de vouloir supprimer définitivement l'annonce « ${deletingItem?.titleFr} » ? Cette action est irréversible.`}
          confirmText="Supprimer"
          isLoading={isDeleting}
          variant="danger"
        />
      </div>
    </AdminShell>
  );
}
