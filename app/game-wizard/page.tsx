'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchApi } from '@/lib/api-client';
import { useToast } from '@/lib/hooks/useToast';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Image as ImageIcon,
  Landmark,
  ScrollText,
  Layers,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Send,
  Save,
  Compass,
  FileQuestion,
  Info,
  Calendar,
  TreePine,
  Search,
} from 'lucide-react';

// ─── Types & Enums ────────────────────────────────────────────────────────────

type ContentSourceType =
  | 'PRESIDENT'
  | 'BANKNOTE'
  | 'PROVINCE'
  | 'NATURE_EMBLEM'
  | 'HISTORY_DATE'
  | 'MALAGASY_ITEM'
  | 'FREE_FORM';

type GameQuestionFormat =
  | 'SINGLE_CHOICE'
  | 'TRUE_FALSE'
  | 'RIDDLE'
  | 'IMAGE_IDENTIFICATION';

interface ContentSourceItem {
  id: string;
  sourceType: ContentSourceType;
  title: string;
  titleMg?: string;
  categoryName: string;
  summary: string;
  imageUrl?: string | null;
  period?: string | null;
  sourceRef?: string | null;
  metadata?: Record<string, any>;
}

interface QuestionFormState {
  format: GameQuestionFormat;
  prompt: string;
  promptMg: string;
  promptFr: string;
  choices: string[];
  answerIndex: number;
  isTrue: boolean;
  correctAnswer: string;
  acceptedAnswers: string[];
  clue: string;
  explanation: string;
  explanationMg: string;
  explanationTrueFr: string;
  explanationFalseFr: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  imageUrl: string;
  imageAlt: string;
  sourceReference: string;
  historicalPeriod: string;
  levelNumber: number;
}

const CATEGORIES: { id: string; label: string; icon: any }[] = [
  { id: 'histoire_royaumes', label: 'Histoire & Royaumes', icon: Landmark },
  { id: 'citoyennete_fihavanana', label: 'Citoyenneté & Fihavanana', icon: Compass },
  { id: 'geographie_regions', label: 'Géographie & Terroirs', icon: Compass },
  { id: 'symboles_identite', label: 'Symboles & Emblèmes', icon: Layers },
  { id: 'enigmes_sagesse', label: 'Devinettes & Ohabolana', icon: ScrollText },
  { id: 'arts_musique_saveurs', label: 'Arts & Patrimoine vivant', icon: BookOpen },
];

const SOURCE_CATEGORIES: { type: ContentSourceType; label: string; icon: any; count?: number }[] = [
  { type: 'PRESIDENT', label: 'Présidents & Dirigeants', icon: Landmark },
  { type: 'BANKNOTE', label: 'Billets & Monnaies', icon: Layers },
  { type: 'PROVINCE', label: 'Provinces & Blasons', icon: Compass },
  { type: 'NATURE_EMBLEM', label: 'Faune & Flore Emblématiques', icon: TreePine },
  { type: 'HISTORY_DATE', label: 'Repères Historiques', icon: Calendar },
  { type: 'MALAGASY_ITEM', label: 'Ohabolana & Proverbes', icon: ScrollText },
];

