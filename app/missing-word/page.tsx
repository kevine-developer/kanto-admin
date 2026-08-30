'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { ConfirmModal, LoadingState, Field } from '@/components/ui';
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
  Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MissingWordQuestion {
  id: string;
  orderIndex: number;
  template: string[];
  correctWord: string;
  choices: string[];
  french: string;
  explanation?: string | null;
  hint?: string | null;
  status: string;
}

interface MissingWordLevel {
  id: string;
  levelNumber: number;
  titleMg: string;
  titleFr?: string | null;
  description?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  passThreshold: number;
  totalQuestions: number;
  status: string;
  questions?: MissingWordQuestion[];
  _count?: { questions: number };
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

const DIFF_LABEL: Record<string, string> = {
  EASY: 'Facile', MEDIUM: 'Moyen', HARD: 'Difficile', EXPERT: 'Expert',
};



const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg bg-[var(--input-bg,var(--card))] border border-[var(--card-border)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--text-subtle)]';

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MissingWordAdminPage() {
  const { toast } = useToast();

  // Données
  const [levels, setLevels] = useState<MissingWordLevel[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<MissingWordLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelLoading, setIsPanelLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Modal Niveau
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<MissingWordLevel | null>(null);
  const [levelForm, setLevelForm] = useState({
    levelNumber: 1,
    titleMg: '',
    titleFr: '',
    description: '',
    difficulty: 'EASY' as MissingWordLevel['difficulty'],
    passThreshold: 5,
    totalQuestions: 10,
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
  });

  // Modal Question
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MissingWordQuestion | null>(null);
  const [questionSentence, setQuestionSentence] = useState('');
  const [questionForm, setQuestionForm] = useState({
    orderIndex: 1,
    correctWord: '',
    choice1: '',
    choice2: '',
    choice3: '',
    french: '',
    explanation: '',
    hint: '',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
  });

  // Confirmation suppression
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean; type: 'level' | 'question'; id: string; name: string;
  }>({ isOpen: false, type: 'level', id: '', name: '' });

  // Chargement des niveaux
  const loadLevels = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi<MissingWordLevel[]>('/admin/missing-word/levels');
      setLevels(data || []);
      if (data && data.length > 0) {
        setSelectedLevelId((prev) => (prev && data.some((l) => l.id === prev) ? prev : data[0].id));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadLevelDetail = useCallback(async (id: string) => {
    try {
      setIsPanelLoading(true);
      const data = await fetchApi<MissingWordLevel>(`/admin/missing-word/levels/${id}`);
      setSelectedLevel(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de chargement du niveau';
      toast.error(msg);
    } finally {
      setIsPanelLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    fetchApi<MissingWordLevel[]>('/admin/missing-word/levels')
      .then((data) => {
        if (!isMounted) return;
        setLevels(data || []);
        if (data && data.length > 0) {
          setSelectedLevelId((prev) => (prev && data.some((l) => l.id === prev) ? prev : data[0].id));
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erreur de chargement';
        toast.error(msg);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!selectedLevelId) return;
    let isMounted = true;
    fetchApi<MissingWordLevel>(`/admin/missing-word/levels/${selectedLevelId}`)
      .then((data) => {
        if (isMounted) setSelectedLevel(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erreur de chargement du niveau';
        toast.error(msg);
      })
      .finally(() => {
        if (isMounted) setIsPanelLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLevelId, toast]);

  // Initialisation du seed si la base est vide
  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await fetchApi('/admin/missing-word/seed', { method: 'POST' });
      toast.success('50 questions et 5 niveaux créés avec succès');
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du seed initial';
      toast.error(msg);
    } finally {
      setIsSeeding(false);
    }
  };

  // Sauvegarder niveau
  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        await fetchApi(`/admin/missing-word/levels/${editingLevel.id}`, {
          method: 'PATCH', body: JSON.stringify(levelForm),
        });
        toast.success('Niveau mis à jour');
      } else {
        await fetchApi('/admin/missing-word/levels', {
          method: 'POST', body: JSON.stringify(levelForm),
        });
        toast.success('Niveau créé');
      }
      setShowLevelModal(false);
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      toast.error(msg);
    }
  };

  // Déplacer une question
  const handleMove = async (questionId: string, direction: 'up' | 'down') => {
    try {
      await fetchApi(`/admin/missing-word/questions/${questionId}/move`, {
        method: 'POST', body: JSON.stringify({ direction }),
      });
      if (selectedLevelId) void loadLevelDetail(selectedLevelId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du déplacement';
      toast.error(msg);
    }
  };

  // Mélanger aléatoirement les questions du niveau
  const [isShuffling, setIsShuffling] = useState(false);
  const handleShuffle = async () => {
    if (!selectedLevel?.questions || selectedLevel.questions.length < 2) return;
    try {
      setIsShuffling(true);
      const ids = selectedLevel.questions.map(q => q.id);
      const shuffled = [...ids];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      await fetchApi(`/admin/missing-word/levels/${selectedLevel.id}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ questionIds: shuffled }),
      });
      toast.success('Questions mélangées');
      if (selectedLevelId) void loadLevelDetail(selectedLevelId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du mélange';
      toast.error(msg);
    } finally {
      setIsShuffling(false);
    }
  };

  // Sauvegarder question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevelId) return;

    const trimmedWord = questionForm.correctWord.trim();
    if (trimmedWord.length < 3) {
      toast.error('Le mot manquant doit contenir au moins 3 caractères.');
      return;
    }

    const words = questionSentence.trim().split(/\s+/).filter(Boolean);
    const targetIdx = words.findIndex(
      (w) => w.replace(/[.,!?;:]/g, '').toLowerCase() === trimmedWord.toLowerCase()
    );

    if (targetIdx < 0) {
      toast.error(`Le mot "${trimmedWord}" doit être présent dans la phrase malgache.`);
      return;
    }

    // Construire le template
    const template = words.map((w, i) => (i === targetIdx ? '' : w));

    // 4 choix (le mot correct + 3 choix distracteurs)
    const choices = [
      trimmedWord,
      questionForm.choice1.trim(),
      questionForm.choice2.trim(),
      questionForm.choice3.trim(),
    ].filter(Boolean);

    if (choices.length < 4) {
      toast.error('Veuillez renseigner les 3 autres propositions de mots (distracteurs).');
      return;
    }

    const payload = {
      levelId: selectedLevelId,
      orderIndex: questionForm.orderIndex,
      template,
      correctWord: trimmedWord,
      choices,
      french: questionForm.french.trim(),
      explanation: questionForm.explanation.trim() || undefined,
      hint: questionForm.hint.trim() || undefined,
      status: questionForm.status,
    };

    try {
      if (editingQuestion) {
        await fetchApi(`/admin/missing-word/questions/${editingQuestion.id}`, {
          method: 'PATCH', body: JSON.stringify(payload),
        });
        toast.success('Question mise à jour');
      } else {
        await fetchApi('/admin/missing-word/questions', {
          method: 'POST', body: JSON.stringify(payload),
        });
        toast.success('Question ajoutée');
      }
      setShowQuestionModal(false);
      void loadLevelDetail(selectedLevelId);
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      toast.error(msg);
    }
  };

  // Supprimer
  const handleDelete = async () => {
    try {
      if (deleteTarget.type === 'level') {
        await fetchApi(`/admin/missing-word/levels/${deleteTarget.id}`, { method: 'DELETE' });
        toast.success('Niveau supprimé');
        setSelectedLevelId(null);
        setSelectedLevel(null);
      } else {
        await fetchApi(`/admin/missing-word/questions/${deleteTarget.id}`, { method: 'DELETE' });
        toast.success('Question supprimée');
        if (selectedLevelId) void loadLevelDetail(selectedLevelId);
      }
      setDeleteTarget(d => ({ ...d, isOpen: false }));
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(msg);
    }
  };

  const questionCount = selectedLevel?.questions?.length ?? 0;

  // ── Helpers Modal ──────────────────────────────────────────────────────────

  const openCreateLevel = () => {
    setEditingLevel(null);
    setLevelForm({
      levelNumber: levels.length + 1, titleMg: '', titleFr: '',
      description: '', difficulty: 'EASY', passThreshold: 5, totalQuestions: 10, status: 'PUBLISHED',
    });
    setShowLevelModal(true);
  };

  const openEditLevel = (lvl: MissingWordLevel) => {
    setEditingLevel(lvl);
    setLevelForm({
      levelNumber: lvl.levelNumber, titleMg: lvl.titleMg, titleFr: lvl.titleFr || '',
      description: lvl.description || '', difficulty: lvl.difficulty,
      passThreshold: lvl.passThreshold, totalQuestions: lvl.totalQuestions,
      status: lvl.status as 'PUBLISHED' | 'DRAFT',
    });
    setShowLevelModal(true);
  };

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionSentence('');
    setQuestionForm({
      orderIndex: questionCount + 1,
      correctWord: '',
      choice1: '',
      choice2: '',
      choice3: '',
      french: '',
      explanation: '',
      hint: '',
      status: 'PUBLISHED',
    });
    setShowQuestionModal(true);
  };

  const openEditQuestion = (q: MissingWordQuestion) => {
    setEditingQuestion(q);
    const fullSentence = q.template
      .map((w) => (w === '' ? q.correctWord : w))
      .join(' ');
    setQuestionSentence(fullSentence);

    const otherChoices = q.choices.filter(
      (c) => c.toLowerCase() !== q.correctWord.toLowerCase()
    );

    setQuestionForm({
      orderIndex: q.orderIndex,
      correctWord: q.correctWord,
      choice1: otherChoices[0] || '',
      choice2: otherChoices[1] || '',
      choice3: otherChoices[2] || '',
      french: q.french,
      explanation: q.explanation || '',
      hint: q.hint || '',
      status: q.status as 'PUBLISHED' | 'DRAFT',
    });
    setShowQuestionModal(true);
  };

  // Prévisualisation de la phrase avec mot manquant
  const previewTemplate = useMemo(() => {
    if (!questionSentence) return [];
    const trimmed = questionForm.correctWord.trim().toLowerCase();
    return questionSentence.split(/\s+/).map((word) => {
      const clean = word.replace(/[.,!?;:]/g, '').toLowerCase();
      return clean === trimmed && trimmed.length >= 3 ? '' : word;
    });
  }, [questionSentence, questionForm.correctWord]);

  return (
    <AdminShell>
      {/* En-tête page */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">Mot Manquant</h1>
          <p className="text-xs text-[var(--text-subtle)] mt-0.5">
            {levels.length} niveau{levels.length !== 1 ? 'x' : ''} · Banque de questions par niveau · 10 questions tirées au sort par partie
          </p>
        </div>
        <div className="flex items-center gap-2">
          {levels.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-xs font-medium hover:bg-[var(--accent)] transition disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              Initialiser 50 questions
            </button>
          )}
          <button
            onClick={openCreateLevel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-medium hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau niveau
          </button>
        </div>
      </div>

      {/* Layout deux colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-start">

        {/* ── Colonne gauche : liste des niveaux ── */}
        <div className="space-y-1.5">
          {isLoading ? (
            <LoadingState message="Chargement..." />
          ) : levels.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-xs text-[var(--text-subtle)]">Aucun niveau configuré.</p>
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs font-medium hover:bg-[var(--accent)] transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Charger les 50 questions
              </button>
            </div>
          ) : (
            levels.map((lvl) => {
              const count = lvl._count?.questions ?? 0;
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
                    <p className="text-xs font-medium truncate text-[var(--foreground)]">
                      {lvl.titleMg}
                    </p>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5 flex items-center gap-1.5">
                      <span>{DIFF_LABEL[lvl.difficulty]}</span>
                      <span>·</span>
                      <span className={isReady ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                        {count} question{count !== 1 ? 's' : ''} {count >= 10 ? '✓' : '(min 10)'}
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
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
                    questionCount >= 10
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {questionCount} question{questionCount !== 1 ? 's' : ''} {questionCount >= 10 ? '(10 tirées au sort / partie)' : '(min 10 recommandé)'}
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
                  onClick={openAddQuestion}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-[11px] font-medium hover:bg-[var(--card)] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une question
                </button>

                {questionCount >= 2 && (
                  <button
                    onClick={handleShuffle}
                    disabled={isShuffling}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-[11px] font-medium hover:bg-[var(--card)] transition disabled:opacity-50"
                    title="Mélanger l'ordre des questions aléatoirement"
                  >
                    {isShuffling
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Shuffle className="w-3.5 h-3.5" />}
                    Mélanger
                  </button>
                )}
              </div>
            </div>

            {/* Avertissement quota */}
            {questionCount < 10 && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Ce niveau compte <strong>{questionCount} question{questionCount !== 1 ? 's' : ''}</strong>. Il est conseillé d&apos;avoir au moins 10 questions pour que le joueur bénéficie d&apos;une session complète de 10 questions tirées au sort.
                </span>
              </div>
            )}

            {/* Liste des questions */}
            {isPanelLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-subtle)]" />
              </div>
            ) : questionCount === 0 ? (
              <div className="text-center py-12 text-xs text-[var(--text-subtle)]">
                Aucune question. Cliquez sur &quot;Ajouter une question&quot;.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedLevel.questions?.map((q, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === (selectedLevel.questions?.length ?? 0) - 1;

                  return (
                    <div
                      key={q.id}
                      className="group flex gap-3 p-3.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)] transition"
                    >
                      {/* Contrôle d'ordre */}
                      <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                        <button
                          disabled={isFirst}
                          onClick={() => handleMove(q.id, 'up')}
                          className={`p-0.5 rounded transition ${isFirst ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[var(--accent)] text-[var(--text-subtle)]'}`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-black text-[var(--text-subtle)] w-5 text-center leading-none py-1">
                          {q.orderIndex}
                        </span>
                        <button
                          disabled={isLast}
                          onClick={() => handleMove(q.id, 'down')}
                          className={`p-0.5 rounded transition ${isLast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[var(--accent)] text-[var(--text-subtle)]'}`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)] leading-snug">
                            {q.template.map((w, i) => (
                              <span key={i}>
                                {w === '' ? (
                                  <span className="inline-block px-2 py-0.5 mx-1 rounded bg-[var(--accent)] text-[var(--foreground)] font-bold text-xs">
                                    {q.correctWord}
                                  </span>
                                ) : (
                                  `${w} `
                                )}
                              </span>
                            ))}
                          </p>
                          <p className="text-xs text-[var(--text-subtle)] mt-0.5">« {q.french} »</p>
                        </div>

                        {/* Aperçu tuiles choix */}
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-subtle)] mr-1">
                            <Eye className="w-3 h-3" />
                          </span>
                          {q.choices.map((choice, i) => {
                            const isCorrect = choice.toLowerCase() === q.correctWord.toLowerCase();
                            return (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                                    : 'border-[var(--card-border)] bg-[var(--background)] text-[var(--text-subtle)]'
                                }`}
                              >
                                {choice} {isCorrect && '✓'}
                              </span>
                            );
                          })}
                        </div>

                        {/* Explication / Indice */}
                        {q.explanation && (
                          <p className="text-[11px] text-[var(--text-subtle)] line-clamp-1">
                            <span className="font-semibold text-[var(--foreground)]">Sens : </span>
                            {q.explanation}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEditQuestion(q)}
                          className="p-1.5 rounded hover:bg-[var(--accent)] transition text-[var(--text-subtle)]"
                          title="Modifier"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({
                            isOpen: true, type: 'question', id: q.id,
                            name: `Question #${q.orderIndex}`,
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
            Sélectionnez un niveau pour voir ses questions.
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
                  type="text" required placeholder="ex: Mora, Antonony, Sarotra..."
                  value={levelForm.titleMg}
                  onChange={e => setLevelForm({ ...levelForm, titleMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Titre français">
                <input
                  type="text" placeholder="ex: Débutant, Intermédiaire, Avancé..."
                  value={levelForm.titleFr}
                  onChange={e => setLevelForm({ ...levelForm, titleFr: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Difficulté">
                  <select
                    value={levelForm.difficulty}
                    onChange={e => setLevelForm({ ...levelForm, difficulty: e.target.value as MissingWordLevel['difficulty'] })}
                    className={inputCls}
                  >
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                    <option value="EXPERT">Expert</option>
                  </select>
                </Field>

                <Field label="Seuil de passage">
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

      {/* ─── Modal Question ─────────────────────────────────────────────────────── */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)] sticky top-0 bg-[var(--card)] z-10">
              <h3 className="text-sm font-semibold">
                {editingQuestion ? 'Modifier la question' : 'Ajouter une question'}
              </h3>
              <button onClick={() => setShowQuestionModal(false)} className="p-1 rounded hover:bg-[var(--accent)] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-5 space-y-4">
              <Field label="Phrase malgache complète" required>
                <textarea
                  rows={2} required
                  placeholder="ex: Ny vary sy ny rano tsy mifanary."
                  value={questionSentence}
                  onChange={e => setQuestionSentence(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Mot manquant (min. 3 caractères)" required>
                <input
                  type="text" required
                  placeholder="ex: rano (doit figurer dans la phrase ci-dessus)"
                  value={questionForm.correctWord}
                  onChange={e => setQuestionForm({ ...questionForm, correctWord: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Aperçu dynamique */}
              {questionSentence.trim() && questionForm.correctWord.trim() && (
                <div className="px-3 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] space-y-1.5">
                  <span className="text-[10px] text-[var(--text-subtle)] font-medium uppercase tracking-wider">Aperçu du joueur :</span>
                  <p className="text-xs font-medium text-[var(--foreground)]">
                    {previewTemplate.map((w, i) => (
                      <span key={i}>
                        {w === '' ? (
                          <span className="inline-block px-2 py-0.5 mx-1 rounded border border-dashed border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--foreground)] font-bold">
                            ··· ? ···
                          </span>
                        ) : (
                          `${w} `
                        )}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* Les 3 autres choix (distracteurs) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-[var(--text-subtle)] uppercase tracking-wider">
                  3 Fausses réponses (Distracteurs) <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text" required placeholder="Choix 2"
                    value={questionForm.choice1}
                    onChange={e => setQuestionForm({ ...questionForm, choice1: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="text" required placeholder="Choix 3"
                    value={questionForm.choice2}
                    onChange={e => setQuestionForm({ ...questionForm, choice2: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="text" required placeholder="Choix 4"
                    value={questionForm.choice3}
                    onChange={e => setQuestionForm({ ...questionForm, choice3: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <Field label="Traduction française" required>
                <textarea
                  rows={2} required
                  placeholder="ex: Le riz et l'eau sont inséparables."
                  value={questionForm.french}
                  onChange={e => setQuestionForm({ ...questionForm, french: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Explication culturelle (optionnelle)">
                <textarea
                  rows={2}
                  placeholder="ex: Proverbe valorisant l'harmonie et la solidarité..."
                  value={questionForm.explanation}
                  onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowQuestionModal(false)}
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

      {/* Confirmation suppression */}
      <ConfirmModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(d => ({ ...d, isOpen: false }))}
        onConfirm={handleDelete}
        title={`Supprimer ${deleteTarget.name}`}
        description="Cette action est irréversible. Voulez-vous vraiment continuer ?"
        confirmText="Supprimer"
        variant="danger"
      />
    </AdminShell>
  );
}
