'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal, Modal } from '@/components/ui';
import { useContes, ContesTable, ConteModal } from '@/features/contes';
import { ConteItem, ConteFormData, AudioFilterType } from '@/types/conte';
import {
  BookOpen,
  Search,
  Plus,
  RefreshCw,
} from 'lucide-react';

export default function ContesAdminPage() {
  const {
    contes,
    isLoading,
    loadContes,
    saveConte,
    deleteConte,
    generateAudio,
  } = useContes();

  const [search, setSearch] = useState('');
  const [audioFilter, setAudioFilter] = useState<AudioFilterType>('ALL');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingLang, setGeneratingLang] = useState<'mg' | 'fr' | 'all' | null>(null);

  // Modale création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Détails / Lecteur d'un conte
  const [selectedConte, setSelectedConte] = useState<ConteItem | null>(null);

  // Suppression
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (conte: ConteItem) => {
    setEditingId(conte.id);
    setIsModalOpen(true);
  };

  const handleSaveConte = async (data: ConteFormData, id?: string | null) => {
    await saveConte(data, id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteConte(deletingId);
      setDeletingId(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(`Erreur lors de la suppression : ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateAudio = async (id: string, lang: 'mg' | 'fr' | 'all') => {
    setGeneratingId(id);
    setGeneratingLang(lang);
    try {
      await generateAudio(id, lang, false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(`Erreur synthèse TTS : ${msg}`);
    } finally {
      setGeneratingId(null);
      setGeneratingLang(null);
    }
  };

  const filteredContes = contes.filter((conte) => {
    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      conte.title.toLowerCase().includes(q) ||
      conte.titleFr.toLowerCase().includes(q);

    let matchAudio = true;
    if (audioFilter === 'HAS_MG') matchAudio = !!conte.audioUrlMg;
    if (audioFilter === 'HAS_FR') matchAudio = !!conte.audioUrlFr;
    if (audioFilter === 'MISSING') matchAudio = !conte.audioUrlMg || !conte.audioUrlFr;

    return matchQuery && matchAudio;
  });

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">
        <PageHeader
          title="Contes & Angano"
          description="Préservation des récits oraux malagasy et génération studio audio Gemini TTS."
          icon={BookOpen}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={loadContes}
                disabled={isLoading}
                className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                title="Actualiser les contes"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="px-3 py-1.5 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 text-xs font-medium shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouveau conte</span>
              </button>
            </div>
          }
        />

        {/* Filtres & Recherche */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[var(--card)] p-2.5 rounded-lg border border-[var(--card-border)]">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL' as const, label: `Tous (${contes.length})` },
              {
                id: 'HAS_MG' as const,
                label: `Audio MG (${contes.filter((c) => !!c.audioUrlMg).length})`,
              },
              {
                id: 'HAS_FR' as const,
                label: `Audio FR (${contes.filter((c) => !!c.audioUrlFr).length})`,
              },
              {
                id: 'MISSING' as const,
                label: `Audio manquant (${
                  contes.filter((c) => !c.audioUrlMg || !c.audioUrlFr).length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAudioFilter(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer font-medium ${
                  audioFilter === tab.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              type="text"
              placeholder="Rechercher par titre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Tableau des contes */}
        <div className="border border-[var(--card-border)] rounded-lg bg-[var(--card)] overflow-hidden">
          <ContesTable
            contes={filteredContes}
            isLoading={isLoading}
            generatingId={generatingId}
            generatingLang={generatingLang}
            onGenerateAudio={handleGenerateAudio}
            onSelect={setSelectedConte}
            onEdit={handleOpenEditModal}
            onDelete={setDeletingId}
          />
        </div>
      </div>

      {/* Modale Formulaire */}
      {isModalOpen && (
        <ConteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingId={editingId}
          onSave={handleSaveConte}
        />
      )}

      {/* Modale Visualisation des paragraphes */}
      {selectedConte && (
        <Modal
          isOpen={!!selectedConte}
          onClose={() => setSelectedConte(null)}
          title={selectedConte.title}
          subtitle={selectedConte.titleFr}
          maxWidth="2xl"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {selectedConte.moralMg && (
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-xs">
                <div className="font-semibold text-amber-900 dark:text-amber-300 mb-1">
                  Morale / Fahendrena :
                </div>
                <div className="italic text-[var(--foreground)]">{selectedConte.moralMg}</div>
                {selectedConte.moralFr && (
                  <div className="text-[var(--text-muted)] mt-1">{selectedConte.moralFr}</div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {(selectedConte.paragraphs || []).map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] space-y-1.5"
                >
                  <div className="text-[10px] font-mono text-[var(--text-subtle)] uppercase">
                    Paragraphe {p.paragraphNumber || idx + 1}
                  </div>
                  <div className="text-xs text-[var(--foreground)] leading-relaxed">
                    {p.textMg}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] italic leading-relaxed pt-1 border-t border-[var(--card-border)]/50">
                    {p.textFr}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Suppression */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le conte"
        description="Êtes-vous certain de vouloir supprimer définitivement ce conte et ses pistes audio ?"
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminShell>
  );
}
