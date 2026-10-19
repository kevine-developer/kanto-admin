'use client';

import React, { useState } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal, Modal, Pagination } from '@/components/ui';
import {
  useRakiTeny,
  RakiTenyTable,
  RakiTenyModal,
} from '@/features/raki-teny';
import { RakiTenyWord, RakiTenyFormData, RarityFilterType } from '@/types/raki-teny';
import {
  BookMarked,
  Search,
  Plus,
  RotateCcw,
  X,
  Sparkles,
  Filter,
} from 'lucide-react';

const MALAGASY_ALPHABET = [
  'ALL',
  'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'R', 'S', 'T', 'V', 'Y', 'Z',
];

const RARITY_OPTIONS: { id: RarityFilterType; label: string }[] = [
  { id: 'ALL', label: 'Toutes raretés' },
  { id: 'POETIC', label: 'Poétique' },
  { id: 'VERY_RARE', label: 'Très rare' },
  { id: 'ARCHAIC', label: 'Ancien / Archaïque' },
  { id: 'LITERAL', label: 'Littéraire' },
  { id: 'PROVERBIAL', label: 'Proverbial' },
];

export default function RakiTenyAdminPage() {
  const {
    words,
    isLoading,
    error,
    search,
    setSearch,
    selectedLetter,
    setSelectedLetter,
    selectedRarity,
    setSelectedRarity,
    selectedCategory: _selectedCategory,
    setSelectedCategory: _setSelectedCategory,
    page,
    setPage,
    totalPages,
    totalCount,
    loadWords,
    saveWord,
    deleteWord,
    resetFilters,
  } = useRakiTeny();

  // Modale création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<RakiTenyWord | null>(null);

  // Modale détails / aperçu
  const [selectedWord, setSelectedWord] = useState<RakiTenyWord | null>(null);

  // Modale de confirmation de suppression
  const [deletingWord, setDeletingWord] = useState<RakiTenyWord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingWord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (word: RakiTenyWord) => {
    setEditingWord(word);
    setIsModalOpen(true);
  };

  const handleSaveWord = async (data: RakiTenyFormData, id?: string | null) => {
    await saveWord(data, id);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingWord) return;
    setIsDeleting(true);
    try {
      await deleteWord(deletingWord.id);
      setDeletingWord(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      alert(`Erreur lors de la suppression du mot : ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 max-w-7xl mx-auto pb-12">
        {/* En-tête standardisé */}
        <PageHeader
          title="Mots Rares & Insolites"
          description="Raki-teny Miafina — Trésors cachés, termes poétiques et vocabulaire ancestral de la langue malgache."
          icon={BookMarked}
          badge={
            <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs">
              {totalCount} mot{totalCount !== 1 ? 's' : ''}
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={loadWords}
                disabled={isLoading}
                className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition cursor-pointer shadow-xs disabled:opacity-50"
                title="Actualiser la liste"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau mot rare</span>
              </button>
            </div>
          }
        />

        {/* Message d'erreur s'il y a lieu */}
        {error && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadWords}
              className="underline font-semibold hover:opacity-80"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Barre de filtres & Recherche */}
        <div className="p-3.5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs space-y-3">
          {/* Ligne 1 : Recherche textuelle + Filtre rareté */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
              <input
                type="text"
                placeholder="Rechercher par mot, phonétique ou définition..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Pastilles / Sélecteur de rareté */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)]">
              {RARITY_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedRarity(item.id)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg transition cursor-pointer font-medium ${
                    selectedRarity === item.id
                      ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {(search || selectedLetter !== 'ALL' || selectedRarity !== 'ALL' || _selectedCategory !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] underline px-2 py-1 shrink-0"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Ligne 2 : Ruban alphabétique A-Z malgache */}
          <div className="pt-2 border-t border-[var(--card-border)]/60 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10.5px] uppercase font-semibold text-[var(--text-subtle)] mr-1 shrink-0 flex items-center gap-1">
              <Filter size={11} /> Lettre :
            </span>
            {MALAGASY_ALPHABET.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`min-w-[24px] h-6 px-1.5 text-[11px] rounded-md transition font-mono font-medium cursor-pointer shrink-0 ${
                  selectedLetter === letter
                    ? 'bg-[var(--accent)] text-white font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                {letter === 'ALL' ? 'Tous' : letter}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau des mots rares */}
        <RakiTenyTable
          words={words}
          isLoading={isLoading}
          onEdit={handleOpenEditModal}
          onDelete={setDeletingWord}
          onSelect={setSelectedWord}
        />

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={25}
          onPageChange={setPage}
          isLoading={isLoading}
          itemLabel="mots rares"
        />
      </div>

      {/* Modale Formulaire Création / Édition */}
      {isModalOpen && (
        <RakiTenyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveWord}
          wordToEdit={editingWord}
        />
      )}

      {/* Modale Visualisation détaillée */}
      {selectedWord && (
        <Modal
          isOpen={!!selectedWord}
          onClose={() => setSelectedWord(null)}
          title={selectedWord.word}
          subtitle={selectedWord.phonetic ? `/${selectedWord.phonetic}/ • ${selectedWord.wordClassMg}` : selectedWord.wordClassMg}
          maxWidth="2xl"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/30">
                {selectedWord.rarityLabelFr || selectedWord.rarity}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                Catégorie : {selectedWord.category}
              </span>
              {selectedWord.isFeatured && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 ml-auto">
                  <Sparkles size={13} className="fill-amber-500" /> Mis en avant
                </span>
              )}
            </div>

            {/* Définitions */}
            <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-2">
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-wider">
                  Définition Malagasy
                </div>
                <div className="text-xs text-[var(--foreground)] mt-0.5 leading-relaxed">
                  {selectedWord.meaningMg}
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--card-border)]">
                <div className="text-[10px] uppercase font-bold text-stone-600 dark:text-stone-400 tracking-wider">
                  Traduction & Explication Française
                </div>
                <div className="text-xs text-[var(--muted)] mt-0.5 italic leading-relaxed">
                  {selectedWord.meaningFr}
                </div>
              </div>
            </div>

            {/* Exemple */}
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
              <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                Exemple d&apos;illustration
              </div>
              <div className="text-xs text-[var(--foreground)] font-serif italic">
                « {selectedWord.exampleMg} »
              </div>
              {selectedWord.exampleFr && (
                <div className="text-[11px] text-[var(--text-muted)] italic">
                  {selectedWord.exampleFr}
                </div>
              )}
            </div>

            {/* Contexte & Étymologie */}
            {(selectedWord.contextUsage || selectedWord.etymology) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedWord.contextUsage && (
                  <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-1">
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                      Contexte d&apos;usage
                    </div>
                    <div className="text-[11px] text-[var(--foreground)]">
                      {selectedWord.contextUsage}
                    </div>
                  </div>
                )}
                {selectedWord.etymology && (
                  <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-1">
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                      Origine / Étymologie
                    </div>
                    <div className="text-[11px] text-[var(--foreground)]">
                      {selectedWord.etymology}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Suppression */}
      <ConfirmModal
        isOpen={!!deletingWord}
        onClose={() => setDeletingWord(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le mot rare"
        description={`Êtes-vous sûr de vouloir supprimer définitivement « ${deletingWord?.word || ''} » du dictionnaire des mots rares ?`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminShell>
  );
}
