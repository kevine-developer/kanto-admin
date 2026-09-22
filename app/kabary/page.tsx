'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { fetchApi } from '@/lib/api-client';
import {
  Search,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  User,
  Users,
  MapPin,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface KabaryStep {
  id?: string;
  stepNumber: number;
  stepNameMg: string;
  stepNameFr: string;
  explanationMg?: string | null;
  explanationFr?: string | null;
  textMg: string;
  textFr: string;
}

interface KabaryItem {
  id: string;
  slug: string;
  title: string;
  titleFr: string;
  subtitle?: string | null;
  occasion: string;
  occasionFr?: string | null;
  speakerRoleMg?: string | null;
  recipientRoleMg?: string | null;
  region?: string | null;
  concludingProverbMg?: string | null;
  viewCount: number;
  likesCount: number;
  steps: KabaryStep[];
  themes?: Array<{
    theme: {
      nameMg: string;
      nameFr: string;
    };
  }>;
}

export default function KabaryAdminPage() {
  const [kabaries, setKabaries] = useState<KabaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedKabary, setSelectedKabary] = useState<KabaryItem | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formKabary, setFormKabary] = useState({
    title: '',
    titleFr: '',
    occasion: '',
    occasionFr: '',
    speakerRoleMg: '',
    recipientRoleMg: '',
    region: '',
    concludingProverbMg: '',
    steps: [
      {
        stepNameMg: 'Fialan-tsiny',
        stepNameFr: 'Demande d’excuses et politesse oratoire',
        explanationFr: 'L’orateur demande pardon aux aînés et à l’assemblée avant de prendre la parole.',
        textMg: '',
        textFr: '',
      },
    ],
  });

  const loadKabary = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await fetchApi<{
        data: KabaryItem[];
        meta: { total: number; totalPages: number };
      }>(`/kabary?${params.toString()}`);

      setKabaries(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err) {
      console.error('Erreur chargement kabary :', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
    });
    if (search.trim()) params.append('search', search.trim());

    fetchApi<{
      data: KabaryItem[];
      meta: { total: number; totalPages: number };
    }>(`/kabary?${params.toString()}`)
      .then((res) => {
        if (!isMounted) return;
        setKabaries(res.data || []);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalCount(res.meta?.total || 0);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erreur chargement kabary :', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadKabary();
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormKabary({
      title: '',
      titleFr: '',
      occasion: '',
      occasionFr: '',
      speakerRoleMg: '',
      recipientRoleMg: '',
      region: '',
      concludingProverbMg: '',
      steps: [
        {
          stepNameMg: 'Fialan-tsiny',
          stepNameFr: 'Demande d’excuses et politesse oratoire',
          explanationFr: 'L’orateur demande pardon aux aînés et à l’assemblée avant de prendre la parole.',
          textMg: '',
          textFr: '',
        },
      ],
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (kabary: KabaryItem) => {
    setEditingId(kabary.id);
    try {
      const full = await fetchApi<KabaryItem>(`/kabary/${kabary.id}`);
      const steps =
        full.steps && full.steps.length > 0
          ? full.steps.map((s) => ({
              stepNameMg: s.stepNameMg,
              stepNameFr: s.stepNameFr,
              explanationFr: s.explanationFr || '',
              textMg: s.textMg,
              textFr: s.textFr,
            }))
          : [
              {
                stepNameMg: 'Fialan-tsiny',
                stepNameFr: 'Demande d’excuses',
                explanationFr: '',
                textMg: '',
                textFr: '',
              },
            ];

      setFormKabary({
        title: full.title,
        titleFr: full.titleFr,
        occasion: full.occasion,
        occasionFr: full.occasionFr || '',
        speakerRoleMg: full.speakerRoleMg || '',
        recipientRoleMg: full.recipientRoleMg || '',
        region: full.region || '',
        concludingProverbMg: full.concludingProverbMg || '',
        steps,
      });
    } catch {
      setFormKabary({
        title: kabary.title,
        titleFr: kabary.titleFr,
        occasion: kabary.occasion,
        occasionFr: kabary.occasionFr || '',
        speakerRoleMg: kabary.speakerRoleMg || '',
        recipientRoleMg: kabary.recipientRoleMg || '',
        region: kabary.region || '',
        concludingProverbMg: kabary.concludingProverbMg || '',
        steps: [
          {
            stepNameMg: 'Fialan-tsiny',
            stepNameFr: 'Demande d’excuses',
            explanationFr: '',
            textMg: '',
            textFr: '',
          },
        ],
      });
    }
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    setFormKabary((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          stepNameMg: '',
          stepNameFr: '',
          explanationFr: '',
          textMg: '',
          textFr: '',
        },
      ],
    }));
  };

  const handleRemoveStep = (index: number) => {
    if (formKabary.steps.length <= 1) return;
    setFormKabary((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, idx) => idx !== index),
    }));
  };

  const handleStepChange = (index: number, field: string, value: string) => {
    setFormKabary((prev) => {
      const updated = [...prev.steps];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, steps: updated };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKabary.title.trim() || !formKabary.titleFr.trim() || !formKabary.occasion.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Veuillez renseigner le titre en malgache, en français et l’occasion rituelle.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMessage(null);

      const validSteps = formKabary.steps
        .filter((s) => s.stepNameMg.trim() && s.textMg.trim())
        .map((s, idx) => ({
          stepNumber: idx + 1,
          stepNameMg: s.stepNameMg.trim(),
          stepNameFr: s.stepNameFr.trim() || s.stepNameMg.trim(),
          explanationFr: s.explanationFr.trim() || undefined,
          textMg: s.textMg.trim(),
          textFr: s.textFr.trim() || '',
        }));

      const payload = {
        title: formKabary.title.trim(),
        titleFr: formKabary.titleFr.trim(),
        occasion: formKabary.occasion.trim(),
        occasionFr: formKabary.occasionFr.trim() || undefined,
        speakerRoleMg: formKabary.speakerRoleMg.trim() || undefined,
        recipientRoleMg: formKabary.recipientRoleMg.trim() || undefined,
        region: formKabary.region.trim() || undefined,
        concludingProverbMg: formKabary.concludingProverbMg.trim() || undefined,
        steps: validSteps.length > 0 ? validSteps : [],
      };

      if (editingId) {
        await fetchApi(`/kabary/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setFeedbackMessage({ type: 'success', text: 'Discours Kabary mis à jour avec succès !' });
      } else {
        await fetchApi('/kabary', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFeedbackMessage({ type: 'success', text: 'Nouveau discours Kabary enregistré avec succès !' });
      }

      setIsModalOpen(false);
      void loadKabary();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du discours';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKabary = async (kabary: KabaryItem) => {
    if (!confirm(`Confirmez-vous la suppression du discours : « ${kabary.title} » ?`)) {
      return;
    }

    try {
      setDeletingId(kabary.id);
      setFeedbackMessage(null);

      await fetchApi(`/kabary/${kabary.id}`, {
        method: 'DELETE',
      });

      setFeedbackMessage({ type: 'success', text: 'Discours supprimé avec succès.' });
      void loadKabary();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Discours &amp; Protocoles (Kabary)
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Éloquence et diplomatie ancestrale &bull; {totalCount} discours conservés
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-3 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus size={14} />
              <span>Nouveau Kabary</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-5 rounded-2xl border flex items-start gap-3.5 text-base leading-relaxed ${
              feedbackMessage.type === 'success'
                ? 'bg-[var(--accent-light)] border-[var(--accent-border)] text-[var(--accent-text)]'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 size={20} className="shrink-0 text-[var(--accent-text)] mt-0.5" />
            ) : (
              <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
            )}
            <div className="flex-1 font-semibold">{feedbackMessage.text}</div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-[var(--card)] rounded-lg p-2.5 border border-[var(--card-border)]">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par occasion (Vodiondry, Famadihana...), orateur ou formule..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
            />
          </form>
        </div>

        {/* Kabary List */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--card-border)] overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-muted)] space-y-2">
              <Loader2 size={24} className="animate-spin text-[var(--accent)] mx-auto" />
              <div className="text-xs font-medium">Chargement des discours kabary...</div>
            </div>
          ) : kabaries.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)]">
              Aucun discours ne correspond aux termes saisis.
            </div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {kabaries.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col md:flex-row items-start justify-between gap-3 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        {item.occasion}
                      </span>
                      {item.region && (
                        <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)] flex items-center gap-1">
                          <MapPin size={11} />
                          <span>{item.region}</span>
                        </span>
                      )}
                      <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]">
                        {item.steps?.length || 0} étapes
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                        {item.title}
                      </h3>
                      <div className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                        {item.titleFr}
                      </div>
                    </div>

                    {/* Roles */}
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)] pt-0.5">
                      {item.speakerRoleMg && (
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-[var(--accent-text)]" />
                          <span>Mpikabary : <strong className="text-[var(--foreground)] font-medium">{item.speakerRoleMg}</strong></span>
                        </div>
                      )}
                      {item.recipientRoleMg && (
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="text-[var(--text-subtle)]" />
                          <span>Mpihaino : <strong className="text-[var(--foreground)] font-medium">{item.recipientRoleMg}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)] mr-1">
                      <span className="flex items-center gap-1">
                        <Eye size={13} />
                        <span>{item.viewCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={13} className="text-red-500" />
                        <span>{item.likesCount}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedKabary(item);
                        setActiveStepIndex(0);
                      }}
                      className="px-2.5 py-1 rounded-md bg-[var(--foreground)] text-[var(--background)] text-xs font-medium hover:opacity-90 transition cursor-pointer"
                    >
                      Déclamer
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      title="Modifier ce discours"
                      className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                    >
                      <Edit size={13} />
                    </button>

                    <button
                      onClick={() => handleDeleteKabary(item)}
                      disabled={deletingId === item.id}
                      title="Supprimer ce discours"
                      className="p-1.5 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="p-5 border-t border-[var(--card-border)] bg-[var(--background)] flex items-center justify-between">
              <div className="text-base text-[var(--text-muted)]">
                Page <span className="font-bold text-[var(--foreground)]">{page}</span> sur{' '}
                <span className="font-bold text-[var(--foreground)]">{totalPages}</span> ({totalCount} discours)
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Création / Édition Kabary */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xl max-w-xl w-full max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    {editingId ? 'Modifier le discours Kabary' : 'Ajouter un nouveau discours Kabary'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {editingId ? 'Mise à jour des formules protocolaires' : 'Enregistrer les étapes oratoires et formules'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Titre du Kabary (Malagasy) *
                    </label>
                    <input
                      type="text"
                      value={formKabary.title}
                      onChange={(e) => setFormKabary({ ...formKabary, title: e.target.value })}
                      placeholder="Ex: Kabary fangataham-bady"
                      required
                      className="w-full px-2.5 py-1.5 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Titre en Français *
                    </label>
                    <input
                      type="text"
                      value={formKabary.titleFr}
                      onChange={(e) => setFormKabary({ ...formKabary, titleFr: e.target.value })}
                      placeholder="Ex: Discours de demande en mariage"
                      required
                      className="w-full px-2.5 py-1.5 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] italic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Occasion *
                    </label>
                    <input
                      type="text"
                      value={formKabary.occasion}
                      onChange={(e) => setFormKabary({ ...formKabary, occasion: e.target.value })}
                      placeholder="Ex: Fanambadiana / Fisaorana"
                      required
                      className="w-full px-2.5 py-1.5 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Rôle de l&apos;Orateur
                    </label>
                    <input
                      type="text"
                      value={formKabary.speakerRoleMg}
                      onChange={(e) => setFormKabary({ ...formKabary, speakerRoleMg: e.target.value })}
                      placeholder="Ex: Mpikabarin'ny lahy"
                      className="w-full px-2.5 py-1.5 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Rôle de l&apos;Auditoire
                    </label>
                    <input
                      type="text"
                      value={formKabary.recipientRoleMg}
                      onChange={(e) => setFormKabary({ ...formKabary, recipientRoleMg: e.target.value })}
                      placeholder="Ex: Havon'ny vavy"
                      className="w-full px-2.5 py-1.5 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                {/* Étapes form */}
                <div className="space-y-2.5 pt-2 border-t border-[var(--card-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      Temps oratoires ({formKabary.steps.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="px-2 py-1 rounded bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] text-[11px] font-medium hover:bg-[var(--card-hover)] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Ajouter un temps</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formKabary.steps.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-medium text-[var(--accent)]">
                            Étape {idx + 1}
                          </span>
                          {formKabary.steps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              className="text-[11px] text-red-500 hover:underline cursor-pointer"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={s.stepNameMg}
                            onChange={(e) => handleStepChange(idx, 'stepNameMg', e.target.value)}
                            placeholder="Nom de l'étape en malgache..."
                            required
                            className="w-full px-2 py-1 rounded bg-[var(--card)] border border-[var(--card-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                          />
                          <input
                            type="text"
                            value={s.stepNameFr}
                            onChange={(e) => handleStepChange(idx, 'stepNameFr', e.target.value)}
                            placeholder="Nom de l'étape en français..."
                            required
                            className="w-full px-2 py-1 rounded bg-[var(--card)] border border-[var(--card-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={s.textMg}
                          onChange={(e) => handleStepChange(idx, 'textMg', e.target.value)}
                          placeholder="Formule oratoire en malgache..."
                          required
                          className="w-full px-2 py-1 rounded bg-[var(--card)] border border-[var(--card-border)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                        />

                        <textarea
                          rows={2}
                          value={s.textFr}
                          onChange={(e) => handleStepChange(idx, 'textFr', e.target.value)}
                          placeholder="Traduction française..."
                          className="w-full px-2 py-1 rounded bg-[var(--card)] border border-[var(--card-border)] text-xs text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] italic"
                        />
                      </div>
                    ))}
                  </div>
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
                      <span>{editingId ? 'Enregistrer' : 'Publier le Kabary'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Déroulé du Kabary */}
        {selectedKabary && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
            <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xl max-w-xl w-full max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                      {selectedKabary.occasion}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {selectedKabary.steps?.length || 0} temps oratoires
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] mt-1">
                    {selectedKabary.title}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedKabary(null)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Étapes du discours */}
              {selectedKabary.steps && selectedKabary.steps.length > 0 && (
                <div className="px-4 py-2 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center gap-1.5 overflow-x-auto">
                  {selectedKabary.steps.map((step, idx) => (
                    <button
                      key={step.id || idx}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition cursor-pointer ${
                        activeStepIndex === idx
                          ? 'bg-[var(--foreground)] text-[var(--background)]'
                          : 'bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] border border-[var(--card-border)]'
                      }`}
                    >
                      {step.stepNumber}. {step.stepNameMg}
                    </button>
                  ))}
                </div>
              )}

              {/* Contenu Déclamé */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
                {selectedKabary.steps && selectedKabary.steps[activeStepIndex] ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wide">
                        {selectedKabary.steps[activeStepIndex].stepNameMg}
                      </h3>
                      <div className="text-[11px] text-[var(--text-muted)] italic">
                        {selectedKabary.steps[activeStepIndex].stepNameFr}
                      </div>
                    </div>

                    {selectedKabary.steps[activeStepIndex].explanationFr && (
                      <div className="p-2.5 rounded-md bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                        <strong className="font-medium">Protocole : </strong>
                        {selectedKabary.steps[activeStepIndex].explanationFr}
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-medium">
                        Formule oratoire en Malagasy
                      </div>
                      <div className="text-xs font-medium text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                        {selectedKabary.steps[activeStepIndex].textMg}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--card)] border border-[var(--card-border)] space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
                        Traduction Française
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] leading-relaxed italic whitespace-pre-line">
                        {selectedKabary.steps[activeStepIndex].textFr}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-[var(--text-muted)] py-8">
                    Aucune étape oratoire disponible.
                  </div>
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-[var(--card-border)] bg-[var(--background)] flex items-center justify-between">
                <button
                  onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
                  disabled={activeStepIndex <= 0}
                  className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--text-muted)] hover:bg-[var(--card-hover)] disabled:opacity-40 transition cursor-pointer"
                >
                  &larr; Étape précédente
                </button>

                <div className="text-xs text-[var(--text-muted)] font-mono">
                  {activeStepIndex + 1} / {selectedKabary.steps?.length || 1}
                </div>

                <button
                  onClick={() =>
                    setActiveStepIndex((i) =>
                      Math.min((selectedKabary.steps?.length || 1) - 1, i + 1)
                    )
                  }
                  disabled={
                    activeStepIndex >= (selectedKabary.steps?.length || 1) - 1
                  }
                  className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--text-muted)] hover:bg-[var(--card-hover)] disabled:opacity-40 transition cursor-pointer"
                >
                  Étape suivante &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
