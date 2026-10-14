'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal, Field } from '@/components/ui';
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
  Puzzle,
  RotateCcw,
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
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let res = '';
  for (const [v, r] of map) {
    while (num >= v) {
      res += r;
      num -= v;
    }
  }
  return res || 'I';
};

const getWords = (sentence: string): string[] => {
  if (!sentence) return [];
  return sentence.replace(/[.,!?;:]/g, '').trim().split(/\s+/).filter(Boolean);
};

const DIFF_LABEL: Record<string, string> = {
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Difficile',
  EXPERT: 'Expert',
};

const inputCls =
  'w-full px-3 py-2 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--text-subtle)] text-[var(--foreground)]';

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
    isOpen: boolean;
    type: 'level' | 'sentence';
    id: string;
    name: string;
  }>({ isOpen: false, type: 'level', id: '', name: '' });

  // Chargement des niveaux
  const loadLevels = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi<WordPuzzleLevel[]>('/admin/word-puzzle/levels');
      setLevels(data || []);
      if (data && data.length > 0) {
        setSelectedLevelId((prev) => (prev && data.some((l) => l.id === prev) ? prev : data[0].id));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement des niveaux';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadLevelDetail = useCallback(
    async (id: string) => {
      try {
        setIsPanelLoading(true);
        const data = await fetchApi<WordPuzzleLevel>(`/admin/word-puzzle/levels/${id}`);
        setSelectedLevel(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur de chargement du niveau';
        toast.error(msg);
      } finally {
        setIsPanelLoading(false);
      }
    },
    [toast]
  );

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
      const msg = err instanceof Error ? err.message : 'Erreur de sauvegarde';
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
      const msg = err instanceof Error ? err.message : 'Erreur lors du déplacement';
      toast.error(msg);
    }
  };

  // Mélanger aléatoirement les phrases (Fisher-Yates)
  const [isShuffling, setIsShuffling] = useState(false);
  const handleShuffle = async () => {
    if (!selectedLevel?.sentences || selectedLevel.sentences.length < 2) return;
    try {
      setIsShuffling(true);
      const ids = selectedLevel.sentences.map((s) => s.id);
      const shuffled = [...ids];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      await fetchApi(`/admin/word-puzzle/levels/${selectedLevel.id}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ sentenceIds: shuffled }),
      });
      toast.success('Ordre des phrases mélangé');
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
        await fetchApi(`/admin/word-puzzle/levels/${selectedLevelId}/sentences`, {
          method: 'POST',
          body: JSON.stringify(sentenceForm),
        });
        toast.success('Phrase ajoutée au niveau');
      }
      setShowSentenceModal(false);
      void loadLevelDetail(selectedLevelId);
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de sauvegarde';
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
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(msg);
    }
  };

  const previewWords = useMemo(() => getWords(sentenceForm.malagasy), [sentenceForm.malagasy]);
  const sentenceCount = selectedLevel?.sentences?.length ?? 0;

  // Helpers Modal
  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelForm({
      levelNumber: levels.length + 1,
      titleMg: '',
      titleFr: '',
      description: '',
      difficulty: 'EASY',
      passThreshold: 5,
      totalSentences: 10,
      status: 'PUBLISHED',
    });
    setShowLevelModal(true);
  };

  const openEditLevel = (lvl: WordPuzzleLevel) => {
    setEditingLevel(lvl);
    setLevelForm({
      levelNumber: lvl.levelNumber,
      titleMg: lvl.titleMg,
      titleFr: lvl.titleFr || '',
      description: lvl.description || '',
      difficulty: lvl.difficulty,
      passThreshold: lvl.passThreshold,
      totalSentences: lvl.totalSentences,
      status: lvl.status as 'PUBLISHED' | 'DRAFT',
    });
    setShowLevelModal(true);
  };

  const openAddSentence = () => {
    setEditingSentence(null);
    setSentenceForm({
      orderIndex: sentenceCount + 1,
      malagasy: '',
      french: '',
      hint: '',
      explanationMg: '',
      status: 'PUBLISHED',
    });
    setShowSentenceModal(true);
  };

  const openEditSentence = (st: WordPuzzleSentence) => {
    setEditingSentence(st);
    setSentenceForm({
      orderIndex: st.orderIndex,
      malagasy: st.malagasy,
      french: st.french,
      hint: st.hint || '',
      explanationMg: st.explanationMg || '',
      status: st.status as 'PUBLISHED' | 'DRAFT',
    });
    setShowSentenceModal(true);
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 max-w-6xl mx-auto pb-12">
        {/* En-tête standardisé */}
        <PageHeader
          title="Remets dans l'ordre"
          description="Banque de phrases par niveau · 10 phrases tirées au sort par partie"
          icon={Puzzle}
          badge={
            <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs">
              {levels.length} niveau{levels.length !== 1 ? 'x' : ''}
            </span>
          }
          actions={
            <button
              onClick={() => void loadLevels()}
              disabled={isLoading}
              className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Actualiser"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
          primaryAction={{
            label: 'Nouveau niveau',
            icon: <Plus className="w-3.5 h-3.5" />,
            onClick: openCreateLevel,
          }}
        />

        {/* Layout deux colonnes épuré */}
        <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-4 items-start">
          {/* ── Colonne gauche : Liste des niveaux ── */}
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-2 space-y-1.5 shadow-xs">
            <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between border-b border-[var(--card-border)] mb-1">
              <span>Niveaux de jeu</span>
              <span className="font-mono text-xs">{levels.length}</span>
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              </div>
            ) : levels.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-8">
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
                    className={`group flex items-center justify-between gap-2.5 p-2.5 rounded-xl cursor-pointer transition select-none border ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-light)] shadow-xs'
                        : 'border-transparent hover:border-[var(--card-border)] hover:bg-[var(--card-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono border transition ${
                          isSelected
                            ? 'bg-[var(--accent)] text-white border-transparent'
                            : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--foreground)]'
                        }`}
                      >
                        {toRoman(lvl.levelNumber)}
                      </span>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {lvl.titleMg}
                        </p>
                        <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                          <span>{DIFF_LABEL[lvl.difficulty]}</span>
                          <span>•</span>
                          <span
                            className={
                              isReady
                                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-amber-600 dark:text-amber-400 font-medium'
                            }
                          >
                            {count} phrase{count !== 1 ? 's' : ''} {isReady ? '✓' : '(min 10)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions d'édition du niveau */}
                    <div
                      className={`flex items-center gap-1 shrink-0 transition ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openEditLevel(lvl)}
                        className="p-1 rounded-md hover:bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
                        title="Modifier le niveau"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            isOpen: true,
                            type: 'level',
                            id: lvl.id,
                            name: `Niveau ${toRoman(lvl.levelNumber)} — ${lvl.titleMg}`,
                          })
                        }
                        className="p-1 rounded-md hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
                        title="Supprimer le niveau"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Colonne droite : Détail du niveau sélectionné ── */}
          {selectedLevel ? (
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-4 shadow-xs">
              {/* En-tête du niveau */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--card-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] font-mono">
                      Niveau {toRoman(selectedLevel.levelNumber)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                        sentenceCount >= 10
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {sentenceCount} phrase{sentenceCount !== 1 ? 's' : ''}{' '}
                      {sentenceCount >= 10 ? '(Prêt pour tirage)' : '(Min 10 recommandé)'}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-[var(--foreground)] mt-1">
                    {selectedLevel.titleMg}
                    {selectedLevel.titleFr && (
                      <span className="font-normal text-[var(--text-muted)] ml-2 text-xs">
                        · {selectedLevel.titleFr}
                      </span>
                    )}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openAddSentence}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une phrase</span>
                  </button>

                  {sentenceCount >= 2 && (
                    <button
                      onClick={handleShuffle}
                      disabled={isShuffling}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-xs font-medium text-[var(--foreground)] transition cursor-pointer shadow-xs disabled:opacity-50"
                      title="Mélanger l'ordre des phrases aléatoirement"
                    >
                      {isShuffling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Shuffle className="w-3.5 h-3.5 text-[var(--accent)]" />
                      )}
                      <span>Mélanger</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Avertissement quota < 10 phrases */}
              {sentenceCount < 10 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Ce niveau compte <strong>{sentenceCount} phrase{sentenceCount !== 1 ? 's' : ''}</strong>. Il est conseillé d&apos;atteindre au moins 10 phrases pour un tirage au sort complet par partie.
                  </span>
                </div>
              )}

              {/* Liste des phrases */}
              {isPanelLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                </div>
              ) : sentenceCount === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                  Aucune phrase enregistrée dans ce niveau. Cliquez sur &quot;Ajouter une phrase&quot;.
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
                        className="group flex gap-3 p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card)] transition-colors shadow-xs"
                      >
                        {/* Contrôles d'ordre */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                          <button
                            disabled={isFirst}
                            onClick={() => handleMove(st.id, 'up')}
                            className={`p-1 rounded-md transition ${
                              isFirst
                                ? 'opacity-20 cursor-not-allowed'
                                : 'hover:bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer'
                            }`}
                            title="Monter"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] w-5 text-center">
                            {st.orderIndex}
                          </span>
                          <button
                            disabled={isLast}
                            onClick={() => handleMove(st.id, 'down')}
                            className={`p-1 rounded-md transition ${
                              isLast
                                ? 'opacity-20 cursor-not-allowed'
                                : 'hover:bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer'
                            }`}
                            title="Descendre"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Contenu de la phrase */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div>
                            <p className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                              {st.malagasy}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                              {st.french}
                            </p>
                          </div>

                          {/* Aperçu des tuiles de mots */}
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="inline-flex items-center text-[10px] text-[var(--text-muted)] mr-1">
                              <Eye className="w-3 h-3 text-[var(--accent)] mr-1" />
                              Tuiles :
                            </span>
                            {words.map((w, wIdx) => (
                              <span
                                key={wIdx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                              >
                                {w}
                              </span>
                            ))}
                          </div>

                          {/* Indice */}
                          {st.hint && (
                            <div className="pt-0.5">
                              <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] font-medium">
                                Indice : {st.hint}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => openEditSentence(st)}
                            className="p-1.5 rounded-lg hover:bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                isOpen: true,
                                type: 'sentence',
                                id: st.id,
                                name: `Phrase #${st.orderIndex}`,
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
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
            <div className="flex items-center justify-center py-16 text-xs text-[var(--text-muted)] rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
              Sélectionnez un niveau à gauche pour visualiser et gérer ses phrases.
            </div>
          ) : null}
        </div>
      </div>

      {/* ─── Modal Niveau ─────────────────────────────────────────────────────── */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)]">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {editingLevel ? 'Modifier le niveau' : 'Nouveau niveau'}
              </h3>
              <button
                onClick={() => setShowLevelModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--card-hover)] transition text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLevel} className="p-5 space-y-4">
              <Field label="Numéro du niveau" required>
                <input
                  type="number"
                  min={1}
                  required
                  value={levelForm.levelNumber}
                  onChange={(e) =>
                    setLevelForm({ ...levelForm, levelNumber: parseInt(e.target.value) || 1 })
                  }
                  className={inputCls}
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                  Identifiant romain : <strong>NIVEAU {toRoman(levelForm.levelNumber)}</strong>
                </p>
              </Field>

              <Field label="Titre malgache" required>
                <input
                  type="text"
                  required
                  placeholder="ex: Firaisankina sy Fihavanana"
                  value={levelForm.titleMg}
                  onChange={(e) => setLevelForm({ ...levelForm, titleMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Titre français">
                <input
                  type="text"
                  placeholder="ex: Solidarité et Harmonie"
                  value={levelForm.titleFr}
                  onChange={(e) => setLevelForm({ ...levelForm, titleFr: e.target.value })}
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
                    type="number"
                    min={1}
                    max={10}
                    value={levelForm.passThreshold}
                    onChange={(e) =>
                      setLevelForm({ ...levelForm, passThreshold: parseInt(e.target.value) || 5 })
                    }
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowLevelModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Phrase ─────────────────────────────────────────────────────── */}
      {showSentenceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--card-border)] sticky top-0 bg-[var(--input-bg)] z-10">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {editingSentence ? 'Modifier la phrase' : 'Ajouter une phrase'}
              </h3>
              <button
                onClick={() => setShowSentenceModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--card-hover)] transition text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSentence} className="p-5 space-y-4">
              <Field label="Phrase malgache" required>
                <textarea
                  rows={2}
                  required
                  placeholder="ex: Izay mitambatra vato ary izay misaraka fasika"
                  value={sentenceForm.malagasy}
                  onChange={(e) => setSentenceForm({ ...sentenceForm, malagasy: e.target.value })}
                  className={inputCls}
                />

                {/* Aperçu tuiles */}
                <div className="mt-2 p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
                      Tuiles interactives générées
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        previewWords.length >= 2 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {previewWords.length} mot{previewWords.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {previewWords.length < 2 ? (
                    <p className="text-[11px] text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Au moins 2 mots requis pour le puzzle.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {previewWords.map((w, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] border border-[var(--card-border)] bg-[var(--card)] font-medium text-[var(--foreground)] shadow-xs"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Traduction française" required>
                <textarea
                  rows={2}
                  required
                  placeholder="ex: L'union fait la force"
                  value={sentenceForm.french}
                  onChange={(e) => setSentenceForm({ ...sentenceForm, french: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Indice (optionnel)">
                <input
                  type="text"
                  placeholder="ex: mitambatra"
                  value={sentenceForm.hint}
                  onChange={(e) => setSentenceForm({ ...sentenceForm, hint: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Explication culturelle (optionnel)">
                <textarea
                  rows={2}
                  placeholder="ex: Mampiseho fa ny firaisan-kina no herin'ny fiaraha-monina."
                  value={sentenceForm.explanationMg}
                  onChange={(e) =>
                    setSentenceForm({ ...sentenceForm, explanationMg: e.target.value })
                  }
                  className={inputCls}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowSentenceModal(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={previewWords.length < 2}
                  className="px-4 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white font-semibold hover:opacity-90 disabled:opacity-40 transition cursor-pointer shadow-xs"
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
        onClose={() => setDeleteTarget((d) => ({ ...d, isOpen: false }))}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        description={`Supprimer ${deleteTarget.name} ?${
          deleteTarget.type === 'level'
            ? ' Toutes les phrases associées seront supprimées.'
            : ''
        }`}
        confirmText="Supprimer"
        variant="danger"
      />
    </AdminShell>
  );
}
