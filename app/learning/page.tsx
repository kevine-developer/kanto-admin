'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmModal, Modal } from '@/components/ui';
import { learningService } from '@/services/learning.service';
import type {
  AdminLearningTrack,
  AdminLearningLesson,
  AdminLearningSection,
  LessonType,
} from '@/types/learning';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Volume2,
  HelpCircle,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Layers,
  VolumeX,
  Lightbulb,
} from 'lucide-react';

interface QuizFormData {
  question: string;
  questionMg: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

interface PhoneticFormData {
  letterOrSound: string;
  phonetic: string;
  frenchEquivalent: string;
  sampleWordMg: string;
  sampleTranslationFr: string;
}

interface VocabFormData {
  termMg: string;
  meaningFr: string;
  phonetic: string;
  explanation: string;
}

export default function LearningAdminPage() {
  const [tracks, setTracks] = useState<AdminLearningTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modale édition / création leçon
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminLearningLesson | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'phonetics' | 'vocab' | 'quiz'>('general');
  const [isSaving, setIsSaving] = useState(false);

  // Formulaire de leçon
  const [formTitle, setFormTitle] = useState('');
  const [formTitleMg, setFormTitleMg] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formSummaryMg, setFormSummaryMg] = useState('');
  const [formType, setFormType] = useState<LessonType>('VOCABULARY');
  const [formDuration, setFormDuration] = useState<number>(5);
  const [formOrderIndex, setFormOrderIndex] = useState<number>(1);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formAudioEnabled, setFormAudioEnabled] = useState<boolean>(true);
  const [isTogglingAllAudio, setIsTogglingAllAudio] = useState<boolean>(false);
  const [formIntroFr, setFormIntroFr] = useState('');
  const [formIntroMg, setFormIntroMg] = useState('');
  const [formDidYouKnowFr, setFormDidYouKnowFr] = useState('');
  const [formDidYouKnowMg, setFormDidYouKnowMg] = useState('');

  // Phonétiques
  const [phoneticsList, setPhoneticsList] = useState<PhoneticFormData[]>([]);
  // Vocabulaire
  const [vocabList, setVocabList] = useState<VocabFormData[]>([]);
  // 5 Micro-Quiz obligatoires pour la validation (seuil de réussite ≥ 60%)
  const [quizList, setQuizList] = useState<QuizFormData[]>([
    { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
    { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
    { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
    { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
    { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
  ]);

  // Modale de confirmation de suppression
  const [deletingLesson, setDeletingLesson] = useState<AdminLearningLesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await learningService.getTracks();
      setTracks(data);
      if (data.length > 0 && !selectedTrackId) {
        setSelectedTrackId(data[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des parcours');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedTrack = useMemo(() => {
    return tracks.find((t) => t.id === selectedTrackId) || tracks[0];
  }, [tracks, selectedTrackId]);

  const lessons = useMemo(() => {
    return selectedTrack?.lessons || [];
  }, [selectedTrack]);

  const handleOpenCreateLesson = () => {
    setEditingLesson(null);
    setFormTitle('');
    setFormTitleMg('');
    setFormSlug('');
    setFormSummary('');
    setFormSummaryMg('');
    setFormType('VOCABULARY');
    setFormDuration(5);
    setFormOrderIndex(lessons.length + 1);
    setFormIsPublished(true);
    setFormAudioEnabled(true);
    setFormIntroFr('');
    setFormIntroMg('');
    setFormDidYouKnowFr('');
    setFormDidYouKnowMg('');
    setPhoneticsList([
      { letterOrSound: 'O', phonetic: 'ou', frenchEquivalent: 'Se prononce toujours comme « ou » dans « loup »', sampleWordMg: 'Soa', sampleTranslationFr: 'Bien' },
    ]);
    setVocabList([
      { termMg: '', meaningFr: '', phonetic: '', explanation: '' },
    ]);
    setQuizList([
      { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
      { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
      { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
      { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
      { question: '', questionMg: '', choices: ['', '', '', ''], correctIndex: 0, explanation: '' },
    ]);
    setActiveModalTab('general');
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: AdminLearningLesson) => {
    setEditingLesson(lesson);
    setFormTitle(lesson.title);
    setFormTitleMg(lesson.titleMg || lesson.title);
    setFormSlug(lesson.slug);
    setFormSummary(lesson.summary || '');
    setFormSummaryMg(lesson.summaryMg || '');
    setFormType(lesson.type);
    setFormDuration(lesson.durationMinutes || 5);
    setFormOrderIndex(lesson.orderIndex || 1);
    setFormIsPublished(lesson.isPublished);

    // Extraction des sections existantes
    const rawSections: AdminLearningSection[] = Array.isArray(lesson.sections)
      ? lesson.sections
      : typeof lesson.sections === 'string'
      ? JSON.parse(lesson.sections)
      : [];

    let introFr = '';
    let introMg = '';
    let didYouKnowFr = '';
    let didYouKnowMg = '';
    let isAudioActive = lesson.audioEnabled !== false;
    const extractedPhonetics: PhoneticFormData[] = [];
    const extractedVocab: VocabFormData[] = [];
    const extractedQuizzes: QuizFormData[] = [];

    rawSections.forEach((s) => {
      if (s.type === 'config') {
        if (s.audioEnabled !== undefined) {
          isAudioActive = s.audioEnabled;
        }
      } else if (s.type === 'intro') {
        introFr = s.textFr || '';
        introMg = s.textMg || '';
      } else if (s.type === 'phonetic') {
        extractedPhonetics.push({
          letterOrSound: s.letterOrSound || s.termMg || '',
          phonetic: s.phonetic || '',
          frenchEquivalent: s.frenchEquivalent || s.explanation || '',
          sampleWordMg: s.sampleWordMg || s.termMg || '',
          sampleTranslationFr: s.sampleTranslationFr || s.meaningFr || '',
        });
      } else if (s.type === 'concept') {
        extractedVocab.push({
          termMg: s.termMg || '',
          meaningFr: s.meaningFr || '',
          phonetic: s.phonetic || '',
          explanation: s.explanation || '',
        });
      } else if (s.type === 'didYouKnow') {
        didYouKnowFr = s.textFr || '';
        didYouKnowMg = s.textMg || '';
      } else if (s.type === 'quiz') {
        const choices = s.choices || ['', '', '', ''];
        extractedQuizzes.push({
          question: s.question || '',
          questionMg: s.questionMg || '',
          choices: [choices[0] || '', choices[1] || '', choices[2] || '', choices[3] || ''],
          correctIndex: s.correctIndex ?? 0,
          explanation: s.explanation || '',
        });
      }
    });

    setFormAudioEnabled(isAudioActive);
    setFormIntroFr(introFr);
    setFormIntroMg(introMg);
    setFormDidYouKnowFr(didYouKnowFr);
    setFormDidYouKnowMg(didYouKnowMg);
    setPhoneticsList(extractedPhonetics.length > 0 ? extractedPhonetics : [
      { letterOrSound: 'O', phonetic: 'ou', frenchEquivalent: 'Se prononce toujours comme « ou »', sampleWordMg: '', sampleTranslationFr: '' },
    ]);
    setVocabList(extractedVocab.length > 0 ? extractedVocab : [
      { termMg: '', meaningFr: '', phonetic: '', explanation: '' },
    ]);

    // Compléter à 5 quiz obligatoires si moins de 5
    while (extractedQuizzes.length < 5) {
      extractedQuizzes.push({
        question: '',
        questionMg: '',
        choices: ['', '', '', ''],
        correctIndex: 0,
        explanation: '',
      });
    }
    setQuizList(extractedQuizzes.slice(0, 5));
    setActiveModalTab('general');
    setIsLessonModalOpen(true);
  };

  const handleTogglePublish = async (lesson: AdminLearningLesson) => {
    try {
      await learningService.togglePublish(lesson.id);
      await loadData();
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  const areAllLessonsAudioEnabled = useMemo(() => {
    return lessons.length > 0 && lessons.every((l) => l.audioEnabled !== false);
  }, [lessons]);

  const handleToggleAllAudio = async (enable: boolean) => {
    setIsTogglingAllAudio(true);
    try {
      await learningService.toggleAllAudio(enable, selectedTrack?.id);
      await loadData();
    } catch (err: any) {
      alert(`Erreur bascule audio: ${err?.message}`);
    } finally {
      setIsTogglingAllAudio(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;
    setIsDeleting(true);
    try {
      await learningService.deleteLesson(deletingLesson.id);
      setDeletingLesson(null);
      await loadData();
    } catch (err: any) {
      alert(`Erreur suppression: ${err?.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!formTitle.trim() || !selectedTrack?.id) {
      alert('Veuillez renseigner le titre de la leçon');
      return;
    }

    setIsSaving(true);
    try {
      // Reconstituer les sections structurées
      const sections: AdminLearningSection[] = [];

      if (formIntroFr.trim() || formIntroMg.trim()) {
        sections.push({
          type: 'intro',
          textFr: formIntroFr.trim(),
          textMg: formIntroMg.trim(),
        });
      }

      phoneticsList.forEach((p) => {
        if (p.letterOrSound.trim()) {
          sections.push({
            type: 'phonetic',
            letterOrSound: p.letterOrSound.trim(),
            phonetic: p.phonetic.trim(),
            frenchEquivalent: p.frenchEquivalent.trim(),
            sampleWordMg: p.sampleWordMg.trim(),
            sampleTranslationFr: p.sampleTranslationFr.trim(),
          });
        }
      });

      vocabList.forEach((v) => {
        if (v.termMg.trim()) {
          sections.push({
            type: 'concept',
            termMg: v.termMg.trim(),
            meaningFr: v.meaningFr.trim(),
            phonetic: v.phonetic.trim(),
            explanation: v.explanation.trim(),
          });
        }
      });

      if (formDidYouKnowFr.trim() || formDidYouKnowMg.trim()) {
        sections.push({
          type: 'didYouKnow',
          textFr: formDidYouKnowFr.trim(),
          textMg: formDidYouKnowMg.trim(),
        });
      }

      // Injection de la configuration didactique (lecture vocale des prononciations)
      sections.unshift({
        type: 'config',
        audioEnabled: formAudioEnabled,
      });

      // Ajout des 5 micro-quiz de validation
      quizList.forEach((q) => {
        if (q.question.trim()) {
          sections.push({
            type: 'quiz',
            question: q.question.trim(),
            questionMg: q.questionMg.trim() || q.question.trim(),
            choices: q.choices.map((c) => c.trim()),
            correctIndex: q.correctIndex,
            explanation: q.explanation.trim(),
          });
        }
      });

      const payload = {
        trackId: selectedTrack.id,
        title: formTitle.trim(),
        titleMg: formTitleMg.trim() || formTitle.trim(),
        slug: formSlug.trim() || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        summary: formSummary.trim(),
        summaryMg: formSummaryMg.trim(),
        type: formType,
        durationMinutes: Number(formDuration) || 5,
        orderIndex: Number(formOrderIndex) || 1,
        isPublished: formIsPublished,
        audioEnabled: formAudioEnabled,
        sections,
      };

      if (editingLesson) {
        await learningService.updateLesson(editingLesson.id, payload);
      } else {
        await learningService.createLesson(payload);
      }

      setIsLessonModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Erreur enregistrement: ${err?.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* En-tête de page */}
        <PageHeader
          title="Parcours & Leçons Pédagogiques"
          description="Conception et gestion des modules didactiques, prononciation, vocabulaire et validation par micro-quiz"
          icon={GraduationCap}
          primaryAction={{
            label: 'Nouvelle Leçon',
            icon: <Plus className="w-4 h-4" />,
            onClick: handleOpenCreateLesson,
          }}
        />

        {/* ── 1. Sélecteur de Parcours (UX Tabs immersives) ── */}
        <div className="bg-white dark:bg-[#141412] p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#4A6741]" />
              <h2 className="font-semibold text-stone-900 dark:text-stone-100">
                Parcours d'Apprentissage
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {tracks.length} parcours configurés
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tracks.map((track) => {
              const isSelected = track.id === selectedTrackId;
              const levelBadgeColor =
                track.level === 'BEGINNER'
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : track.level === 'INTERMEDIATE'
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                  : 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400 border-purple-300 dark:border-purple-800';

              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`flex flex-col text-left p-3.5 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-[#4A6741] bg-[#4A6741]/5 dark:bg-[#4A6741]/10 ring-2 ring-[#4A6741]/20'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${levelBadgeColor}`}>
                      {track.level}
                    </span>
                    <span className="text-xs text-stone-500 flex items-center gap-1 font-medium">
                      <BookOpen className="w-3 h-3" />
                      {track.lessons?.length || track._count?.lessons || 0} leçons
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                    {track.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                    {track.titleMg}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Liste des Leçons du Parcours Actif ── */}
        <div className="bg-white dark:bg-[#141412] rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#4A6741]" />
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Leçons du parcours : <span className="text-[#4A6741]">{selectedTrack?.title}</span>
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleAllAudio(!areAllLessonsAudioEnabled)}
                disabled={isTogglingAllAudio || lessons.length === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                  areAllLessonsAudioEnabled
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100'
                }`}
                title={areAllLessonsAudioEnabled ? 'Désactiver les prononciations vocales sur toutes les leçons' : 'Activer les prononciations vocales sur toutes les leçons'}
              >
                {areAllLessonsAudioEnabled ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isTogglingAllAudio
                  ? 'Mise à jour...'
                  : areAllLessonsAudioEnabled
                  ? 'Désactiver toutes les lectures vocales'
                  : 'Activer toutes les lectures vocales'}
              </button>

              <button
                onClick={handleOpenCreateLesson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une leçon
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-stone-400 text-sm">
              Chargement des leçons pédagogiques...
            </div>
          ) : lessons.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Aucune leçon dans ce parcours
              </p>
              <button
                onClick={handleOpenCreateLesson}
                className="text-xs text-[#4A6741] hover:underline font-semibold"
              >
                Créer la première leçon
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {lessons.map((lesson, idx) => {
                // Compter les quiz dans les sections
                const rawSecs = Array.isArray(lesson.sections)
                  ? lesson.sections
                  : typeof lesson.sections === 'string'
                  ? JSON.parse(lesson.sections)
                  : [];
                const quizCount = rawSecs.filter((s: any) => s.type === 'quiz').length;

                return (
                  <div
                    key={lesson.id}
                    className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-900/30 transition-colors"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#4A6741]/10 text-[#4A6741] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {lesson.orderIndex || idx + 1}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                            {lesson.title}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                            {lesson.type}
                          </span>
                        </div>

                        <p className="text-xs text-stone-500 italic truncate">
                          {lesson.titleMg}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-stone-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.durationMinutes} min
                          </span>
                          <span className="flex items-center gap-1 text-[#4A6741] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {quizCount} Micro-Quiz
                          </span>
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              lesson.audioEnabled !== false
                                ? 'text-[#4A6741]'
                                : 'text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {lesson.audioEnabled !== false ? (
                              <>
                                <Volume2 className="w-3 h-3" />
                                Audio actif
                              </>
                            ) : (
                              <>
                                <VolumeX className="w-3 h-3" />
                                Audio désactivé
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions de pilotage rapide */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Statut publication */}
                      <button
                        onClick={() => handleTogglePublish(lesson)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                          lesson.isPublished
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700 hover:bg-stone-200'
                        }`}
                        title={lesson.isPublished ? 'Dépublier' : 'Publier'}
                      >
                        {lesson.isPublished ? (
                          <>
                            <Eye className="w-3 h-3" /> Publié
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Brouillon
                          </>
                        )}
                      </button>

                      {/* Éditer */}
                      <button
                        onClick={() => handleOpenEditLesson(lesson)}
                        className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
                        title="Modifier la leçon"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Supprimer */}
                      <button
                        onClick={() => setDeletingLesson(lesson)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                        title="Supprimer la leçon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 3. Modale Didactique d'Édition / Création de Leçon ── */}
        <Modal
          isOpen={isLessonModalOpen}
          onClose={() => setIsLessonModalOpen(false)}
          title={editingLesson ? 'Modifier la Leçon Pédagogique' : 'Nouvelle Leçon Pédagogique'}
          subtitle={selectedTrack?.title}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsLessonModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveLesson}
                disabled={isSaving}
                className="px-5 py-2 text-sm font-medium text-white bg-[#4A6741] hover:bg-[#3d5535] rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer la leçon'}
              </button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Navigation par onglets UX dans la modale */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 gap-1 pb-1">
              <button
                type="button"
                onClick={() => setActiveModalTab('general')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors ${
                  activeModalTab === 'general'
                    ? 'border-b-2 border-[#4A6741] text-[#4A6741] bg-[#4A6741]/5'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                1. Général & Cours
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('phonetics')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors flex items-center gap-1 ${
                  activeModalTab === 'phonetics'
                    ? 'border-b-2 border-[#4A6741] text-[#4A6741] bg-[#4A6741]/5'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                2. Prononciation ({phoneticsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('vocab')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors flex items-center gap-1 ${
                  activeModalTab === 'vocab'
                    ? 'border-b-2 border-[#4A6741] text-[#4A6741] bg-[#4A6741]/5'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                3. Vocabulaire ({vocabList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('quiz')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-md transition-colors flex items-center gap-1 ${
                  activeModalTab === 'quiz'
                    ? 'border-b-2 border-[#4A6741] text-[#4A6741] bg-[#4A6741]/5'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                4. Micro-Quiz (3 Questions)
              </button>
            </div>

            {/* ── ONGLET 1 : GÉNÉRAL & INTRO ── */}
            {activeModalTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Titre en français *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Ex: Salutations et politesse sacrée"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Titre en malgache *
                    </label>
                    <input
                      type="text"
                      value={formTitleMg}
                      onChange={(e) => setFormTitleMg(e.target.value)}
                      placeholder="Ex: Fiarahabana sy Fanajana"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Slug identifiant
                    </label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="salutations-et-politesse"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Type didactique
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as LessonType)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    >
                      <option value="VOCABULARY">Vocabulaire</option>
                      <option value="GRAMMAR">Grammaire</option>
                      <option value="CULTURE">Culture</option>
                      <option value="TRADITION">Tradition</option>
                      <option value="LITERATURE">Littérature</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Durée (minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Ordre d'étape
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formOrderIndex}
                      onChange={(e) => setFormOrderIndex(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </div>

                {/* Introduction de cours */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200 dark:border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#4A6741]" />
                    Texte d'introduction de la leçon
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <textarea
                      rows={3}
                      value={formIntroFr}
                      onChange={(e) => setFormIntroFr(e.target.value)}
                      placeholder="Introduction en français..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                    <textarea
                      rows={3}
                      value={formIntroMg}
                      onChange={(e) => setFormIntroMg(e.target.value)}
                      placeholder="Fampidirana amin'ny teny malagasy..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── ONGLET 2 : GUIDE DE PRONONCIATION ── */}
            {activeModalTab === 'phonetics' && (
              <div className="space-y-4">
                {/* Switch de désactivation / activation de la lecture vocale */}
                <div className="flex items-center justify-between p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-2.5">
                    {formAudioEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#4A6741]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-stone-400" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Lecture vocale des prononciations
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {formAudioEnabled
                          ? 'Actif : les apprenants peuvent écouter la prononciation des sons isolés et termes dans l’application.'
                          : 'Désactivé : toutes les lectures audio sont coupées pour cette leçon (mode silencieux).'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formAudioEnabled}
                      onChange={(e) => setFormAudioEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-300 dark:bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A6741]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-500">
                    Définissez les sons, diphtongues et sonorités spécifiques de cette leçon.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setPhoneticsList([
                        ...phoneticsList,
                        { letterOrSound: '', phonetic: '', frenchEquivalent: '', sampleWordMg: '', sampleTranslationFr: '' },
                      ])
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#4A6741] bg-[#4A6741]/10 hover:bg-[#4A6741]/20 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Ajouter un son
                  </button>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {phoneticsList.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200 dark:border-stone-800 space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4A6741]">
                          Son #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhoneticsList(phoneticsList.filter((_, i) => i !== idx))}
                          className="text-stone-400 hover:text-rose-500 text-xs"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Lettre/Son (ex: O, AO, TR)"
                          value={p.letterOrSound}
                          onChange={(e) => {
                            const updated = [...phoneticsList];
                            updated[idx].letterOrSound = e.target.value;
                            setPhoneticsList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Phonétique IPA (ex: ou, ow)"
                          value={p.phonetic}
                          onChange={(e) => {
                            const updated = [...phoneticsList];
                            updated[idx].phonetic = e.target.value;
                            setPhoneticsList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        />
                        <input
                          type="text"
                          placeholder="Mot exemple malgache (ex: Soa)"
                          value={p.sampleWordMg}
                          onChange={(e) => {
                            const updated = [...phoneticsList];
                            updated[idx].sampleWordMg = e.target.value;
                            setPhoneticsList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Équivalent français (ex: Se prononce comme « ou »)"
                          value={p.frenchEquivalent}
                          onChange={(e) => {
                            const updated = [...phoneticsList];
                            updated[idx].frenchEquivalent = e.target.value;
                            setPhoneticsList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        />
                        <input
                          type="text"
                          placeholder="Traduction de l'exemple (ex: Bien, bon)"
                          value={p.sampleTranslationFr}
                          onChange={(e) => {
                            const updated = [...phoneticsList];
                            updated[idx].sampleTranslationFr = e.target.value;
                            setPhoneticsList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ONGLET 3 : VOCABULAIRE & ANECDOTE ── */}
            {activeModalTab === 'vocab' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-500">
                    Termes clés enseignés et retenus pour la répétition espacée.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setVocabList([
                        ...vocabList,
                        { termMg: '', meaningFr: '', phonetic: '', explanation: '' },
                      ])
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#4A6741] bg-[#4A6741]/10 hover:bg-[#4A6741]/20 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Ajouter un mot
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {vocabList.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200 dark:border-stone-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4A6741]">
                          Terme #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVocabList(vocabList.filter((_, i) => i !== idx))}
                          className="text-stone-400 hover:text-rose-500 text-xs"
                        >
                          Supprimer
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Terme malgache (ex: Manao ahoana)"
                          value={v.termMg}
                          onChange={(e) => {
                            const updated = [...vocabList];
                            updated[idx].termMg = e.target.value;
                            setVocabList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Traduction française"
                          value={v.meaningFr}
                          onChange={(e) => {
                            const updated = [...vocabList];
                            updated[idx].meaningFr = e.target.value;
                            setVocabList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        />
                        <input
                          type="text"
                          placeholder="Phonétique (optionnel)"
                          value={v.phonetic}
                          onChange={(e) => {
                            const updated = [...vocabList];
                            updated[idx].phonetic = e.target.value;
                            setVocabList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Le saviez-vous ? bilingue */}
                <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200 dark:border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[#C58B38]" />
                    Le saviez-vous ? / Fahatsiarovana (Anecdote bilingue)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                        Version Malagasy (Fahatsiarovana)
                      </label>
                      <textarea
                        rows={2}
                        value={formDidYouKnowMg}
                        onChange={(e) => setFormDidYouKnowMg(e.target.value)}
                        placeholder="Fanehoana fahamaotinana sy fitandremana ny fihavanana..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                        Version Français (Le saviez-vous ?)
                      </label>
                      <textarea
                        rows={2}
                        value={formDidYouKnowFr}
                        onChange={(e) => setFormDidYouKnowFr(e.target.value)}
                        placeholder="Explication étymologique ou contexte culturel en français..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ONGLET 4 : 5 MICRO-QUIZ DE VALIDATION ── */}
            {activeModalTab === 'quiz' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-500 font-medium">
                    Configurez les <span className="text-[#4A6741] font-bold">5 questions</span> de micro-quiz obligatoires pour la validation de cette leçon (seuil d'admission : ≥ 60%, soit au moins 3/5).
                  </p>
                  <span className="text-xs font-bold text-[#4A6741] px-2 py-0.5 rounded bg-[#4A6741]/10">
                    5/5 questions
                  </span>
                </div>

                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {quizList.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-3.5 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200 dark:border-stone-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#4A6741] flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Question #{qIdx + 1}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Bonne réponse : Option {String.fromCharCode(65 + q.correctIndex)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Énoncé en français *"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...quizList];
                            updated[qIdx].question = e.target.value;
                            setQuizList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-medium"
                        />
                        <input
                          type="text"
                          placeholder="Énoncé en malgache"
                          value={q.questionMg}
                          onChange={(e) => {
                            const updated = [...quizList];
                            updated[qIdx].questionMg = e.target.value;
                            setQuizList(updated);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 italic"
                        />
                      </div>

                      {/* 4 Choix */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                          Choix de réponses (cochez le bouton radio pour définir la bonne réponse) :
                        </span>
                        {q.choices.map((choice, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`quiz_correct_${qIdx}`}
                              checked={q.correctIndex === cIdx}
                              onChange={() => {
                                const updated = [...quizList];
                                updated[qIdx].correctIndex = cIdx;
                                setQuizList(updated);
                              }}
                              className="w-3.5 h-3.5 text-[#4A6741] accent-[#4A6741]"
                            />
                            <span className="text-xs font-bold text-stone-400 w-4">
                              {String.fromCharCode(65 + cIdx)}.
                            </span>
                            <input
                              type="text"
                              placeholder={`Option ${String.fromCharCode(65 + cIdx)}`}
                              value={choice}
                              onChange={(e) => {
                                const updated = [...quizList];
                                const newChoices = [...updated[qIdx].choices] as [string, string, string, string];
                                newChoices[cIdx] = e.target.value;
                                updated[qIdx].choices = newChoices;
                                setQuizList(updated);
                              }}
                              className={`flex-1 px-2 py-1 text-xs rounded border ${
                                q.correctIndex === cIdx
                                  ? 'border-[#4A6741] bg-[#4A6741]/5 font-semibold text-[#4A6741]'
                                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explication didactique */}
                      <div>
                        <input
                          type="text"
                          placeholder="Explication affichée après la validation..."
                          value={q.explanation}
                          onChange={(e) => {
                            const updated = [...quizList];
                            updated[qIdx].explanation = e.target.value;
                            setQuizList(updated);
                          }}
                          className="w-full px-2.5 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 italic"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Modale de Confirmation de Suppression */}
        <ConfirmModal
          isOpen={Boolean(deletingLesson)}
          onClose={() => setDeletingLesson(null)}
          onConfirm={handleDeleteLesson}
          title="Supprimer la leçon ?"
          description={`Êtes-vous sûr de vouloir supprimer définitivement la leçon « ${deletingLesson?.title} » ? Cette action est irréversible.`}
          confirmText="Supprimer"
          isLoading={isDeleting}
          variant="danger"
        />
      </div>
    </AdminShell>
  );
}
