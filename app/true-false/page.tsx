'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 text-xs rounded-lg bg-[var(--card)] border border-[var(--card-border)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--text-subtle)] text-[var(--foreground)]';



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
    let isMounted = true;
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (search.trim()) params.set('search', search.trim());
    if (selectedTheme !== 'ALL') params.set('theme', selectedTheme);
    if (selectedDifficulty !== 'ALL') params.set('difficulty', selectedDifficulty);

    fetchApi<{
      items: TrueFalseQuestion[];
      total: number;
      totalPages: number;
    }>(`/admin/true-false?${params.toString()}`)
      .then((res) => {
        if (!isMounted) return;
        setQuestions(res.items || []);
        setTotalCount(res.total || 0);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Impossible de charger les questions';
        toast.error(msg);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, search, selectedTheme, selectedDifficulty, toast]);

  // Helpers Modal
  const openCreate = () => {
    setEditingId(null);
    setForm({
      questionMg: '', questionFr: '', isTrue: true,
      explanationMg: '', explanationFr: '',
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
        toast.success('Question modifiée');
      } else {
        await fetchApi('/admin/true-false', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Question créée');
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
      toast.success('Question supprimée');
      setDeletingId(null);
      void loadQuestions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(msg);
    }
  };

  // Filtrage local VRAI/FAUX
  const displayed = questions.filter(q => {
    if (truthFilter === 'TRUE') return q.isTrue;
    if (truthFilter === 'FALSE') return !q.isTrue;
    return true;
  });

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">Vrai ou Faux</h1>
            <p className="text-xs text-[var(--text-subtle)] mt-0.5">
              {totalCount} affirmation{totalCount !== 1 ? 's' : ''} · Marina sa Diso
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-medium hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouvelle question
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une question, explication, source…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:outline-none focus:border-[var(--accent)] transition text-[var(--foreground)] placeholder:text-[var(--text-subtle)]"
            />
          </div>

          {/* Thème */}
          <select
            value={selectedTheme}
            onChange={e => { setSelectedTheme(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] cursor-pointer"
          >
            <option value="ALL">Tous les thèmes</option>
            {Object.entries(THEMES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Difficulté */}
          <select
            value={selectedDifficulty}
            onChange={e => { setSelectedDifficulty(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:outline-none focus:border-[var(--accent)] text-[var(--foreground)] cursor-pointer"
          >
            <option value="ALL">Toutes difficultés</option>
            {Object.entries(DIFFICULTIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Filtre rapide VRAI / FAUX */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)] mr-1">Valeur :</span>
          {(['ALL', 'TRUE', 'FALSE'] as const).map(v => (
            <button
              key={v}
              onClick={() => setTruthFilter(v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                truthFilter === v
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'border border-[var(--card-border)] text-[var(--text-subtle)] hover:bg-[var(--card)]'
              }`}
            >
              {v === 'TRUE' && <Check className="w-3 h-3" />}
              {v === 'FALSE' && <X className="w-3 h-3" />}
              {v === 'ALL' ? `Toutes (${questions.length})` : v === 'TRUE' ? 'Vrai' : 'Faux'}
            </button>
          ))}
        </div>

        {/* Tableau */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-subtle)]" />
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-subtle)]">
              Aucune affirmation trouvée.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">
                    <th className="py-2.5 px-3 w-20 text-center font-medium">Valeur</th>
                    <th className="py-2.5 px-3 min-w-[320px] font-medium">Affirmation & Explication</th>
                    <th className="py-2.5 px-3 w-36 font-medium">Thème</th>
                    <th className="py-2.5 px-3 w-24 font-medium">Difficulté</th>
                    <th className="py-2.5 px-3 w-20 text-center font-medium">Stats</th>
                    <th className="py-2.5 px-3 w-24 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {displayed.map(q => {
                    const accuracy = q.timesPlayed > 0
                      ? Math.round((q.timesCorrect / q.timesPlayed) * 100)
                      : null;

                    return (
                      <tr key={q.id} className="group hover:bg-[var(--accent)]/30 transition-colors">

                        {/* Valeur VRAI / FAUX */}
                        <td className="py-3 px-3 text-center align-top">
                          {q.isTrue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border border-[var(--card-border)] text-[var(--foreground)]">
                              <Check className="w-3 h-3" />
                              Vrai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border border-[var(--card-border)] text-[var(--text-subtle)]">
                              <X className="w-3 h-3" />
                              Faux
                            </span>
                          )}
                        </td>

                        {/* Question & Explication */}
                        <td className="py-3 px-3 align-top space-y-1.5">
                          <p className="font-medium text-[var(--foreground)] leading-snug">{q.questionMg}</p>
                          {q.questionFr && q.questionFr !== q.questionMg && (
                            <p className="text-[11px] text-[var(--text-subtle)] italic">{q.questionFr}</p>
                          )}
                          <p className="text-[11px] text-[var(--text-subtle)] bg-[var(--background)] px-2 py-1.5 rounded border border-[var(--card-border)] leading-relaxed">
                            {q.explanationMg}
                          </p>
                          {q.source && (
                            <p className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {q.source}
                            </p>
                          )}
                        </td>

                        {/* Thème */}
                        <td className="py-3 px-3 align-top">
                          <span className="text-[11px] text-[var(--text-subtle)]">
                            {THEMES[q.theme] || q.theme}
                          </span>
                        </td>

                        {/* Difficulté */}
                        <td className="py-3 px-3 align-top">
                          <span className="text-[11px] text-[var(--text-subtle)]">
                            {DIFFICULTIES[q.difficulty] || q.difficulty}
                          </span>
                        </td>

                        {/* Stats */}
                        <td className="py-3 px-3 text-center align-top">
                          <p className="text-xs font-medium text-[var(--foreground)]">{q.timesPlayed}</p>
                          {accuracy !== null && (
                            <p className="text-[10px] text-[var(--text-subtle)]">{accuracy}%</p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right align-top">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => setPreviewQ(q)}
                              className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--text-subtle)] transition"
                              title="Aperçu"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(q)}
                              className="p-1.5 rounded hover:bg-[var(--accent)] text-[var(--text-subtle)] transition"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(q.id)}
                              className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 text-[var(--text-subtle)] transition"
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
            <div className="px-4 py-2.5 border-t border-[var(--card-border)] flex items-center justify-between text-[11px] text-[var(--text-subtle)]">
              <span>Page <strong className="text-[var(--foreground)]">{page}</strong> / {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--card-border)] hover:bg-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--card-border)] hover:bg-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12 z-50">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl w-full max-w-xl max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] flex flex-col shadow-xl animate-in fade-in slide-in-from-top-3 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)] shrink-0">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {editingId ? 'Modifier la question' : 'Nouvelle affirmation'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-[var(--accent)] transition text-[var(--text-subtle)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* VRAI / FAUX */}
              <Field label="Valeur de vérité" required>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isTrue: true })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                      form.isTrue
                        ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                        : 'border-[var(--card-border)] text-[var(--text-subtle)] hover:bg-[var(--accent)]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    VRAI (Marina)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isTrue: false })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                      !form.isTrue
                        ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                        : 'border-[var(--card-border)] text-[var(--text-subtle)] hover:bg-[var(--accent)]'
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
                    onChange={e => setForm({ ...form, theme: e.target.value })}
                    className={inputCls}
                  >
                    {Object.entries(THEMES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Difficulté" required>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm({ ...form, difficulty: e.target.value })}
                    className={inputCls}
                  >
                    {Object.entries(DIFFICULTIES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Question MG */}
              <Field label="Affirmation en Malgache" required>
                <textarea
                  rows={2} required
                  placeholder="ex: Ny fady no fototry ny fandriampahalemana teo amin'ny Ntaolo..."
                  value={form.questionMg}
                  onChange={e => setForm({ ...form, questionMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Question FR */}
              <Field label="Traduction française">
                <textarea
                  rows={2}
                  placeholder="ex: Les tabous (fady) étaient le pilier de la paix sociale..."
                  value={form.questionFr}
                  onChange={e => setForm({ ...form, questionFr: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Explication MG */}
              <Field label="Explication (Malgache)" required>
                <textarea
                  rows={2} required
                  placeholder="Explication concise pourquoi c'est vrai ou faux..."
                  value={form.explanationMg}
                  onChange={e => setForm({ ...form, explanationMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Explication FR */}
              <Field label="Explication (Français)">
                <textarea
                  rows={2}
                  placeholder="Explication détaillée en français..."
                  value={form.explanationFr}
                  onChange={e => setForm({ ...form, explanationFr: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Source */}
              <Field label="Source / Référence">
                <input
                  type="text"
                  placeholder="ex: Firaketana Malagasy, Traditions orales..."
                  value={form.source}
                  onChange={e => setForm({ ...form, source: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs rounded-lg border border-[var(--card-border)] hover:bg-[var(--accent)] transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Enregistrement…
                    </>
                  ) : editingId ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Aperçu ───────────────────────────────────────────────────── */}
      {previewQ && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12 z-50">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl w-full max-w-sm max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] shadow-xl animate-in fade-in slide-in-from-top-3 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Aperçu</h3>
              <button
                onClick={() => setPreviewQ(null)}
                className="p-1 rounded hover:bg-[var(--accent)] transition text-[var(--text-subtle)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Méta */}
              <div className="flex items-center justify-between text-[10px] text-[var(--text-subtle)]">
                <span>{THEMES[previewQ.theme] || previewQ.theme}</span>
                <span>{DIFFICULTIES[previewQ.difficulty] || previewQ.difficulty}</span>
              </div>

              {/* Question */}
              <div className="p-3.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-center space-y-1">
                <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                  « {previewQ.questionMg} »
                </p>
                {previewQ.questionFr && (
                  <p className="text-xs text-[var(--text-subtle)] italic">
                    « {previewQ.questionFr} »
                  </p>
                )}
              </div>

              {/* Badge vérité */}
              <div className="text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-[var(--card-border)] ${
                  previewQ.isTrue
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--text-subtle)]'
                }`}>
                  {previewQ.isTrue
                    ? <><CheckCircle2 className="w-4 h-4" /> MARINA (VRAI)</>
                    : <><XCircle className="w-4 h-4" /> DISO (FAUX)</>}
                </span>
              </div>

              {/* Explication */}
              <div className="p-3 rounded-lg border border-[var(--card-border)] space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">Explication</p>
                <p className="text-[11.5px] text-[var(--foreground)] leading-relaxed">{previewQ.explanationMg}</p>
                {previewQ.explanationFr && (
                  <p className="text-[11px] text-[var(--text-subtle)] italic pt-1 border-t border-[var(--card-border)]">
                    {previewQ.explanationFr}
                  </p>
                )}
              </div>

              {previewQ.source && (
                <p className="text-[10px] text-[var(--text-subtle)] text-center">
                  Source : {previewQ.source}
                </p>
              )}

              <div className="flex justify-end pt-1 border-t border-[var(--card-border)]">
                <button
                  onClick={() => setPreviewQ(null)}
                  className="px-4 py-2 text-xs rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition"
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
        title="Supprimer la question"
        description="Êtes-vous sûr de vouloir supprimer cette affirmation définitivement ?"
        confirmText="Supprimer"
        variant="danger"
      />
    </AdminShell>
  );
}
