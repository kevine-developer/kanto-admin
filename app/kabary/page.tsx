'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal } from '@/components/ui';
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
  Mic,
  RotateCcw,
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

const inputCls =
  'w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--text-subtle)]';

export default function KabaryAdminPage() {
  const [kabaries, setKabaries] = useState<KabaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedKabary, setSelectedKabary] = useState<KabaryItem | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [deletingKabary, setDeletingKabary] = useState<KabaryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        limit: '15',
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
    void loadKabary();
  }, [loadKabary]);

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

  const handleConfirmDelete = async () => {
    if (!deletingKabary) return;

    try {
      setIsDeleting(true);
      await fetchApi(`/kabary/${deletingKabary.id}`, {
        method: 'DELETE',
      });

      setFeedbackMessage({ type: 'success', text: 'Discours supprimé avec succès.' });
      setDeletingKabary(null);
      void loadKabary();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 max-w-6xl mx-auto pb-12">
        {/* En-tête standardisé */}
        <PageHeader
          title="Discours & Protocoles (Kabary)"
          description="Éloquence et diplomatie ancestrale : joutes oratoires, fialan-tsiny et formules rituelles."
          icon={Mic}
          badge={
            <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs">
              {totalCount} discours
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadKabary()}
                disabled={isLoading}
                className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition cursor-pointer shadow-xs disabled:opacity-50"
                title="Actualiser"
              >
                <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={openCreateModal}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              >
                <Plus size={14} />
                <span>Nouveau Kabary</span>
              </button>
            </div>
          }
        />

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium shadow-xs ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0" />
              ) : (
                <AlertCircle size={15} className="shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs">
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
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </form>
        </div>

        {/* Liste des Kabary */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
              <span className="text-xs text-[var(--text-muted)]">Chargement des discours kabary...</span>
            </div>
          ) : kabaries.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Aucun discours ne correspond aux termes saisis.
            </div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {kabaries.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col md:flex-row items-start justify-between gap-3 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                        {item.occasion}
                      </span>
                      {item.region && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)] flex items-center gap-1">
                          <MapPin size={10} />
                          <span>{item.region}</span>
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]">
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

                    {/* Rôles */}
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)] pt-0.5 flex-wrap">
                      {item.speakerRoleMg && (
                        <div className="flex items-center gap-1">
                          <User size={12} className="text-[var(--accent)]" />
                          <span>Mpikabary : <strong className="text-[var(--foreground)] font-medium">{item.speakerRoleMg}</strong></span>
                        </div>
                      )}
                      {item.recipientRoleMg && (
                        <div className="flex items-center gap-1">
                          <Users size={12} className="text-[var(--text-subtle)]" />
                          <span>Mpihaino : <strong className="text-[var(--foreground)] font-medium">{item.recipientRoleMg}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)] mr-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Eye size={12} />
                        <span>{item.viewCount}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Heart size={12} className="text-rose-500" />
                        <span>{item.likesCount}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedKabary(item);
                        setActiveStepIndex(0);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] border border-[var(--card-border)] text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      Déclamer
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      title="Modifier ce discours"
                      className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
                    >
                      <Edit size={13} />
                    </button>

                    <button
                      onClick={() => setDeletingKabary(item)}
                      title="Supprimer ce discours"
                      className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="px-4 py-2.5 border-t border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div>
                Page <span className="font-mono font-bold text-[var(--foreground)]">{page}</span> sur{' '}
                <span className="font-mono font-bold text-[var(--foreground)]">{totalPages}</span> ({totalCount} discours)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-40 transition cursor-pointer shadow-xs"
                >
                  <ChevronLeft size={13} />
                  <span>Précédent</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-40 transition cursor-pointer shadow-xs"
                >
                  <span>Suivant</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Création / Édition Kabary */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 animate-in fade-in duration-150">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-2xl max-w-xl w-full max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    {editingId ? 'Modifier le discours Kabary' : 'Ajouter un nouveau discours Kabary'}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {editingId ? 'Mise à jour des formules protocolaires' : 'Enregistrer les étapes oratoires et formules'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Titre en Malagasy *
                    </label>
                    <input
                      type="text"
                      value={formKabary.title}
                      onChange={(e) => setFormKabary({ ...formKabary, title: e.target.value })}
                      placeholder="Ex: Kabary fangataham-bady"
                      required
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Titre en Français *
                    </label>
                    <input
                      type="text"
                      value={formKabary.titleFr}
                      onChange={(e) => setFormKabary({ ...formKabary, titleFr: e.target.value })}
                      placeholder="Ex: Discours de demande en mariage"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Occasion *
                    </label>
                    <input
                      type="text"
                      value={formKabary.occasion}
                      onChange={(e) => setFormKabary({ ...formKabary, occasion: e.target.value })}
                      placeholder="Ex: Fanambadiana"
                      required
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Rôle Mpikabary
                    </label>
                    <input
                      type="text"
                      value={formKabary.speakerRoleMg}
                      onChange={(e) => setFormKabary({ ...formKabary, speakerRoleMg: e.target.value })}
                      placeholder="Ex: Mpikabarin'ny lahy"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Rôle Mpihaino
                    </label>
                    <input
                      type="text"
                      value={formKabary.recipientRoleMg}
                      onChange={(e) => setFormKabary({ ...formKabary, recipientRoleMg: e.target.value })}
                      placeholder="Ex: Havon'ny vavy"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Étapes oratoires */}
                <div className="space-y-2.5 pt-3 border-t border-[var(--card-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      Temps oratoires ({formKabary.steps.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--foreground)] text-[11px] font-semibold hover:bg-[var(--card-hover)] flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Plus size={12} />
                      <span>Ajouter un temps</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formKabary.steps.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-[var(--accent)]">
                            Étape {idx + 1}
                          </span>
                          {formKabary.steps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={s.stepNameMg}
                            onChange={(e) => handleStepChange(idx, 'stepNameMg', e.target.value)}
                            placeholder="Nom étape (malgache)..."
                            required
                            className={inputCls}
                          />
                          <input
                            type="text"
                            value={s.stepNameFr}
                            onChange={(e) => handleStepChange(idx, 'stepNameFr', e.target.value)}
                            placeholder="Nom étape (français)..."
                            required
                            className={inputCls}
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={s.textMg}
                          onChange={(e) => handleStepChange(idx, 'textMg', e.target.value)}
                          placeholder="Formule oratoire en malgache..."
                          required
                          className={inputCls}
                        />

                        <textarea
                          rows={2}
                          value={s.textFr}
                          onChange={(e) => handleStepChange(idx, 'textFr', e.target.value)}
                          placeholder="Traduction française..."
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
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

        {/* Modal Déroulé du Kabary (Déclamation) */}
        {selectedKabary && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 animate-in fade-in duration-150">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-2xl max-w-xl w-full max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                      {selectedKabary.occasion}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {selectedKabary.steps?.length || 0} temps oratoires
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[var(--foreground)] mt-1">
                    {selectedKabary.title}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedKabary(null)}
                  className="p-1 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Étapes du discours */}
              {selectedKabary.steps && selectedKabary.steps.length > 0 && (
                <div className="px-4 py-2 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center gap-1.5 overflow-x-auto">
                  {selectedKabary.steps.map((step, idx) => (
                    <button
                      key={step.id || idx}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                        activeStepIndex === idx
                          ? 'bg-[var(--accent)] text-white shadow-xs'
                          : 'bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] border border-[var(--card-border)]'
                      }`}
                    >
                      {step.stepNumber}. {step.stepNameMg}
                    </button>
                  ))}
                </div>
              )}

              {/* Contenu Déclamé */}
              <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
                {selectedKabary.steps && selectedKabary.steps[activeStepIndex] ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide">
                        {selectedKabary.steps[activeStepIndex].stepNameMg}
                      </h3>
                      <div className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                        {selectedKabary.steps[activeStepIndex].stepNameFr}
                      </div>
                    </div>

                    {selectedKabary.steps[activeStepIndex].explanationFr && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        <strong className="font-semibold">Protocole : </strong>
                        {selectedKabary.steps[activeStepIndex].explanationFr}
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                        Formule oratoire en Malagasy
                      </div>
                      <div className="text-xs font-medium text-[var(--foreground)] leading-relaxed whitespace-pre-line">
                        {selectedKabary.steps[activeStepIndex].textMg}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--card-border)] space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
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

              <div className="px-5 py-3 border-t border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between">
                <button
                  onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
                  disabled={activeStepIndex <= 0}
                  className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--foreground)] hover:bg-[var(--card-hover)] disabled:opacity-40 transition cursor-pointer shadow-xs"
                >
                  &larr; Précédent
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
                  className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--foreground)] hover:bg-[var(--card-hover)] disabled:opacity-40 transition cursor-pointer shadow-xs"
                >
                  Suivant &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de suppression */}
        <ConfirmModal
          isOpen={!!deletingKabary}
          onClose={() => setDeletingKabary(null)}
          onConfirm={handleConfirmDelete}
          title="Supprimer le discours"
          description={`Confirmez-vous la suppression définitive du discours : « ${deletingKabary?.title} » ?`}
          confirmText="Supprimer"
          isLoading={isDeleting}
          variant="danger"
        />
      </div>
    </AdminShell>
  );
}
