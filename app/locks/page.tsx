'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { ConfirmModal } from '@/components/ui';
import { useLocks, LockModal, LocksTable } from '@/features/locks';
import { ModuleLockItem, CreateModuleDto, UpdateModuleDto } from '@/types/lock';
import { locksService } from '@/services/locks.service';
import {
  Gamepad2,
  BookOpen,
  Search,
  RefreshCw,
  Plus,
} from 'lucide-react';

export default function LocksAdminPage() {
  const {
    modules,
    stats,
    isLoading,
    updatingKey,
    loadLocks,
    toggleLock,
    deleteModule,
  } = useLocks();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<
    'ALL' | 'GAME' | 'CATEGORY' | 'LOCKED'
  >('ALL');

  // Modale Ajout / Modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleLockItem | null>(null);

  // Modale Confirmation Suppression
  const [deletingModule, setDeletingModule] = useState<ModuleLockItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingModule(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ModuleLockItem) => {
    setEditingModule(item);
    setIsModalOpen(true);
  };

  const handleSaveModule = async (
    data: CreateModuleDto | UpdateModuleDto,
    isEditing: boolean
  ) => {
    if (isEditing && editingModule) {
      await locksService.updateModule(editingModule.key, data as UpdateModuleDto);
    } else {
      await locksService.createModule(data as CreateModuleDto);
    }
    await loadLocks();
  };

  const handleConfirmDelete = async () => {
    if (!deletingModule) return;
    setIsDeleting(true);
    try {
      await deleteModule(deletingModule.key);
      setDeletingModule(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(`Erreur suppression : ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredModules = modules.filter((m) => {
    const matchesType =
      selectedType === 'ALL'
        ? true
        : selectedType === 'LOCKED'
        ? m.isLocked
        : m.type === selectedType;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      m.nameFr.toLowerCase().includes(q) ||
      m.nameMg.toLowerCase().includes(q) ||
      m.key.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const gamesCount = modules.filter((m) => m.type === 'GAME').length;
  const categoriesCount = modules.filter((m) => m.type === 'CATEGORY').length;

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">
        {/* En-tête de la page sobre & actions principales */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                Visuels &amp; Disponibilité (Jeux &amp; Catégories)
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Photos &amp; Accès
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Gérez les photos de présentation (Cloudinary), les titres bilingues et la disponibilité de chaque jeu et catégorie culturelle.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={loadLocks}
              disabled={isLoading}
              className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-3 py-1.5 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau module</span>
            </button>
          </div>
        </div>

        {/* Métriques compactes */}
        <div className="grid grid-cols-4 gap-2.5">
          <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-subtle)]">
              Total Modules
            </div>
            <div className="text-lg font-bold font-mono text-[var(--foreground)] mt-0.5">
              {stats.total}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-subtle)] flex items-center justify-between">
              <span>Jeux</span>
              <Gamepad2 className="w-3 h-3 text-emerald-500" />
            </div>
            <div className="text-lg font-bold font-mono text-[var(--foreground)] mt-0.5">
              {gamesCount}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-subtle)] flex items-center justify-between">
              <span>Catégories</span>
              <BookOpen className="w-3 h-3 text-sky-500" />
            </div>
            <div className="text-lg font-bold font-mono text-[var(--foreground)] mt-0.5">
              {categoriesCount}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
            <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-subtle)] flex items-center justify-between">
              <span>Verrouillés</span>
              {stats.locked > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
            </div>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {stats.locked}
            </div>
          </div>
        </div>

        {/* Barre de filtres & recherche */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[var(--card)] p-2.5 rounded-lg border border-[var(--card-border)]">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL' as const, label: `Tous (${stats.total})` },
              { id: 'GAME' as const, label: `Jeux (${gamesCount})` },
              { id: 'CATEGORY' as const, label: `Catégories (${categoriesCount})` },
              { id: 'LOCKED' as const, label: `Verrouillés (${stats.locked})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer font-medium ${
                  selectedType === tab.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              type="text"
              placeholder="Rechercher par nom ou clé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Tableau épuré des modules */}
        <div className="border border-[var(--card-border)] rounded-lg bg-[var(--card)] overflow-hidden">
          <LocksTable
            modules={filteredModules}
            isLoading={isLoading}
            updatingKey={updatingKey}
            onToggleLock={toggleLock}
            onEdit={handleOpenEditModal}
            onDelete={setDeletingModule}
          />
        </div>
      </div>

      {/* Modale d'ajout / modification */}
      {isModalOpen && (
        <LockModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingModule={editingModule}
          onSave={handleSaveModule}
        />
      )}

      {/* Modale de confirmation de suppression */}
      <ConfirmModal
        isOpen={!!deletingModule}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le module"
        description={`Êtes-vous sûr de vouloir supprimer définitivement « ${deletingModule?.nameFr} » (${deletingModule?.key}) ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminShell>
  );
}
