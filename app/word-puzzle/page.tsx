'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { ConfirmModal, LoadingState } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  Eye,
  X,
  Shuffle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordPuzzleSentence {
  id: string;
  orderIndex: number;
  malagasy: string;
  french: string;
  hint?: string | null;
  explanationMg?: string | null;
  explanationFr?: string | null;
  status: string;
}

interface WordPuzzleLevel {
  id: string;
  levelNumber: number;
  titleMg: string;
  titleFr?: string | null;
  description?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  passThreshold: number;
  totalSentences: number;
  status: string;
  sentences?: WordPuzzleSentence[];
  _count?: { sentences: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toRoman = (num: number): string => {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let res = '';
  for (const [v, r] of map) {
    while (num >= v) { res += r; num -= v; }
  }
  return res || 'I';
};

const getWords = (sentence: string): string[] => {
  if (!sentence) return [];
  return sentence.replace(/[.,!?;:]/g, '').trim().split(/\s+/).filter(Boolean);
};

const DIFF_LABEL: Record<string, string> = {
  EASY: 'Facile', MEDIUM: 'Moyen', HARD: 'Difficile', EXPERT: 'Expert',
};

// ─── Composant Field ──────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-[var(--input-bg,var(--card))] border border-[var(--card-border)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--text-subtle)]';

// ─── Page principale ──────────────────────────────────────────────────────────

export default function WordPuzzleAdminPage() {
  const { toast } = useToast();

  // Données
  const [levels, setLevels] = useState<WordPuzzleLevel[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<WordPuzzleLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelLoading, setIsPanelLoading] = useState(false);

  // Modal Niveau
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<WordPuzzleLevel | null>(null);
  const [levelForm, setLevelForm] = useState({
    levelNumber: 1,
    titleMg: '',
    titleFr: '',
    description: '',
    difficulty: 'EASY' as WordPuzzleLevel['difficulty'],
    passThreshold: 5,
    totalSentences: 10,
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
  });

  // Modal Phrase
  const [showSentenceModal, setShowSentenceModal] = useState(false);
  const [editingSentence, setEditingSentence] = useState<WordPuzzleSentence | null>(null);
  const [sentenceForm, setSentenceForm] = useState({
    orderIndex: 1,
    malagasy: '',
    french: '',
    hint: '',
    explanationMg: '',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
  });

  // Confirmation suppression
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean; type: 'level' | 'sentence'; id: string; name: string;
  }>({ isOpen: false, type: 'level', id: '', name: '' });

  // Chargement des niveaux
  const loadLevels = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi<WordPuzzleLevel[]>('/admin/word-puzzle/levels');
      setLevels(data);
      if (data.length > 0 && (!selectedLevelId || !data.some((l) => l.id === selectedLevelId))) {
        setSelectedLevelId(data[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevelId, toast]);

  const loadLevelDetail = useCallback(async (id: string) => {
    try {
      setIsPanelLoading(true);
      const data = await fetchApi<WordPuzzleLevel>(`/admin/word-puzzle/levels/${id}`);
      setSelectedLevel(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
    } finally {
      setIsPanelLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadLevels();
  }, [loadLevels]);

  useEffect(() => {
    if (selectedLevelId) {
      void loadLevelDetail(selectedLevelId);
    }
  }, [selectedLevelId, loadLevelDetail]);

  // Sauvegarder niveau
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        await fetchApi(`/admin/word-puzzle/levels/${editingLevel.id}`, {
          method: 'PATCH',
          body: JSON.stringify(levelForm),
        });
        toast.success('Niveau mis à jour');
      } else {
        await fetchApi('/admin/word-puzzle/levels', {
          method: 'POST',
          body: JSON.stringify(levelForm),
        });
        toast.success('Niveau créé');
      }
      setShowLevelModal(false);
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
    }
  };

  // Déplacer une phrase
  const handleMove = async (sentenceId: string, direction: 'up' | 'down') => {
    try {
      await fetchApi(`/admin/word-puzzle/sentences/${sentenceId}/move`, {
        method: 'POST',
        body: JSON.stringify({ direction }),
      });
      if (selectedLevelId) void loadLevelDetail(selectedLevelId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
    }
  };

  // Mélanger aléatoirement les phrases (Fisher-Yates → reorderSentences)
  const [isShuffling, setIsShuffling] = useState(false);
  const handleShuffle = async () => {
    if (!selectedLevel?.sentences || selectedLevel.sentences.length < 2) return;
    try {
      setIsShuffling(true);
      const ids = selectedLevel.sentences.map((s) => s.id);
      // Fisher-Yates
      const shuffled = [...ids];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      await fetchApi(`/admin/word-puzzle/levels/${selectedLevel.id}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ sentenceIds: shuffled }),
      });
      toast.success('Phrases mélangées');
      if (selectedLevelId) void loadLevelDetail(selectedLevelId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du mélange';
      toast.error(msg);
    } finally {
      setIsShuffling(false);
    }
  };

  // Sauvegarder phrase
  const handleSaveSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevelId) return;
    const words = getWords(sentenceForm.malagasy);
    if (words.length < 2) {
      toast.error('La phrase doit comporter au moins 2 mots');
      return;
    }
    try {
      if (editingSentence) {
        await fetchApi(`/admin/word-puzzle/sentences/${editingSentence.id}`, {
          method: 'PATCH',
          body: JSON.stringify(sentenceForm),
        });
        toast.success('Phrase mise à jour');
      } else {
        await fetchApi('/admin/word-puzzle/sentences', {
          method: 'POST',
          body: JSON.stringify({ ...sentenceForm, levelId: selectedLevelId }),
        });
        toast.success('Phrase ajoutée');
      }
      setShowSentenceModal(false);
      void loadLevelDetail(selectedLevelId);
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
    }
  };

  // Supprimer
  const handleDelete = async () => {
    try {
      if (deleteTarget.type === 'level') {
        await fetchApi(`/admin/word-puzzle/levels/${deleteTarget.id}`, { method: 'DELETE' });
        toast.success('Niveau supprimé');
        setSelectedLevelId(null);
        setSelectedLevel(null);
      } else {
        await fetchApi(`/admin/word-puzzle/sentences/${deleteTarget.id}`, { method: 'DELETE' });
        toast.success('Phrase supprimée');
        if (selectedLevelId) void loadLevelDetail(selectedLevelId);
      }
      setDeleteTarget((d) => ({ ...d, isOpen: false }));
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
    }
  };

  const previewWords = useMemo(() => getWords(sentenceForm.malagasy), [sentenceForm.malagasy]);
  const sentenceCount = selectedLevel?.sentences?.length ?? 0;

  // ── Helpers Modal ──────────────────────────────────────────────────────────

  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelForm({
      levelNumber: levels.length + 1, titleMg: '', titleFr: '',
      description: '', difficulty: 'EASY', passThreshold: 5, totalSentences: 10, status: 'PUBLISHED',
    });
    setShowLevelModal(true);
  };

  const openEditLevel = (lvl: WordPuzzleLevel) => {
    setEditingLevel(lvl);
    setLevelForm({
      levelNumber: lvl.levelNumber, titleMg: lvl.titleMg, titleFr: lvl.titleFr || '',
      description: lvl.description || '', difficulty: lvl.difficulty,
      passThreshold: lvl.passThreshold, totalSentences: lvl.totalSentences,
      status: lvl.status as 'PUBLISHED' | 'DRAFT',
    });
    setShowLevelModal(true);
  };

  const openAddSentence = () => {
    setEditingSentence(null);
    setSentenceForm({
      orderIndex: sentenceCount + 1, malagasy: '', french: '', hint: '', explanationMg: '', status: 'PUBLISHED',
    });
    setShowSentenceModal(true);
  };

  const openEditSentence = (st: WordPuzzleSentence) => {
    setEditingSentence(st);
    setSentenceForm({
      orderIndex: st.orderIndex, malagasy: st.malagasy, french: st.french,
      hint: st.hint || '', explanationMg: st.explanationMg || '', status: st.status as 'PUBLISHED' | 'DRAFT',
    });
    setShowSentenceModal(true);
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      {/* En-tête page */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Remise en Ordre</h1>
          <p className="text-xs text-[var(--text-subtle)] mt-0.5">
            {levels.length} niveau{levels.length !== 1 ? 'x' : ''} · Banque de phrases par niveau · 10 phrases tirées au sort par partie
          </p>
        </div>
        <button
          onClick={openCreateLevel}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-medium hover:opacity-90 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau niveau
        </button>
      </div>

      {/* Layout deux colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-start">

        {/* ── Colonne gauche : liste des niveaux ── */}
        <div className="space-y-1.5">
          {isLoading ? (
            <LoadingState message="Chargement..." />
          ) : levels.length === 0 ? (
            <p className="text-xs text-[var(--text-subtle)] text-center py-8">
              Aucun niveau. Créez le premier.
            </p>
          ) : (
            levels.map((lvl) => {
              const count = lvl._count?.sentences ?? 0;
              const isSelected = lvl.id === selectedLevelId;
              const isReady = count >= 10;

              return (
                <div
                  key={lvl.id}
                  onClick={() => setSelectedLevelId(lvl.id)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all select-none ${
                    isSelected
                      ? 'bg-[var(--accent)] text-[var(--foreground)]'
                      : 'hover:bg-[var(--card)] text-[var(--text-subtle)]'
                  }`}
                >
                  {/* Badge niveau */}
                  <span className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-black border transition ${
                    isSelected
                      ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
                      : 'bg-[var(--card)] border-[var(--card-border)] text-[var(--foreground)]'
                  }`}>
                    {toRoman(lvl.levelNumber)}
                  </span>

                  {/* Titre */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'}`}>
                      {lvl.titleMg}
                    </p>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5 flex items-center gap-1.5">
                      <span>{DIFF_LABEL[lvl.difficulty]}</span>
                      <span>·</span>
                      <span className={isReady ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                        {count} phrase{count !== 1 ? 's' : ''} {count >= 10 ? '✓' : '(min 10)'}
                      </span>
                    </p>
                  </div>

                  {/* Actions (visible au hover ou sélection) */}
                  <div
                    className={`flex items-center gap-0.5 transition ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEditLevel(lvl)}
                      className="p-1 rounded hover:bg-[var(--card-border)] transition"
                      title="Modifier"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({
                        isOpen: true, type: 'level', id: lvl.id,
                        name: `Niveau ${toRoman(lvl.levelNumber)} — ${lvl.titleMg}`,
                      })}
                      className="p-1 rounded hover:bg-red-500/10 hover:text-red-500 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Colonne droite : détail du niveau ── */}
        {selectedLevel ? (
          <div className="space-y-4">
            {/* En-tête du panel */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                    Niveau {toRoman(selectedLevel.levelNumber)}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    sentenceCount >= 10
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {sentenceCount} phrase{sentenceCount !== 1 ? 's' : ''} {sentenceCount >= 10 ? '(10 tirées au sort / partie)' : '(min 10 recommandé)'}
                  </span>
                </div>
                <h2 className="text-sm font-semibold mt-0.5 text-[var(--foreground)]">
                  {selectedLevel.titleMg}
                  {selectedLevel.titleFr && (
                    <span className="font-normal text-[var(--text-subtle)] ml-1.5">· {selectedLevel.titleFr}</span>
                  )}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={openAddSentence}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-[11px] font-medium hover:bg-[var(--card)] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une phrase
                </button>

                {/* Bouton Mélanger — visible dès qu'il y a ≥ 2 phrases */}
                {sentenceCount >= 2 && (
                  <button
                    onClick={handleShuffle}
                    disabled={isShuffling}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-[11px] font-medium hover:bg-[var(--card)] transition disabled:opacity-50"
                    title="Mélanger l'ordre des phrases aléatoirement"
                  >
                    {isShuffling
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Shuffle className="w-3.5 h-3.5" />}
                    Mélanger
                  </button>
                )}
              </div>
            </div>

            {/* Avertissement quota incomplet */}
            {sentenceCount < 10 && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Ce niveau compte <strong>{sentenceCount} phrase{sentenceCount !== 1 ? 's' : ''}</strong>. Il est conseillé d&apos;avoir au moins 10 phrases pour que le joueur bénéficie d&apos;une session complète de 10 phrases tirées au sort.
                </span>
              </div>
            )}

            {/* Liste des phrases */}
            {isPanelLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-subtle)]" />
              </div>
            ) : sentenceCount === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--text-subtle)]">
                Aucune phrase. Cliquez sur &quot;Ajouter une phrase&quot;.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedLevel.sentences?.map((st, idx) => {
                  const words = getWords(st.malagasy);
                  const isFirst = idx === 0;
                  const isLast = idx === (selectedLevel.sentences?.length ?? 0) - 1;

                  return (
                    <div
                      key={st.id}
                      className="group flex gap-3 p-3.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)] transition"
                    >
                      {/* Contrôle d'ordre */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                        <button
                          disabled={isFirst}
                          onClick={() => handleMove(st.id, 'up')}
                          className={`p-0.5 rounded transition ${isFirst ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[var(--accent)] text-[var(--text-subtle)]'}`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-black text-[var(--text-subtle)] w-5 text-center leading-none py-1">
                          {st.orderIndex}
                        </span>
                        <button
                          disabled={isLast}
                          onClick={() => handleMove(st.id, 'down')}
                          className={`p-0.5 rounded transition ${isLast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[var(--accent)] text-[var(--text-subtle)]'}`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)] leading-snug">{st.malagasy}</p>
                          <p className="text-xs text-[var(--text-subtle)] mt-0.5">{st.french}</p>
                        </div>

                        {/* Aperçu tuiles */}
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-subtle)] mr-1">
                            <Eye className="w-3 h-3" />
                          </span>
                          {words.map((w, wIdx) => (
                            <span
                              key={wIdx}
                              className="px-2 py-0.5 rounded text-[11px] font-medium border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
                            >
                              {w}
                            </span>
                          ))}
                        </div>

                        {/* Indice */}
                        {st.hint && (
                          <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--text-subtle)] font-medium">
                            Indice : {st.hint}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEditSentence(st)}
                          className="p-1.5 rounded hover:bg-[var(--accent)] transition text-[var(--text-subtle)]"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({
                            isOpen: true, type: 'sentence', id: st.id,
                            name: `Phrase #${st.orderIndex}`,
                          })}
                          className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 transition text-[var(--text-subtle)]"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : !isLoading ? (
          <div className="flex items-center justify-center py-16 text-xs text-[var(--text-subtle)]">
            Sélectionnez un niveau pour voir ses phrases.
          </div>
        ) : null}
      </div>

      {/* ─── Modal Niveau ─────────────────────────────────────────────────────── */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)]">
              <h3 className="text-sm font-semibold">
                {editingLevel ? 'Modifier le niveau' : 'Nouveau niveau'}
              </h3>
              <button onClick={() => setShowLevelModal(false)} className="p-1 rounded hover:bg-[var(--accent)] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLevel} className="p-5 space-y-4">
              <Field label="Numéro du niveau" required>
                <input
                  type="number" min={1} required
                  value={levelForm.levelNumber}
                  onChange={e => setLevelForm({ ...levelForm, levelNumber: parseInt(e.target.value) || 1 })}
                  className={inputCls}
                />
                <p className="text-[10px] text-[var(--text-subtle)] mt-1">
                  Affiché comme : <strong>NIVEAU {toRoman(levelForm.levelNumber)}</strong>
                </p>
              </Field>

              <Field label="Titre malgache" required>
                <input
                  type="text" required placeholder="ex: Firaisankina sy Fihavanana"
                  value={levelForm.titleMg}
                  onChange={e => setLevelForm({ ...levelForm, titleMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Titre français">
                <input
                  type="text" placeholder="ex: Solidarité et Harmonie"
                  value={levelForm.titleFr}
                  onChange={e => setLevelForm({ ...levelForm, titleFr: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Difficulté">
                  <select
                    value={levelForm.difficulty}
                    onChange={(e) =>
                      setLevelForm({
                        ...levelForm,
                        difficulty: e.target.value as WordPuzzleLevel['difficulty'],
                      })
                    }
                    className={inputCls}
                  >
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </Field>

                <Field label="Seuil (sur 10)">
                  <input
                    type="number" min={1} max={10}
                    value={levelForm.passThreshold}
                    onChange={e => setLevelForm({ ...levelForm, passThreshold: parseInt(e.target.value) || 5 })}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLevelModal(false)}
                  className="px-4 py-2 text-xs rounded-lg border border-[var(--card-border)] hover:bg-[var(--accent)] transition">
                  Annuler
                </button>
                <button type="submit"
                  className="px-4 py-2 text-xs rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Phrase ─────────────────────────────────────────────────────── */}
      {showSentenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)] sticky top-0 bg-[var(--card)]">
              <h3 className="text-sm font-semibold">
                {editingSentence ? 'Modifier la phrase' : 'Ajouter une phrase'}
              </h3>
              <button onClick={() => setShowSentenceModal(false)} className="p-1 rounded hover:bg-[var(--accent)] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSentence} className="p-5 space-y-4">
              <Field label="Phrase malgache" required>
                <textarea
                  rows={2} required placeholder="ex: Izay mitambatra vato ary izay misaraka fasika"
                  value={sentenceForm.malagasy}
                  onChange={e => setSentenceForm({ ...sentenceForm, malagasy: e.target.value })}
                  className={inputCls}
                />

                {/* Aperçu tuiles */}
                <div className="mt-2 px-3 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-subtle)] font-medium">Tuiles du joueur</span>
                    <span className={`text-[10px] font-bold ${previewWords.length >= 2 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {previewWords.length} mot{previewWords.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {previewWords.length < 2 ? (
                    <p className="text-[11px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      Au moins 2 mots requis
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {previewWords.map((w, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[11px] border border-[var(--card-border)] font-medium">
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Traduction française" required>
                <textarea
                  rows={2} required placeholder="ex: L'union fait la force"
                  value={sentenceForm.french}
                  onChange={e => setSentenceForm({ ...sentenceForm, french: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Indice (optionnel)">
                <input
                  type="text" placeholder="ex: mitambatra"
                  value={sentenceForm.hint}
                  onChange={e => setSentenceForm({ ...sentenceForm, hint: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Explication culturelle (optionnel)">
                <textarea
                  rows={2} placeholder="ex: Mampiseho fa ny firaisan-kina no herin'ny fiaraha-monina."
                  value={sentenceForm.explanationMg}
                  onChange={e => setSentenceForm({ ...sentenceForm, explanationMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSentenceModal(false)}
                  className="px-4 py-2 text-xs rounded-lg border border-[var(--card-border)] hover:bg-[var(--accent)] transition">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={previewWords.length < 2}
                  className={`px-4 py-2 text-xs rounded-lg font-medium transition ${
                    previewWords.length >= 2
                      ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                      : 'bg-[var(--card-border)] text-[var(--text-subtle)] cursor-not-allowed'
                  }`}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Confirmation Suppression ───────────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(d => ({ ...d, isOpen: false }))}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        description={`Supprimer ${deleteTarget.name} ?${
          deleteTarget.type === 'level' ? ' Toutes les phrases associées seront supprimées.' : ''
        }`}
        confirmText="Supprimer"
        variant="danger"
      />
    </AdminShell>
  );
}
