'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar, Pagination, ConfirmModal, LoadingState, EmptyState } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  Quote,
  Eye,
  Heart,
  User,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  BookOpen,
} from 'lucide-react';

interface CitationItem {
  id: string;
  citationMg: string;
  citationFr: string;
  sourceName: string;
  contexte?: string | null;
  audioUrl?: string | null;
  isPremium: boolean;
  viewCount: number;
  likesCount: number;
  shareCount: number;
  reportCount: number;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    bio?: string | null;
    birthYear?: number | null;
    deathYear?: number | null;
    avatarUrl?: string | null;
  } | null;
  themes?: Array<{
    theme: {
      nameMg: string;
      nameFr: string;
      color?: string;
    };
  }>;
}

const inputCls =
  'w-full px-2.5 py-1.5 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition';

export default function CitationsAdminPage() {
  const { toast } = useToast();
  const [citations, setCitations] = useState<CitationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  // Modal Édition / Création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Confirmation Suppression
  const [deletingItem, setDeletingItem] = useState<CitationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formCitation, setFormCitation] = useState({
    citationMg: '',
    citationFr: '',
    sourceName: '',
    authorName: '',
    contexte: '',
  });

  const loadCitations = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await fetchApi<{
        data: CitationItem[];
        meta: { total: number; totalPages: number };
      }>(`/citations?${params.toString()}`);

      setCitations(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: unknown) {
      console.error('Erreur chargement citations :', err);
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des citations';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    void loadCitations();
  }, [loadCitations]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormCitation({
      citationMg: '',
      citationFr: '',
      sourceName: '',
      authorName: '',
      contexte: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: CitationItem) => {
    setEditingId(item.id);
    setFormCitation({
      citationMg: item.citationMg,
      citationFr: item.citationFr,
      sourceName: item.sourceName,
      authorName: item.author?.name || '',
      contexte: item.contexte || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const payload = {
        citationMg: formCitation.citationMg.trim(),
        citationFr: formCitation.citationFr.trim(),
        sourceName: formCitation.sourceName.trim(),
        authorName: formCitation.authorName.trim() || undefined,
        contexte: formCitation.contexte.trim() || undefined,
      };

      if (editingId) {
        await fetchApi(`/citations/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Citation mise à jour avec succès.');
      } else {
        await fetchApi('/citations', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Nouvelle citation publiée avec succès.');
      }

      setIsModalOpen(false);
      void loadCitations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement de la citation';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      await fetchApi(`/citations/${deletingItem.id}`, {
        method: 'DELETE',
      });

      toast.success('Citation supprimée avec succès.');
      setDeletingItem(null);
      void loadCitations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">
        {/* En-tête standardisé */}
        <PageHeader
          title="Citations & Auteurs"
          description="Écrits des poètes, souverains et penseurs de Madagascar (Tenin'olon-kendry)."
          badge={`${totalCount} citation${totalCount > 1 ? 's' : ''}`}
          icon={Quote}
          primaryAction={{
            label: 'Nouvelle Citation',
            icon: <Plus size={14} />,
            onClick: openCreateModal,
          }}
        />

        {/* Barre de recherche */}
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Rechercher par auteur (Rabearivelo, Dox...), pensée ou source..."
          totalCount={totalCount}
        />

        {/* Liste des citations */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden">
          {isLoading ? (
            <LoadingState message="Chargement des citations..." />
          ) : citations.length === 0 ? (
            <EmptyState
              title="Aucune citation trouvée"
              description="Aucun résultat ne correspond à vos critères de recherche."
              action={{
                label: 'Créer une citation',
                icon: <Plus size={14} />,
                onClick: openCreateModal,
              }}
            />
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {citations.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col md:flex-row items-start justify-between gap-3 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--input-border)] flex items-center gap-1.5">
                        <User size={11} className="text-[var(--text-subtle)]" />
                        <span className="font-semibold">{item.author?.name || 'Auteur non renseigné'}</span>
                      </span>
                      {item.sourceName && (
                        <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)] flex items-center gap-1">
                          <BookOpen size={10} className="text-[var(--text-subtle)]" />
                          <span>{item.sourceName}</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                        « {item.citationMg} »
                      </p>
                      <p className="text-[11.5px] text-[var(--text-muted)] italic leading-relaxed">
                        « {item.citationFr} »
                      </p>
                    </div>

                    {item.contexte && (
                      <p className="text-[11.5px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {item.contexte}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-subtle)] mr-1">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        <span>{item.viewCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="text-rose-500" />
                        <span>{item.likesCount}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCitation(item)}
                      className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-xs font-medium transition cursor-pointer"
                    >
                      Détails
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      title="Modifier cette citation"
                      className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                    >
                      <Edit size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      title="Supprimer cette citation"
                      className="p-1.5 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination standardisée */}
          <div className="p-3 border-t border-[var(--card-border)]">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={15}
              onPageChange={setPage}
              isLoading={isLoading}
              itemLabel="citations"
            />
          </div>
        </div>

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={executeDelete}
          title="Supprimer la citation"
          description={`Êtes-vous sûr de vouloir supprimer définitivement la citation « ${deletingItem?.citationMg} » ? Cette action est irréversible.`}
          confirmText="Supprimer"
          isLoading={isDeleting}
          variant="danger"
        />

        {/* Modal Création / Édition Citation */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xl max-w-lg w-full max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    {editingId ? 'Modifier la citation' : 'Ajouter une citation'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {editingId ? 'Mise à jour de la pensée' : 'Enregistrer une nouvelle citation malgache'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Auteur (Poète, Écrivain, Penseur...)
                    </label>
                    <input
                      type="text"
                      value={formCitation.authorName}
                      onChange={(e) => setFormCitation({ ...formCitation, authorName: e.target.value })}
                      placeholder="Ex: Jean-Joseph Rabearivelo"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Ouvrage / Source *
                    </label>
                    <input
                      type="text"
                      value={formCitation.sourceName}
                      onChange={(e) => setFormCitation({ ...formCitation, sourceName: e.target.value })}
                      placeholder="Ex: Presque-Songes (1934)"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Citation en Malagasy *
                  </label>
                  <textarea
                    rows={2}
                    value={formCitation.citationMg}
                    onChange={(e) => setFormCitation({ ...formCitation, citationMg: e.target.value })}
                    placeholder="Texte original ou transcription en malgache..."
                    required
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Traduction en Français *
                  </label>
                  <textarea
                    rows={2}
                    value={formCitation.citationFr}
                    onChange={(e) => setFormCitation({ ...formCitation, citationFr: e.target.value })}
                    placeholder="Traduction française de la pensée..."
                    required
                    className={`${inputCls} italic`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Contexte historique / Explication littéraire (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    value={formCitation.contexte}
                    onChange={(e) => setFormCitation({ ...formCitation, contexte: e.target.value })}
                    placeholder="Circonstances de l'écriture, contexte philosophique..."
                    className={inputCls}
                  />
                </div>

                <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] transition cursor-pointer text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 rounded-md bg-[var(--foreground)] text-[var(--background)] text-xs font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Enregistrer' : 'Publier'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Détails Citation */}
        {selectedCitation && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xl max-w-lg w-full max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-[var(--foreground)]">
                    {selectedCitation.author?.name || 'Auteur non précisé'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">
                    Source : {selectedCitation.sourceName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCitation(null)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
                    Texte Malagasy
                  </div>
                  <div className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                    « {selectedCitation.citationMg} »
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
                    Traduction Française
                  </div>
                  <div className="text-[11.5px] text-[var(--text-muted)] italic leading-relaxed">
                    « {selectedCitation.citationFr} »
                  </div>
                </div>

                {selectedCitation.contexte && (
                  <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-medium">
                      Contexte littéraire &amp; historique
                    </div>
                    <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {selectedCitation.contexte}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-[var(--card-border)] bg-[var(--background)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCitation(null)}
                  className="px-3 py-1.5 rounded-md bg-[var(--foreground)] text-[var(--background)] text-xs font-medium hover:opacity-90 transition cursor-pointer"
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