export default function GameWizardPage() {
  const { toast } = useToast();

  // Navigation par étape
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // État des sources
  const [sources, setSources] = useState<ContentSourceItem[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<ContentSourceType>('PRESIDENT');
  const [searchSource, setSearchSource] = useState('');
  const [selectedSource, setSelectedSource] = useState<ContentSourceItem | null>(null);

  // Mode de création (Unitaire ou Série - 10 questions par niveau complet)
  const [creationMode, setCreationMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [batchCount, setBatchCount] = useState<number>(10);
  const [batchItems, setBatchItems] = useState<QuestionFormState[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  // Aperçu mobile
  const [mobilePreviewTheme, setMobilePreviewTheme] = useState<'light' | 'dark'>('dark');

  // Formulaire d'édition de la question
  const [formData, setFormData] = useState<QuestionFormState>({
    format: 'SINGLE_CHOICE',
    prompt: '',
    promptMg: '',
    promptFr: '',
    choices: ['', '', '', ''],
    answerIndex: 0,
    isTrue: true,
    correctAnswer: '',
    acceptedAnswers: [],
    clue: '',
    explanation: '',
    explanationMg: '',
    explanationTrueFr: '',
    explanationFalseFr: '',
    difficulty: 'EASY',
    category: 'histoire_royaumes',
    imageUrl: '',
    imageAlt: '',
    sourceReference: '',
    historicalPeriod: '',
    levelNumber: 1,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ─── Chargement des sources de contenu Kanto ────────────────────────────────
  const loadSources = async (type: ContentSourceType, search = '') => {
    setIsLoadingSources(true);
    try {
      const q = new URLSearchParams({ type, limit: '40' });
      if (search) q.append('search', search);
      const res = await fetchApi<{ items: ContentSourceItem[]; total: number }>(
        `/admin/game-wizard/sources?${q.toString()}`
      );
      setSources(res.items || []);
    } catch (err) {
      console.error('Erreur chargement sources:', err);
      toast.error('Impossible de charger les contenus du Conservatoire');
    } finally {
      setIsLoadingSources(false);
    }
  };

  useEffect(() => {
    if (selectedSourceType !== 'FREE_FORM') {
      loadSources(selectedSourceType, searchSource);
    }
  }, [selectedSourceType]);

  // ─── Génération assistée de suggestions ──────────────────────────────────────
  const handleGenerateSuggestions = async (formatOverride?: GameQuestionFormat) => {
    if (!selectedSource && selectedSourceType !== 'FREE_FORM') {
      toast.warning('Veuillez sélectionner un contenu source de Kanto avant de générer');
      return;
    }

    setIsGenerating(true);
    try {
      const targetFormat = formatOverride || formData.format;
      const res = await fetchApi<any[]>('/admin/game-wizard/suggest', {
        method: 'POST',
        body: JSON.stringify({
          sourceType: selectedSource?.sourceType || selectedSourceType,
          sourceId: selectedSource?.id,
          format: targetFormat,
          difficulty: formData.difficulty,
        }),
      });

      if (res && res.length > 0) {
        const s = res[0];
        setFormData((prev) => ({
          ...prev,
          format: s.format,
          prompt: s.prompt || prev.prompt,
          promptMg: s.promptMg || prev.promptMg,
          promptFr: s.promptFr || prev.promptFr,
          choices: s.choices && s.choices.length >= 2 ? s.choices : prev.choices,
          answerIndex: s.answerIndex !== undefined ? s.answerIndex : 0,
          isTrue: s.isTrue !== undefined ? s.isTrue : true,
          correctAnswer: s.correctAnswer || prev.correctAnswer,
          acceptedAnswers: s.acceptedAnswers || prev.acceptedAnswers,
          clue: s.clue || prev.clue,
          explanation: s.explanation || prev.explanation,
          explanationMg: s.explanationMg || prev.explanationMg,
          explanationTrueFr: s.explanationTrueFr || prev.explanationTrueFr,
          explanationFalseFr: s.explanationFalseFr || prev.explanationFalseFr,
          category: s.category || prev.category,
          imageUrl: s.imageUrl || prev.imageUrl,
          imageAlt: s.imageAlt || prev.imageAlt,
          sourceReference: s.sourceReference || prev.sourceReference,
          historicalPeriod: s.historicalPeriod || prev.historicalPeriod,
        }));

        toast.success('Proposition prête : contenu extrait et formulé avec succès.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Impossible de suggérer automatiquement pour ce contenu');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Contrôle qualité éditorial en direct ────────────────────────────────────
  const qualityChecks = useMemo(() => {
    const checks: { label: string; passed: boolean; message: string; critical: boolean }[] = [];

    // 1. Énoncé
    const hasPrompt = Boolean(formData.prompt && formData.prompt.trim().length >= 10);
    checks.push({
      label: 'Énoncé clair et explicite',
      passed: hasPrompt,
      message: hasPrompt ? 'Énoncé suffisamment développé' : 'L\'énoncé doit contenir au moins 10 caractères',
      critical: true,
    });

    // 2. Format QCM / Image
    if (formData.format === 'SINGLE_CHOICE' || formData.format === 'IMAGE_IDENTIFICATION') {
      const distinct = new Set(formData.choices.map((c) => c.trim().toLowerCase())).size === formData.choices.length;
      const allFilled = formData.choices.every((c) => c.trim().length > 0);
      checks.push({
        label: '4 propositions distinctes',
        passed: distinct && allFilled,
        message: !allFilled ? 'Chaque choix doit être renseigné' : distinct ? 'Aucun doublon dans les choix' : 'Des choix identiques ont été détectés',
        critical: true,
      });

      const validIndex = formData.answerIndex >= 0 && formData.answerIndex < formData.choices.length;
      checks.push({
        label: 'Bonne réponse définie',
        passed: validIndex,
        message: validIndex ? `Réponse attendue : choix #${formData.answerIndex + 1}` : 'Index de réponse incorrect',
        critical: true,
      });
    }

    // 3. Format Vrai/Faux
    if (formData.format === 'TRUE_FALSE') {
      checks.push({
        label: 'Valeur de vérité arrêtée',
        passed: formData.isTrue !== undefined,
        message: formData.isTrue ? 'Affirmation définie comme VRAIE' : 'Affirmation définie comme FAUSSE',
        critical: true,
      });
    }

    // 4. Format Devinette
    if (formData.format === 'RIDDLE') {
      const hasAnswer = Boolean(formData.correctAnswer && formData.correctAnswer.trim().length > 0);
      checks.push({
        label: 'Solution canonique définie',
        passed: hasAnswer,
        message: hasAnswer ? `Réponse : ${formData.correctAnswer}` : 'La réponse de l\'énigme est requise',
        critical: true,
      });
    }

    // 5. Explication pédagogique
    const hasExp = Boolean(formData.explanation && formData.explanation.trim().length >= 15);
    checks.push({
      label: 'Explication pédagogique',
      passed: hasExp,
      message: hasExp ? 'Explication fournie après réponse' : 'Une explication enrichissante doit être rédigée',
      critical: false,
    });

    // 6. Source documentaire
    const hasSource = Boolean(formData.sourceReference && formData.sourceReference.trim().length > 0);
    checks.push({
      label: 'Source & Vérifiabilité',
      passed: hasSource,
      message: hasSource ? `Source : ${formData.sourceReference}` : 'Renseigner la source documentaire (archives, BFM, Ntaolo...)',
      critical: false,
    });

    // 7. Image anti-spoiler
    if (formData.imageUrl) {
      checks.push({
        label: 'Média & Image de référence',
        passed: true,
        message: 'Image associée avec texte alternatif',
        critical: false,
      });
    }

    return checks;
  }, [formData]);

  const canPublish = useMemo(() => {
    return qualityChecks.every((c) => !c.critical || c.passed);
  }, [qualityChecks]);

  // ─── Publication finale ──────────────────────────────────────────────────────
  const handlePublish = async (status: 'PUBLISHED' | 'DRAFT' = 'PUBLISHED') => {
    if (!canPublish) {
      toast.warning('Veuillez résoudre les critères bloquants avant publication.');
      return;
    }

    setIsPublishing(true);
    try {
      const payload = {
        format: formData.format,
        prompt: formData.prompt,
        promptMg: formData.promptMg || undefined,
        promptFr: formData.promptFr || undefined,
        difficulty: formData.difficulty,
        category: formData.category,
        imageUrl: formData.imageUrl || undefined,
        imageAlt: formData.imageAlt || undefined,
        sourceReference: formData.sourceReference || undefined,
        historicalPeriod: formData.historicalPeriod || undefined,
        contentSourceType: selectedSource?.sourceType || 'FREE_FORM',
        contentSourceId: selectedSource?.id || undefined,
        levelNumber: formData.levelNumber || 1,
        status,
        choices: formData.choices,
        answerIndex: formData.answerIndex,
        explanation: formData.explanation,
        explanationMg: formData.explanationMg || undefined,
        isTrue: formData.isTrue,
        explanationTrueFr: formData.explanationTrueFr || undefined,
        explanationFalseFr: formData.explanationFalseFr || undefined,
        correctAnswer: formData.correctAnswer || undefined,
        acceptedAnswers: formData.acceptedAnswers,
        clue: formData.clue || undefined,
      };

      const res = await fetchApi<any>('/admin/game-wizard/publish', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(status === 'PUBLISHED' ? '🎉 Question publiée avec succès !' : '📁 Brouillon sauvegardé');

      // Réinitialiser ou passer à la question suivante
      setStep(1);
      setSelectedSource(null);
    } catch (err: any) {
      toast.error(err.message || 'Échec de l\'enregistrement de la question');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <PageHeader
          title="Assistant de Création de Jeux"
          description="Transformez le patrimoine, l'histoire, la citoyenneté et la langue malgache en exercices éducatifs interactifs."
          badge="Édition Vivante"
        />

        {/* ─── FIL D'ARIANE DES 4 ÉTAPES ────────────────────────────────────────── */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, title: 'Source Kanto', desc: 'Patrimoine & Mémoire' },
              { num: 2, title: 'Format du Jeu', desc: 'QCM, Vrai/Faux, Devinette' },
              { num: 3, title: 'Rédaction & IA', desc: 'Propositions & Ajustements' },
              { num: 4, title: 'Contrôle & Publication', desc: 'Aperçu mobile en direct' },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isPassed = step > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num as any)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isCurrent
                      ? 'bg-[var(--sidebar-accent)] text-black font-semibold shadow-sm'
                      : isPassed
                      ? 'bg-[var(--badge-bg)] text-[var(--foreground)] hover:opacity-90'
                      : 'opacity-50 text-[var(--text-subtle)]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? 'bg-black text-white'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[var(--input-bg)] text-[var(--foreground)]'
                    }`}
                  >
                    {isPassed ? <Check size={14} /> : s.num}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-medium leading-tight">{s.title}</div>
                    <div className="text-[10px] opacity-75">{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* ÉTAPE 1 : CHOISIR UNE SOURCE DE CONTENU                                    */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <BookOpen size={18} className="text-[var(--accent)]" />
                    Étape 1 — Sélectionner le contenu source dans Kanto
                  </h2>
                  <p className="text-xs text-[var(--text-subtle)] mt-1">
                    Les informations vérifiées (titre, période, images, symbolisme, biographies) seront automatiquement extraites.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedSource(null);
                    setSelectedSourceType('FREE_FORM');
                    setStep(2);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--card-border)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] flex items-center gap-2"
                >
                  <FileQuestion size={14} />
                  Créer une question libre (sans source liée)
                </button>
              </div>

              {/* Onglets des catégories de patrimoine */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {SOURCE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedSourceType === cat.type;
                  return (
                    <button
                      key={cat.type}
                      onClick={() => {
                        setSelectedSourceType(cat.type);
                        setSelectedSource(null);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--badge-bg)] text-[var(--accent)] font-semibold'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--foreground)] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-xs leading-tight">{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Barre de recherche dans les sources */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-subtle)]" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, époque, motif, province..."
                  value={searchSource}
                  onChange={(e) => {
                    setSearchSource(e.target.value);
                    loadSources(selectedSourceType, e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Grille des contenus disponibles */}
              {isLoadingSources ? (
                <div className="py-16 text-center text-xs text-[var(--text-subtle)]">
                  Chargement des éléments patrimoniaux...
                </div>
              ) : sources.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-subtle)] border border-dashed rounded-xl border-[var(--card-border)]">
                  Aucun élément trouvé pour cette catégorie ou recherche.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
                  {sources.map((item) => {
                    const isSelected = selectedSource?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedSource(item)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--badge-bg)] shadow-sm'
                            : 'border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent)]/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-12 h-12 rounded-lg object-cover border border-[var(--card-border)] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[var(--card-bg)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                              <Landmark size={20} />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-[var(--foreground)] truncate">
                              {item.title}
                            </div>
                            {item.period && (
                              <div className="text-[10px] text-[var(--accent)] font-medium">
                                {item.period}
                              </div>
                            )}
                            <p className="text-[11px] text-[var(--text-subtle)] line-clamp-2 mt-0.5 leading-snug">
                              {item.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)] text-[10px] text-[var(--text-subtle)]">
                          <span className="truncate">{item.sourceRef}</span>
                          {isSelected && (
                            <span className="text-[var(--accent)] font-bold flex items-center gap-1">
                              <Check size={12} /> Choisi
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bouton Suivant */}
              <div className="flex justify-end pt-4 border-t border-[var(--card-border)]">
                <button
                  disabled={!selectedSource}
                  onClick={() => {
                    if (selectedSource) {
                      setFormData((prev) => ({
                        ...prev,
                        sourceReference: selectedSource.sourceRef || '',
                        historicalPeriod: selectedSource.period || '',
                        imageUrl: selectedSource.imageUrl || '',
                      }));
                      setStep(2);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--sidebar-accent)] text-black hover:opacity-95 disabled:opacity-40 flex items-center gap-2"
                >
                  Continuer vers le Choix du Format
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* ÉTAPE 2 : CHOISIR LE FORMAT DE L'EXERCICE                                  */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Compass size={18} className="text-[var(--accent)]" />
                  Étape 2 — Choisir le format pédagogique du jeu
                </h2>
                <p className="text-xs text-[var(--text-subtle)] mt-1">
                  Chaque format offre une expérience distincte : mémorisation rapide, esprit critique ou reconnaissance visuelle.
                </p>
              </div>

              {selectedSource && (
                <div className="p-3.5 rounded-xl bg-[var(--badge-bg)] border border-[var(--accent)]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedSource.imageUrl && (
                      <img
                        src={selectedSource.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="text-xs font-bold text-[var(--foreground)]">
                        Source : {selectedSource.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-subtle)]">
                        {selectedSource.categoryName} {selectedSource.period ? `• ${selectedSource.period}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-[11px] text-[var(--accent)] underline"
                  >
                    Changer de source
                  </button>
                </div>
              )}

              {/* Grille des formats disponibles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    format: 'SINGLE_CHOICE' as GameQuestionFormat,
                    title: 'Quiz à Choix Unique (QCM)',
                    badge: '4 propositions',
                    desc: 'Une question précise, 4 choix distincts, une seule réponse correcte et une explication pédagogique complète.',
                    icon: HelpCircle,
                    color: 'text-amber-500',
                  },
                  {
                    format: 'TRUE_FALSE' as GameQuestionFormat,
                    title: 'Vrai ou Faux (Marina sa Diso)',
                    badge: 'Binaire & Éducatif',
                    desc: 'Une affirmation vérifiable à évaluer. Inclut une explication détaillée selon le choix du joueur pour déconstruire les fausses croyances.',
                    icon: CheckCircle2,
                    color: 'text-emerald-500',
                  },
                  {
                    format: 'IMAGE_IDENTIFICATION' as GameQuestionFormat,
                    title: 'Reconnaissance d\'Image',
                    badge: 'Visuel & Archives',
                    desc: 'Identifier un monument, un portrait, un blason de province ou un billet malgache à partir d\'un document visuel d\'archive.',
                    icon: ImageIcon,
                    color: 'text-blue-500',
                  },
                  {
                    format: 'RIDDLE' as GameQuestionFormat,
                    title: 'Devinette Malgache (Ankamantatra)',
                    badge: 'Tradition Ntaolo',
                    desc: 'Énoncé en malgache, indice textuel, solution canonique et variantes linguistiques acceptées (avec normalisation d\'articles « ny »).',
                    icon: ScrollText,
                    color: 'text-purple-500',
                  },
                ].map((f) => {
                  const Icon = f.icon;
                  const isSelected = formData.format === f.format;
                  return (
                    <div
                      key={f.format}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, format: f.format }));
                      }}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--badge-bg)] shadow-md ring-1 ring-[var(--accent)]'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl bg-[var(--card-bg)] ${f.color}`}>
                          <Icon size={22} />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[var(--card-bg)] text-[var(--text-subtle)]">
                          {f.badge}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--foreground)]">
                          {f.title}
                        </div>
                        <p className="text-xs text-[var(--text-subtle)] mt-1 leading-relaxed">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--card-border)] text-[var(--foreground)] flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Retour
                </button>
                <button
                  onClick={async () => {
                    setStep(3);
                    if (selectedSource) {
                      await handleGenerateSuggestions(formData.format);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--sidebar-accent)] text-black hover:opacity-95 flex items-center gap-2"
                >
                  Générer & Rédiger la Question
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* ÉTAPE 3 : GÉNÉRATION & RÉDACTION                                           */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    <Sparkles size={18} className="text-[var(--accent)]" />
                    Étape 3 — Rédiger et peaufiner la question
                  </h2>
                  <p className="text-xs text-[var(--text-subtle)] mt-1">
                    Ajustez l'énoncé, vérifiez les propositions et enrichissez les explications bilingues.
                  </p>
                </div>

                {selectedSource && (
                  <button
                    disabled={isGenerating}
                    onClick={() => handleGenerateSuggestions()}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--badge-bg)] border border-[var(--accent)]/40 text-[var(--accent)] hover:opacity-95 flex items-center gap-2"
                  >
                    <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                    {isGenerating ? 'Génération...' : 'Suggérer une autre variante'}
                  </button>
                )}
              </div>

              {/* Ligne Catégorie & Difficulté & Niveau */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                    Catégorie Thématique
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                    Niveau de Difficulté
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                  >
                    <option value="EASY">Découverte (Facile)</option>
                    <option value="MEDIUM">Intermédiaire (Moyen)</option>
                    <option value="HARD">Avancé (Expert)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                    Palier / Niveau (1 à 10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.levelNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, levelNumber: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Énoncé de la question */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                    Énoncé Principal de la Question *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.prompt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                    placeholder="Ex: Quel dirigeant a présidé Madagascar durant la Première République ?"
                    className="w-full p-3 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                      Énoncé en Malgache (optionnel bilingue)
                    </label>
                    <input
                      type="text"
                      value={formData.promptMg}
                      onChange={(e) => setFormData((prev) => ({ ...prev, promptMg: e.target.value }))}
                      placeholder="Fanontaniana amin'ny teny malagasy..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                      Période Historique / Date
                    </label>
                    <input
                      type="text"
                      value={formData.historicalPeriod}
                      onChange={(e) => setFormData((prev) => ({ ...prev, historicalPeriod: e.target.value }))}
                      placeholder="Ex: 1960-1972, Époque royale, 1947..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>

              {/* Champs selon le format choisi */}
              {(formData.format === 'SINGLE_CHOICE' || formData.format === 'IMAGE_IDENTIFICATION') && (
                <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--foreground)]">
                      4 Propositions de Réponse (Cocher la bonne réponse) *
                    </label>
                    <span className="text-[10px] text-[var(--text-subtle)]">
                      Une seule réponse doit être vraie
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.choices.map((choice, idx) => {
                      const isCorrect = formData.answerIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-[var(--card-border)] bg-[var(--input-bg)]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="correctChoice"
                            checked={isCorrect}
                            onChange={() => setFormData((prev) => ({ ...prev, answerIndex: idx }))}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) => {
                              const newChoices = [...formData.choices];
                              newChoices[idx] = e.target.value;
                              setFormData((prev) => ({ ...prev, choices: newChoices }));
                            }}
                            placeholder={`Choix ${idx + 1}`}
                            className="flex-1 bg-transparent text-xs text-[var(--foreground)] focus:outline-none"
                          />
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-500 px-1.5 py-0.5 rounded bg-emerald-500/20">
                              Bonne réponse
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.format === 'TRUE_FALSE' && (
                <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Vérité de l'affirmation *
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isTrue: true }))}
                      className={`flex-1 p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                        formData.isTrue
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] opacity-60'
                      }`}
                    >
                      <CheckCircle2 size={16} />
                      VRAI (Marina)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isTrue: false }))}
                      className={`flex-1 p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 ${
                        !formData.isTrue
                          ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] opacity-60'
                      }`}
                    >
                      <XCircle size={16} />
                      FAUX (Diso)
                    </button>
                  </div>
                </div>
              )}

              {formData.format === 'RIDDLE' && (
                <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                        Réponse Canonique Attendue *
                      </label>
                      <input
                        type="text"
                        value={formData.correctAnswer}
                        onChange={(e) => setFormData((prev) => ({ ...prev, correctAnswer: e.target.value }))}
                        placeholder="Ex: Tany, Vato, Vorona..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                        Indice Pédagogique (Clue)
                      </label>
                      <input
                        type="text"
                        value={formData.clue}
                        onChange={(e) => setFormData((prev) => ({ ...prev, clue: e.target.value }))}
                        placeholder="Ex: Hita any an-tsaha..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image & Média d'accompagnement */}
              <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                    <ImageIcon size={15} className="text-[var(--accent)]" />
                    Image ou Document Visuel (Facultatif ou pour reconnaissance)
                  </label>
                  <span className="text-[10px] text-amber-500 font-medium">
                    ⚠️ L'image ne doit pas révéler directement la réponse
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-2">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                      placeholder="URL de l'image (Cloudinary, /images/...)"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                    />
                    <input
                      type="text"
                      value={formData.imageAlt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imageAlt: e.target.value }))}
                      placeholder="Texte alternatif d'accessibilité (ex: Portrait d'archive d'un président)"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                    />
                  </div>
                  {formData.imageUrl && (
                    <div className="w-full h-20 rounded-xl overflow-hidden border border-[var(--card-border)] bg-black/10 flex items-center justify-center">
                      <img
                        src={formData.imageUrl}
                        alt="Aperçu"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Explication & Source de référence */}
              <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                    Explication Pédagogique (affichée après validation) *
                  </label>
                  <textarea
                    rows={3}
                    value={formData.explanation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Expliquez brièvement le contexte historique, culturel ou civique de la bonne réponse..."
                    className="w-full p-3 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-subtle)] mb-1">
                    Source Documentaire / Référence Vérifiable
                  </label>
                  <input
                    type="text"
                    value={formData.sourceReference}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sourceReference: e.target.value }))}
                    placeholder="Ex: Constitution de Madagascar, Archives BFM, Ouvrage d'histoire..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)]"
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--card-border)] text-[var(--foreground)] flex items-center gap-2"
                >
                  <ChevronLeft size={16} />
                  Retour
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--sidebar-accent)] text-black hover:opacity-95 flex items-center gap-2"
                >
                  Contrôle Qualité & Prévisualisation
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* ÉTAPE 4 : CONTRÔLE QUALITÉ & PRÉVISUALISATION MOBILE                        */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Colonne gauche : Checklist de Contrôle Qualité Éditorial */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    Contrôle Qualité Éditorial & Conformité
                  </h3>
                  <p className="text-xs text-[var(--text-subtle)] mt-1">
                    Chaque question publiée doit respecter les critères de rigueur historique et culturelle de Kanto.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {qualityChecks.map((check, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                        check.passed
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : check.critical
                          ? 'border-rose-500/40 bg-rose-500/5'
                          : 'border-amber-500/40 bg-amber-500/5'
                      }`}
                    >
                      <div className="mt-0.5">
                        {check.passed ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : check.critical ? (
                          <XCircle size={16} className="text-rose-500" />
                        ) : (
                          <AlertTriangle size={16} className="text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-[var(--foreground)] flex items-center justify-between">
                          <span>{check.label}</span>
                          {check.critical && !check.passed && (
                            <span className="text-[10px] text-rose-500 font-bold">Bloquant</span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                          {check.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-xs text-[var(--text-subtle)] space-y-1">
                  <div className="font-semibold text-[var(--foreground)]">Fiche d'affectation :</div>
                  <div>• Format : <span className="font-mono text-[var(--accent)]">{formData.format}</span></div>
                  <div>• Catégorie : <span className="font-mono">{formData.category}</span></div>
                  <div>• Difficulté : <span className="font-mono">{formData.difficulty}</span> (Niveau {formData.levelNumber})</div>
                  {selectedSource && <div>• Source liée : {selectedSource.title}</div>}
                </div>

                {/* Actions de validation */}
                <div className="pt-3 border-t border-[var(--card-border)] space-y-2">
                  <button
                    disabled={!canPublish || isPublishing}
                    onClick={() => handlePublish('PUBLISHED')}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-[var(--sidebar-accent)] text-black hover:opacity-95 disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send size={15} />
                    {isPublishing ? 'Enregistrement...' : 'Valider & Publier la Question'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePublish('DRAFT')}
                      disabled={isPublishing}
                      className="flex-1 py-2 rounded-xl text-xs font-medium border border-[var(--card-border)] hover:bg-[var(--hover-bg)] text-[var(--foreground)] flex items-center justify-center gap-1.5"
                    >
                      <Save size={14} />
                      Enregistrer comme brouillon
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-4 py-2 rounded-xl text-xs font-medium border border-[var(--card-border)] text-[var(--foreground)]"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite : Simulateur Mobile Kanto Fidèle */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Smartphone size={16} className="text-[var(--accent)]" />
                  Rendu Mobile Joueur Kanto
                </span>
                <div className="flex gap-1 p-1 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)]">
                  <button
                    onClick={() => setMobilePreviewTheme('dark')}
                    className={`px-2 py-0.5 text-[10px] rounded font-medium ${
                      mobilePreviewTheme === 'dark' ? 'bg-black text-white' : 'text-[var(--text-subtle)]'
                    }`}
                  >
                    Sombre
                  </button>
                  <button
                    onClick={() => setMobilePreviewTheme('light')}
                    className={`px-2 py-0.5 text-[10px] rounded font-medium ${
                      mobilePreviewTheme === 'light' ? 'bg-white text-black shadow-xs' : 'text-[var(--text-subtle)]'
                    }`}
                  >
                    Clair
                  </button>
                </div>
              </div>

              {/* Coque de téléphone mobile */}
              <div
                className={`w-full max-w-[340px] mx-auto rounded-[32px] p-4 border-[6px] shadow-2xl transition-all ${
                  mobilePreviewTheme === 'dark'
                    ? 'bg-[#0D0D0B] border-[#22221E] text-[#F0F0EC]'
                    : 'bg-[#F5F4F0] border-[#E2DFD8] text-[#1A1A1A]'
                }`}
              >
                {/* Barre de statut mobile */}
                <div className="flex justify-between items-center text-[10px] opacity-60 mb-3 px-2">
                  <span>09:41</span>
                  <span>5G • 100%</span>
                </div>

                {/* En-tête de jeu */}
                <div className="flex justify-between items-center mb-3 text-xs font-medium px-1">
                  <span className="text-[var(--accent)]">Niveau {formData.levelNumber}</span>
                  <span className="opacity-70">Question 1/10</span>
                </div>

                {/* Image si présente */}
                {formData.imageUrl && (
                  <div className="w-full h-36 rounded-2xl overflow-hidden mb-3 border border-white/10 bg-black/20">
                    <img
                      src={formData.imageUrl}
                      alt={formData.imageAlt || ''}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Carte de la Question */}
                <div
                  className={`p-4 rounded-2xl mb-4 border ${
                    mobilePreviewTheme === 'dark'
                      ? 'bg-[#181816] border-[#2B2B26]'
                      : 'bg-white border-[#E5E3DC]'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider mb-1">
                    {formData.category}
                  </div>
                  <div className="text-xs font-bold leading-snug">
                    {formData.prompt || 'Votre question apparaîtra ici...'}
                  </div>
                  {formData.promptMg && (
                    <div className="text-[11px] opacity-75 italic mt-1 leading-snug">
                      {formData.promptMg}
                    </div>
                  )}
                </div>

                {/* Réponses interactives du joueur */}
                {(formData.format === 'SINGLE_CHOICE' || formData.format === 'IMAGE_IDENTIFICATION') && (
                  <div className="space-y-2 mb-4">
                    {formData.choices.map((choice, i) => {
                      const isCorrect = formData.answerIndex === i;
                      return (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl text-xs border flex items-center justify-between font-medium ${
                            mobilePreviewTheme === 'dark'
                              ? 'bg-[#141412] border-[#262622]'
                              : 'bg-white border-[#E0DED7]'
                          }`}
                        >
                          <span>{choice || `Option ${i + 1}`}</span>
                          <span className="w-4 h-4 rounded-full border border-current opacity-40" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {formData.format === 'TRUE_FALSE' && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-center font-bold text-xs">
                      Marina (Vrai)
                    </div>
                    <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-center font-bold text-xs">
                      Diso (Faux)
                    </div>
                  </div>
                )}

                {formData.format === 'RIDDLE' && (
                  <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 mb-4">
                    <div className="text-[10px] text-purple-300 font-bold mb-1">Valider par écrit :</div>
                    <div className="text-xs p-2 rounded bg-black/20 text-white font-mono">
                      {formData.correctAnswer || 'Réponse attendue...'}
                    </div>
                  </div>
                )}

                {/* Boîte d'explication pédagogique post-réponse */}
                {formData.explanation && (
                  <div
                    className={`p-3 rounded-xl text-[10px] border leading-relaxed ${
                      mobilePreviewTheme === 'dark'
                        ? 'bg-[#1B1B18] border-amber-500/20 text-amber-200/90'
                        : 'bg-amber-50/80 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1 mb-0.5 text-amber-500">
                      <Info size={11} /> Explication pédagogique :
                    </div>
                    {formData.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
