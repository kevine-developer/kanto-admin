'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal, Field } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  BookOpen,
  Eye,
  Check,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrueFalseQuestion {
  id: string;
  questionMg: string;
  questionFr?: string | null;
  isTrue: boolean;
  explanationMg: string;
  explanationFr?: string | null;
  theme: string;
  difficulty: string;
  source?: string | null;
  status: string;
  timesPlayed: number;
  timesCorrect: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const THEMES: Record<string, string> = {
  GEN: 'Général',
  CULT: 'Culture & Coutumes',
  GEO: 'Géographie & Nature',
  HIST: 'Histoire & Société',
  LITT: 'Littérature & Arts',
  PROV: 'Proverbes & Sagesse',
};

const DIFFICULTIES: Record<string, string> = {
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Difficile',
  EXPERT: 'Expert',
};

const inputCls =
  'w-full px-3 py-2 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--text-subtle)] text-[var(--foreground)]';

// ─── Page principale ──────────────────────────────────────────────────────────

export default function TrueFalseAdminPage() {
  const { toast } = useToast();

  const [questions, setQuestions] = useState<TrueFalseQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [truthFilter, setTruthFilter] = useState<'ALL' | 'TRUE' | 'FALSE'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewQ, setPreviewQ] = useState<TrueFalseQuestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    questionMg: '',
    questionFr: '',
    isTrue: true,
    explanationMg: '',
    explanationFr: '',
    theme: 'GEN',
    difficulty: 'EASY',
    source: '',
  });

  // Chargement
  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search.trim()) params.set('search', search.trim());
      if (selectedTheme !== 'ALL') params.set('theme', selectedTheme);
      if (selectedDifficulty !== 'ALL') params.set('difficulty', selectedDifficulty);

      const res = await fetchApi<{
        items: TrueFalseQuestion[];
        total: number;
        totalPages: number;
      }>(`/admin/true-false?${params.toString()}`);

      setQuestions(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger les questions';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedTheme, selectedDifficulty, toast]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  // Helpers Modal
  const openCreate = () => {
    setEditingId(null);
    setForm({
      questionMg: '',
      questionFr: '',
      isTrue: true,
      explanationMg: '',
      explanationFr: '',
      theme: selectedTheme !== 'ALL' ? selectedTheme : 'GEN',
      difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : 'EASY',
      source: '',
    });
    setShowModal(true);
  };

  const openEdit = (q: TrueFalseQuestion) => {
    setEditingId(q.id);
    setForm({
      questionMg: q.questionMg,
      questionFr: q.questionFr || '',
      isTrue: q.isTrue,
      explanationMg: q.explanationMg,
      explanationFr: q.explanationFr || '',
      theme: q.theme,
      difficulty: q.difficulty,
      source: q.source || '',
    });
    setShowModal(true);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.questionMg.trim() || !form.explanationMg.trim()) {
      toast.error('La question et l\'explication en malgache sont obligatoires');
      return;
    }
    try {
      setIsSubmitting(true);
      if (editingId) {
        await fetchApi(`/admin/true-false/${editingId}`, { method: 'PATCH', body: JSON.stringify(form) });
        toast.success('Affirmation modifiée');
      } else {
        await fetchApi('/admin/true-false', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Affirmation créée');
      }
      setShowModal(false);
      void loadQuestions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await fetchApi(`/admin/true-false/${deletingId}`, { method: 'DELETE' });
      toast.success('Affirmation supprimée');
      setDeletingId(null);
      void loadQuestions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(msg);
    }
  };

  // Filtrage local VRAI/FAUX
  const displayed = questions.filter((q) => {
    if (truthFilter === 'TRUE') return q.isTrue;
    if (truthFilter === 'FALSE') return !q.isTrue;
    return true;
  });

  return (
    <AdminShell>
      <div className="w-full space-y-4 max-w-6xl mx-auto pb-12">
        {/* En-tête standardisé */}
        <PageHeader
          title="Vrai ou Faux"
          description="Affirmations bilingues malgaches · Marina sa Diso"
          icon={CheckCheck}
          badge={
            <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs">
              {totalCount} affirmation{totalCount !== 1 ? 's' : ''}
            </span>
          }
          actions={
            <button
              onClick={() => void loadQuestions()}
              disabled={isLoading}
              className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Actualiser"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
          primaryAction={{
            label: 'Nouvelle affirmation',
            icon: <Plus className="w-3.5 h-3.5" />,
            onClick: openCreate,
          }}
        />

        {/* Barre d'outils compacte (Recherche + Filtres) */}
        <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une question, explication, source…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] focus:outline-none focus:border-[var(--accent)] transition text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtre Thème */}
            <select
              value={selectedTheme}
              onChange={(e) => {
                setSelectedTheme(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] cursor-pointer"
            >
              <option value="ALL">Tous les thèmes</option>
              {Object.entries(THEMES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            {/* Filtre Difficulté */}
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] cursor-pointer"
            >
              <option value="ALL">Toutes difficultés</option>
              {Object.entries(DIFFICULTIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            {/* Filtre Valeur : Toutes / Vrai / Faux */}
            <div className="flex items-center p-0.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)]">
              {(['ALL', 'TRUE', 'FALSE'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTruthFilter(v)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                    truthFilter === v
                      ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {v === 'TRUE' && <Check className="w-3 h-3 text-emerald-500" />}
                  {v === 'FALSE' && <X className="w-3 h-3 text-rose-500" />}
                  <span>{v === 'ALL' ? 'Toutes' : v === 'TRUE' ? 'Vrai' : 'Faux'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tableau épuré */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              <span className="text-xs text-[var(--text-muted)]">Chargement des affirmations...</span>
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Aucune affirmation ne correspond à votre recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)] text-[11px] font-semibold text-[var(--text-muted)]">
                    <th className="py-2.5 px-3.5 w-24 text-center">Valeur</th>
                    <th className="py-2.5 px-3.5 min-w-[340px]">Affirmation & Explication</th>
                    <th className="py-2.5 px-3.5 w-36">Thème</th>
                    <th className="py-2.5 px-3.5 w-24">Difficulté</th>
                    <th className="py-2.5 px-3.5 w-24 text-center">Stats</th>
                    <th className="py-2.5 px-3.5 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {displayed.map((q) => {
                    const accuracy =
                      q.timesPlayed > 0
                        ? Math.round((q.timesCorrect / q.timesPlayed) * 100)
                        : null;

                    return (
                      <tr key={q.id} className="hover:bg-[var(--card-hover)] transition-colors group">
                        {/* Valeur VRAI / FAUX */}
                        <td className="py-3 px-3.5 text-center align-top">
                          {q.isTrue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              Vrai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <X className="w-3 h-3" />
                              Faux
                            </span>
                          )}
                        </td>

                        {/* Affirmation & Explication */}
                        <td className="py-3 px-3.5 align-top space-y-1">
                          <p className="font-semibold text-[var(--foreground)] leading-snug">
                            {q.questionMg}
                          </p>
                          {q.questionFr && q.questionFr !== q.questionMg && (
                            <p className="text-[11px] text-[var(--text-muted)] italic">
                              {q.questionFr}
                            </p>
                          )}
                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed pt-0.5">
                            {q.explanationMg}
                          </p>
                          {q.source && (
                            <p className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1 pt-0.5 font-medium">
                              <BookOpen className="w-3 h-3 text-[var(--accent)]" />
                              {q.source}
                            </p>
                          )}
                        </td>

                        {/* Thème */}
                        <td className="py-3 px-3.5 align-top">
                          <span className="text-[11px] font-medium text-[var(--foreground)]">
                            {THEMES[q.theme] || q.theme}
                          </span>
                        </td>

                        {/* Difficulté */}
                        <td className="py-3 px-3.5 align-top">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)]">
                            {DIFFICULTIES[q.difficulty] || q.difficulty}
                          </span>
                        </td>

                        {/* Stats */}
                        <td className="py-3 px-3.5 text-center align-top">
                          <span className="font-mono font-semibold text-[var(--foreground)] text-xs">
                            {q.timesPlayed}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block">parties</span>
                          {accuracy !== null && (
                            <span
                              className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
                                accuracy >= 70
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : accuracy >= 40
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {accuracy}%
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right align-top">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPreviewQ(q)}
                              className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                              title="Aperçu"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(q)}
                              className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(q.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-2.5 border-t border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>
                Page <strong className="text-[var(--foreground)] font-mono">{page}</strong> sur{' '}
                <span className="font-mono">{totalPages}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
                >
                  Suivant
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal Créer / Modifier ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 z-50 animate-in fade-in duration-150">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-xl max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)] shrink-0">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {editingId ? "Modifier l'affirmation" : 'Nouvelle affirmation'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--card-hover)] transition text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* VRAI / FAUX */}
              <Field label="Valeur de vérité" required>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isTrue: true })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      form.isTrue
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    VRAI (Marina)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isTrue: false })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      !form.isTrue
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    FAUX (Diso)
                  </button>
                </div>
              </Field>

              {/* Thème & Difficulté */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Thème" required>
                  <select
                    value={form.theme}
                    onChange={(e) => setForm({ ...form, theme: e.target.value })}
                    className={inputCls}
                  >
                    {Object.entries(THEMES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Difficulté" required>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className={inputCls}
                  >
                    {Object.entries(DIFFICULTIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Question MG */}
              <Field label="Affirmation en Malgache" required>
                <textarea
                  rows={2}
                  required
                  placeholder="ex: Ny fady no fototry ny fandriampahalemana teo amin'ny Ntaolo..."
                  value={form.questionMg}
                  onChange={(e) => setForm({ ...form, questionMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Question FR */}
              <Field label="Traduction française">
                <textarea
                  rows={2}
                  placeholder="ex: Les tabous (fady) étaient le pilier de la paix sociale..."
                  value={form.questionFr}
                  onChange={(e) => setForm({ ...form, questionFr: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Explication MG */}
              <Field label="Explication (Malgache)" required>
                <textarea
                  rows={2}
                  required
                  placeholder="Explication concise pourquoi c'est vrai ou faux..."
                  value={form.explanationMg}
                  onChange={(e) => setForm({ ...form, explanationMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Explication FR */}
              <Field label="Explication (Français)">
                <textarea
                  rows={2}
                  placeholder="Explication détaillée en français..."
                  value={form.explanationFr}
                  onChange={(e) => setForm({ ...form, explanationFr: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Source */}
              <Field label="Source / Référence">
                <input
                  type="text"
                  placeholder="ex: Firaketana Malagasy, Traditions orales..."
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white font-semibold hover:opacity-90 disabled:opacity-50 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Enregistrement…
                    </>
                  ) : editingId ? (
                    'Modifier'
                  ) : (
                    'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Aperçu ───────────────────────────────────────────────────── */}
      {previewQ && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 z-50 animate-in fade-in duration-150">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-sm max-h-[calc(100vh-4rem)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Aperçu en jeu</h3>
              <button
                onClick={() => setPreviewQ(null)}
                className="p-1 rounded-lg hover:bg-[var(--card-hover)] transition text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Méta */}
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>{THEMES[previewQ.theme] || previewQ.theme}</span>
                <span className="font-medium text-[var(--foreground)]">
                  {DIFFICULTIES[previewQ.difficulty] || previewQ.difficulty}
                </span>
              </div>

              {/* Question */}
              <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] text-center space-y-1.5">
                <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                  « {previewQ.questionMg} »
                </p>
                {previewQ.questionFr && (
                  <p className="text-xs text-[var(--text-muted)] italic">
                    « {previewQ.questionFr} »
                  </p>
                )}
              </div>

              {/* Badge vérité */}
              <div className="text-center">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-xs ${
                    previewQ.isTrue
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {previewQ.isTrue ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> MARINA (VRAI)
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> DISO (FAUX)
                    </>
                  )}
                </span>
              </div>

              {/* Explication */}
              <div className="p-3.5 rounded-xl border border-[var(--card-border)] space-y-1.5 bg-[var(--card)]">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Explication
                </p>
                <p className="text-xs text-[var(--foreground)] leading-relaxed">
                  {previewQ.explanationMg}
                </p>
                {previewQ.explanationFr && (
                  <p className="text-[11px] text-[var(--text-muted)] italic pt-1.5 border-t border-[var(--card-border)]">
                    {previewQ.explanationFr}
                  </p>
                )}
              </div>

              {previewQ.source && (
                <p className="text-[10px] text-[var(--text-muted)] text-center">
                  Source : {previewQ.source}
                </p>
              )}

              <div className="flex justify-end pt-2 border-t border-[var(--card-border)]">
                <button
                  onClick={() => setPreviewQ(null)}
                  className="px-4 py-1.5 text-xs rounded-lg bg-[var(--card-hover)] hover:bg-[var(--card-border)] text-[var(--foreground)] font-medium transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Suppression ────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Supprimer l'affirmation"
        description="Êtes-vous sûr de vouloir supprimer cette affirmation définitivement ?"
        confirmText="Supprimer"
        variant="danger"
      />
    </AdminShell>
  );
}
