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
  Layers,
  HelpCircle,
  RotateCcw,
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

const DIFF_LABEL: Record<string, string> = {
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Difficile',
  EXPERT: 'Expert',
};

const inputCls =
  'w-full px-3 py-2 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--text-subtle)] text-[var(--foreground)]';

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
    isOpen: boolean;
    type: 'level' | 'question';
    id: string;
    name: string;
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
        const data = await fetchApi<MissingWordLevel>(`/admin/missing-word/levels/${id}`);
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

  // Seeder 50 questions
  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const res = await fetchApi<{ message: string; count: number }>('/admin/missing-word/seed', {
        method: 'POST',
      });
      toast.success(res.message || '50 questions initialisées avec succès !');
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’initialisation';
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
          method: 'PATCH',
          body: JSON.stringify(levelForm),
        });
        toast.success('Niveau mis à jour');
      } else {
        await fetchApi('/admin/missing-word/levels', {
          method: 'POST',
          body: JSON.stringify(levelForm),
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
        method: 'POST',
        body: JSON.stringify({ direction }),
      });
      if (selectedLevelId) void loadLevelDetail(selectedLevelId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de déplacement';
      toast.error(msg);
    }
  };

  // Mélanger les questions (Fisher-Yates)
  const [isShuffling, setIsShuffling] = useState(false);
  const handleShuffle = async () => {
    if (!selectedLevel?.questions || selectedLevel.questions.length < 2) return;
    try {
      setIsShuffling(true);
      const ids = selectedLevel.questions.map((q) => q.id);
      const shuffled = [...ids];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      await fetchApi(`/admin/missing-word/levels/${selectedLevel.id}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ questionIds: shuffled }),
      });
      toast.success('Ordre des questions mélangé');
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

    const trimmedSentence = questionSentence.trim();
    const trimmedWord = questionForm.correctWord.trim();

    if (!trimmedSentence) {
      toast.error('Veuillez renseigner la phrase malgache.');
      return;
    }
    if (!trimmedWord || trimmedWord.length < 3) {
      toast.error('Le mot manquant doit faire au moins 3 caractères.');
      return;
    }

    const words = trimmedSentence.split(/\s+/);
    let found = false;
    const template = words.map((w) => {
      const clean = w.replace(/[.,!?;:]/g, '');
      if (clean.toLowerCase() === trimmedWord.toLowerCase()) {
        found = true;
        return '';
      }
      return w;
    });

    if (!found) {
      toast.error(`Le mot "${trimmedWord}" n'a pas été trouvé dans la phrase.`);
      return;
    }

    const choices = [
      trimmedWord,
      questionForm.choice1.trim(),
      questionForm.choice2.trim(),
      questionForm.choice3.trim(),
    ].filter(Boolean);

    if (choices.length < 4) {
      toast.error('Veuillez renseigner les 3 propositions distractrices.');
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
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Question mise à jour');
      } else {
        await fetchApi('/admin/missing-word/questions', {
          method: 'POST',
          body: JSON.stringify(payload),
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
      setDeleteTarget((d) => ({ ...d, isOpen: false }));
      void loadLevels();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(msg);
    }
  };

  const questionCount = selectedLevel?.questions?.length ?? 0;

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
      totalQuestions: 10,
      status: 'PUBLISHED',
    });
    setShowLevelModal(true);
  };

  const openEditLevel = (lvl: MissingWordLevel) => {
    setEditingLevel(lvl);
    setLevelForm({
      levelNumber: lvl.levelNumber,
      titleMg: lvl.titleMg,
      titleFr: lvl.titleFr || '',
      description: lvl.description || '',
      difficulty: lvl.difficulty,
      passThreshold: lvl.passThreshold,
      totalQuestions: lvl.totalQuestions,
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
    const fullSentence = q.template.map((w) => (w === '' ? q.correctWord : w)).join(' ');
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

  // Prévisualisation dynamique
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
      <div className="w-full space-y-4 max-w-6xl mx-auto pb-12">
        {/* En-tête standardisé */}
        <PageHeader
          title="Mot Manquant"
          description="Banque de questions par niveau · 10 questions tirées au sort par partie"
          icon={HelpCircle}
          badge={
            <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs">
              {levels.length} niveau{levels.length !== 1 ? 'x' : ''}
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              {levels.length === 0 && (
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-xs font-semibold hover:bg-[var(--card-hover)] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSeeding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>Initialiser 50 questions</span>
                </button>
              )}
              <button
                onClick={() => void loadLevels()}
                disabled={isLoading}
                className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer shadow-xs disabled:opacity-50"
                title="Actualiser"
              >
                <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
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
              <div className="text-center py-8 space-y-2.5">
                <p className="text-xs text-[var(--text-muted)]">Aucun niveau configuré.</p>
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-xs font-semibold hover:bg-[var(--card-hover)] transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Charger les 50 questions</span>
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
                            {count} question{count !== 1 ? 's' : ''} {isReady ? '✓' : '(min 10)'}
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
                        questionCount >= 10
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {questionCount} question{questionCount !== 1 ? 's' : ''}{' '}
                      {questionCount >= 10 ? '(Prêt pour tirage)' : '(Min 10 recommandé)'}
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
                    onClick={openAddQuestion}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une question</span>
                  </button>

                  {questionCount >= 2 && (
                    <button
                      onClick={handleShuffle}
                      disabled={isShuffling}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-xs font-medium text-[var(--foreground)] transition cursor-pointer shadow-xs disabled:opacity-50"
                      title="Mélanger l'ordre des questions aléatoirement"
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

              {/* Avertissement quota < 10 questions */}
              {questionCount < 10 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Ce niveau compte <strong>{questionCount} question{questionCount !== 1 ? 's' : ''}</strong>. Il est conseillé d&apos;atteindre au moins 10 questions pour un tirage au sort complet par partie.
                  </span>
                </div>
              )}

              {/* Liste des questions */}
              {isPanelLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                </div>
              ) : questionCount === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--text-muted)]">
                  Aucune question enregistrée dans ce niveau. Cliquez sur &quot;Ajouter une question&quot;.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedLevel.questions?.map((q, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === (selectedLevel.questions?.length ?? 0) - 1;

                    return (
                      <div
                        key={q.id}
                        className="group flex gap-3 p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card)] transition-colors shadow-xs"
                      >
                        {/* Contrôles d'ordre */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                          <button
                            disabled={isFirst}
                            onClick={() => handleMove(q.id, 'up')}
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
                            {q.orderIndex}
                          </span>
                          <button
                            disabled={isLast}
                            onClick={() => handleMove(q.id, 'down')}
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

                        {/* Contenu de la question */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div>
                            <p className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                              {q.template.map((w, i) => (
                                <span key={i}>
                                  {w === '' ? (
                                    <span className="inline-block px-2 py-0.5 mx-1 rounded-md bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] font-bold text-xs shadow-2xs">
                                      {q.correctWord}
                                    </span>
                                  ) : (
                                    `${w} `
                                  )}
                                </span>
                              ))}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                              « {q.french} »
                            </p>
                          </div>

                          {/* Aperçu des 4 propositions de choix */}
                          <div className="flex flex-wrap gap-1.5 items-center pt-1">
                            <span className="inline-flex items-center text-[10px] text-[var(--text-muted)] mr-1">
                              <Eye className="w-3 h-3 text-[var(--accent)] mr-1" />
                              Choix :
                            </span>
                            {q.choices.map((choice, i) => {
                              const isCorrect =
                                choice.toLowerCase() === q.correctWord.toLowerCase();
                              return (
                                <span
                                  key={i}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border shadow-xs ${
                                    isCorrect
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                                      : 'border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)]'
                                  }`}
                                >
                                  {choice} {isCorrect && '✓'}
                                </span>
                              );
                            })}
                          </div>

                          {/* Explication */}
                          {q.explanation && (
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 pt-0.5">
                              <span className="font-semibold text-[var(--foreground)]">Sens : </span>
                              {q.explanation}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => openEditQuestion(q)}
                            className="p-1.5 rounded-lg hover:bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
                            title="Modifier"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                isOpen: true,
                                type: 'question',
                                id: q.id,
                                name: `Question #${q.orderIndex}`,
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
              Sélectionnez un niveau à gauche pour visualiser et gérer ses questions.
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
                  placeholder="ex: Mora, Antonony, Sarotra..."
                  value={levelForm.titleMg}
                  onChange={(e) => setLevelForm({ ...levelForm, titleMg: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Titre français">
                <input
                  type="text"
                  placeholder="ex: Débutant, Intermédiaire, Avancé..."
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
                        difficulty: e.target.value as MissingWordLevel['difficulty'],
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

                <Field label="Seuil de passage">
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

      {/* ─── Modal Question ─────────────────────────────────────────────────────── */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--card-border)] sticky top-0 bg-[var(--input-bg)] z-10">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {editingQuestion ? 'Modifier la question' : 'Ajouter une question'}
              </h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--card-hover)] transition text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-5 space-y-4">
              <Field label="Phrase malgache complète" required>
                <textarea
                  rows={2}
                  required
                  placeholder="ex: Ny vary sy ny rano tsy mifanary."
                  value={questionSentence}
                  onChange={(e) => setQuestionSentence(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Mot manquant (min. 3 caractères)" required>
                <input
                  type="text"
                  required
                  placeholder="ex: rano (doit figurer dans la phrase ci-dessus)"
                  value={questionForm.correctWord}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctWord: e.target.value })}
                  className={inputCls}
                />
              </Field>

              {/* Aperçu dynamique */}
              {questionSentence.trim() && questionForm.correctWord.trim() && (
                <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">
                    Aperçu joueur :
                  </span>
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    {previewTemplate.map((w, i) => (
                      <span key={i}>
                        {w === '' ? (
                          <span className="inline-block px-2 py-0.5 mx-1 rounded-md border border-dashed border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent-text)] font-bold">
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
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--foreground)]">
                  3 Fausses réponses (Distracteurs) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Choix 2"
                    value={questionForm.choice1}
                    onChange={(e) => setQuestionForm({ ...questionForm, choice1: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Choix 3"
                    value={questionForm.choice2}
                    onChange={(e) => setQuestionForm({ ...questionForm, choice2: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Choix 4"
                    value={questionForm.choice3}
                    onChange={(e) => setQuestionForm({ ...questionForm, choice3: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <Field label="Traduction française" required>
                <textarea
                  rows={2}
                  required
                  placeholder="ex: Le riz et l'eau sont inséparables."
                  value={questionForm.french}
                  onChange={(e) => setQuestionForm({ ...questionForm, french: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field label="Explication culturelle (optionnelle)">
                <textarea
                  rows={2}
                  placeholder="ex: Proverbe valorisant l'harmonie et la solidarité..."
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
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

      {/* Confirmation suppression */}
      <ConfirmModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget((d) => ({ ...d, isOpen: false }))}
        onConfirm={handleDelete}
        title={`Supprimer ${deleteTarget.name}`}
        description="Cette action est irréversible. Voulez-vous vraiment continuer ?"
        confirmText="Supprimer"
        variant="danger"
      />
    </AdminShell>
  );
}
