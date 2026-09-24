'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar, Pagination, ConfirmModal, LoadingState, EmptyState } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  ScrollText,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Bookmark,
  X,
  Loader2,
} from 'lucide-react';

interface MalagasyItem {
  id: string;
  slug: string;
  malagasy: string;
  french: string;
  meaning: string;
  example?: string | null;
  category: 'PROVERBE' | 'EXPRESSION' | 'DICTON';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: string;
  isFeatured: boolean;
  viewCount: number;
  likesCount: number;
  shareCount: number;
  reportCount: number;
  audioUrl?: string | null;
  themes?: Array<{
    theme: {
      nameMg: string;
      nameFr: string;
      color?: string;
    };
  }>;
  dialectVariants?: Array<{
    id: string;
    dialectName: string;
    text: string;
    notes?: string | null;
  }>;
}

export default function ProverbesAdminPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<MalagasyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [difficulty, setDifficulty] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<MalagasyItem | null>(null);

  // Modal Création / Édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Confirmation Suppression
  const [deletingItem, setDeletingItem] = useState<MalagasyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formItem, setFormItem] = useState({
    malagasy: '',
    french: '',
    meaning: '',
    example: '',
    category: 'PROVERBE' as 'PROVERBE' | 'EXPRESSION' | 'DICTON',
    difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD',
    isFeatured: false,
    dialectName: '',
    dialectText: '',
  });

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (category !== 'ALL') params.append('category', category);
      if (difficulty !== 'ALL') params.append('difficulty', difficulty);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetchApi<{
        data: MalagasyItem[];
        meta: { total: number; totalPages: number };
      }>(`/items?${params.toString()}`);

      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: unknown) {
      console.error('Erreur chargement proverbes :', err);
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des proverbes';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, category, difficulty, search, toast]);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
    });
    if (category !== 'ALL') params.append('category', category);
    if (difficulty !== 'ALL') params.append('difficulty', difficulty);
    if (search.trim()) params.append('search', search.trim());

    fetchApi<{
      data: MalagasyItem[];
      meta: { total: number; totalPages: number };
    }>(`/items?${params.toString()}`)
      .then((res) => {
        if (!isMounted) return;
        setItems(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalCount(res.meta?.total || 0);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('Erreur chargement proverbes :', err);
        const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des proverbes';
        toast.error(msg);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, category, difficulty, search, toast]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormItem({
      malagasy: '',
      french: '',
      meaning: '',
      example: '',
      category: 'PROVERBE',
      difficulty: 'EASY',
      isFeatured: false,
      dialectName: '',
      dialectText: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MalagasyItem) => {
    setEditingId(item.id);
    setFormItem({
      malagasy: item.malagasy,
      french: item.french,
      meaning: item.meaning,
      example: item.example || '',
      category: item.category,
      difficulty: item.difficulty,
      isFeatured: item.isFeatured,
      dialectName: item.dialectVariants?.[0]?.dialectName || '',
      dialectText: item.dialectVariants?.[0]?.text || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItem.malagasy.trim() || !formItem.french.trim() || !formItem.meaning.trim()) {
      toast.error('Veuillez renseigner le texte en malgache, la traduction et le sens.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        malagasy: formItem.malagasy.trim(),
        french: formItem.french.trim(),
        meaning: formItem.meaning.trim(),
        example: formItem.example.trim() || undefined,
        category: formItem.category,
        difficulty: formItem.difficulty,
        isFeatured: formItem.isFeatured,
        dialectName: formItem.dialectName.trim() || undefined,
        dialectText: formItem.dialectText.trim() || undefined,
      };

      if (editingId) {
        await fetchApi(`/items/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Proverbe mis à jour avec succès !');
      } else {
        await fetchApi('/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Nouveau proverbe ajouté avec succès !');
      }

      setIsModalOpen(false);
      void loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du proverbe';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      await fetchApi(`/items/${deletingItem.id}`, {
        method: 'DELETE',
      });

      toast.success('Proverbe supprimé avec succès.');
      setDeletingItem(null);
      void loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async (item: MalagasyItem) => {
    try {
      const updated = !item.isFeatured;
      await fetchApi(`/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isFeatured: updated }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isFeatured: updated } : i))
      );
      toast.success(updated ? 'Mis en avant !' : 'Retiré de la mise en avant');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise en avant';
      toast.error(msg);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">
        {/* En-tête standardisé */}
        <PageHeader
          title="Proverbes & Fady (Ohabolana)"
          description="Corpus des traditions orales et sagesses ancestrales de Madagascar."
          icon={ScrollText}
          primaryAction={{
            label: 'Nouveau Proverbe',
            icon: <Plus size={14} />,
            onClick: openCreateModal,
          }}
        />

        {/* Barre de recherche avec filtres intégrés */}
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Rechercher par mot-clé malgache, traduction ou sens culturel..."
          totalCount={totalCount}
          filters={
            <>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { label: 'Tous', value: 'ALL' },
                  { label: 'Ohabolana', value: 'PROVERBE' },
                  { label: 'Oha-pitenenana', value: 'EXPRESSION' },
                  { label: 'Hatra / Fady', value: 'DICTON' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setCategory(tab.value);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      category === tab.value
                        ? 'bg-[var(--accent)] text-white shadow-xs'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] border border-[var(--input-border)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <select
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setPage(1);
                }}
                className="py-1 px-2 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] font-medium text-[var(--foreground)]"
              >
                <option value="ALL">Difficulté : Toutes</option>
                <option value="EASY">Tsotra (Courant)</option>
                <option value="MEDIUM">Antoniny (Moyen)</option>
                <option value="HARD">Sarotra (Littéraire)</option>
              </select>
            </>
          }
        />

        {/* Fiches de Proverbes */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] overflow-hidden">
          {isLoading ? (
            <LoadingState message="Chargement des sagesses..." />
          ) : items.length === 0 ? (
            <EmptyState
              title="Aucun proverbe trouvé"
              description="Aucune sagesse ne correspond à vos critères de recherche ou filtres."
              action={{
                label: 'Créer un proverbe',
                icon: <Plus size={14} />,
                onClick: openCreateModal,
              }}
            />
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col md:flex-row items-start justify-between gap-4 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10.5px] font-bold uppercase px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                        {item.category}
                      </span>
                      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]">
                        {item.difficulty === 'EASY'
                          ? 'Courant'
                          : item.difficulty === 'MEDIUM'
                          ? 'Intermédiaire'
                          : 'Littéraire'}
                      </span>
                      {item.isFeatured && (
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Bookmark size={11} fill="currentColor" />
                          <span>À la Une</span>
                        </span>
                      )}
                      {item.dialectVariants && item.dialectVariants.length > 0 && (
                        <span className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)] flex items-center gap-1">
                          <MapPin size={11} />
                          <span>{item.dialectVariants.length} variante(s)</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                        « {item.malagasy} »
                      </h3>
                      <div className="text-[11px] text-[var(--text-muted)] italic leading-relaxed">
                        {item.french}
                      </div>
                    </div>

                    <div className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.meaning}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleToggleFeatured(item)}
                      title={item.isFeatured ? 'Retirer de la Une' : 'Mettre à la Une'}
                      className={`p-1.5 rounded-md border transition cursor-pointer ${
                        item.isFeatured
                          ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-amber-500'
                      }`}
                    >
                      <Bookmark size={13} fill={item.isFeatured ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={() => setSelectedItem(item)}
                      className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-xs font-medium transition cursor-pointer"
                    >
                      Détails
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      title="Modifier ce proverbe"
                      className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                    >
                      <Edit size={13} />
                    </button>

                    <button
                      onClick={() => setDeletingItem(item)}
                      title="Supprimer ce proverbe"
                      className="p-1.5 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination standardisée */}
          <div className="p-3">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={15}
              onPageChange={setPage}
              isLoading={isLoading}
              itemLabel="proverbes"
            />
          </div>
        </div>

        {/* Modal Confirmation de Suppression standardisée */}
        <ConfirmModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={executeDelete}
          title="Supprimer le proverbe"
          description={`Êtes-vous sûr de vouloir supprimer définitivement le proverbe « ${deletingItem?.malagasy} » ? Cette action est irréversible.`}
          confirmText="Supprimer"
          isLoading={isDeleting}
          variant="danger"
        />

        {/* Modal Création / Édition Proverbe */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
            <div className="kanto-card rounded-xl border border-[var(--card-border)] shadow-xl max-w-lg w-full max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    {editingId ? 'Modifier la sagesse' : 'Ajouter une nouvelle sagesse'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {editingId ? 'Édition du proverbe ou dicton' : 'Enregistrer un proverbe ou dicton'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Catégorie *
                    </label>
                    <select
                      value={formItem.category}
                      onChange={(e) => setFormItem({ ...formItem, category: e.target.value as MalagasyItem['category'] })}
                      className="w-full px-2.5 py-1.5 rounded-md kanto-input text-xs"
                    >
                      <option value="PROVERBE">Ohabolana (Proverbe)</option>
                      <option value="EXPRESSION">Oha-pitenenana (Expression)</option>
                      <option value="DICTON">Fomba fiteny / Fady (Dicton)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                      Niveau de difficulté *
                    </label>
                    <select
                      value={formItem.difficulty}
                      onChange={(e) => setFormItem({ ...formItem, difficulty: e.target.value as MalagasyItem['difficulty'] })}
                      className="w-full p-3.5 rounded-xl kanto-input text-base"
                    >
                      <option value="EASY">Tsotra (Courant / Populaire)</option>
                      <option value="MEDIUM">Antoniny (Intermédiaire)</option>
                      <option value="HARD">Sarotra (Littéraire / Ancien)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Texte en Malagasy *
                  </label>
                  <textarea
                    rows={2}
                    value={formItem.malagasy}
                    onChange={(e) => setFormItem({ ...formItem, malagasy: e.target.value })}
                    placeholder="Ex: Ny fihavanana toy ny ketsa, raha tsy terena tsy maniry..."
                    required
                    className="w-full p-4 rounded-xl kanto-input font-heritage font-bold text-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Traduction en Français *
                  </label>
                  <textarea
                    rows={2}
                    value={formItem.french}
                    onChange={(e) => setFormItem({ ...formItem, french: e.target.value })}
                    placeholder="Ex: La parenté est comme de jeunes plants de riz..."
                    required
                    className="w-full p-4 rounded-xl kanto-input italic font-serif text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Sens culturel &amp; Explication *
                  </label>
                  <textarea
                    rows={3}
                    value={formItem.meaning}
                    onChange={(e) => setFormItem({ ...formItem, meaning: e.target.value })}
                    placeholder="Explication du contexte, de la morale et des enseignements traditionnels..."
                    required
                    className="w-full p-4 rounded-xl kanto-input text-base"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                      Exemple d&apos;usage (optionnel)
                    </label>
                    <input
                      type="text"
                      value={formItem.example}
                      onChange={(e) => setFormItem({ ...formItem, example: e.target.value })}
                      placeholder="Ex: Ampiasaina rehefa mampihavana..."
                      className="w-full p-3.5 rounded-xl kanto-input text-base"
                    />
                  </div>

                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formItem.isFeatured}
                        onChange={(e) => setFormItem({ ...formItem, isFeatured: e.target.checked })}
                        className="w-5 h-5 rounded text-[var(--accent)]"
                      />
                      <span className="font-bold text-base text-[var(--foreground)]">
                        Mettre en avant sur l&apos;accueil
                      </span>
                    </label>
                  </div>
                </div>

                {/* Variante dialectale */}
                <div className="pt-4 border-t border-[var(--card-border)] space-y-3">
                  <div className="text-xs font-bold uppercase text-[var(--text-subtle)]">
                    Variante dialectale régionale (optionnel)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formItem.dialectName}
                      onChange={(e) => setFormItem({ ...formItem, dialectName: e.target.value })}
                      placeholder="Nom du dialecte (ex: Betsimisaraka)"
                      className="w-full p-3.5 rounded-xl kanto-input text-base"
                    />
                    <input
                      type="text"
                      value={formItem.dialectText}
                      onChange={(e) => setFormItem({ ...formItem, dialectText: e.target.value })}
                      placeholder="Texte dans le dialecte régional"
                      className="w-full p-3.5 rounded-xl kanto-input text-base"
                    />
                  </div>
                </div>

                <div className="pt-5 border-t border-[var(--card-border)] flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer text-base font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold transition-all disabled:opacity-50 flex items-center gap-2.5 cursor-pointer shadow-soft text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Enregistrer les modifications' : 'Publier la sagesse'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Détails Proverbe */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
            <div className="kanto-card rounded-xl border border-[var(--card-border)] shadow-xl max-w-lg w-full max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">Détails de la sagesse</span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Texte Malagasy
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                    « {selectedItem.malagasy} »
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Traduction Française
                  </div>
                  <div className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                    « {selectedItem.french} »
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium">
                    Sens &amp; Enseignement
                  </div>
                  <div className="text-xs text-[var(--foreground)] leading-relaxed">
                    {selectedItem.meaning}
                  </div>
                </div>

                {selectedItem.example && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      Exemple d&apos;usage
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {selectedItem.example}
                    </div>
                  </div>
                )}

                {selectedItem.dialectVariants && selectedItem.dialectVariants.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      Variantes régionales
                    </div>
                    <div className="space-y-2">
                      {selectedItem.dialectVariants.map((v) => (
                        <div key={v.id} className="p-2.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs">
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">{v.dialectName}</div>
                          <div className="text-xs mt-0.5">« {v.text} »</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-[var(--card-border)] bg-[var(--background)] flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
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
