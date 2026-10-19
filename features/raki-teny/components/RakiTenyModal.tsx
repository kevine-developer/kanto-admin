'use client';

import React, { useState, useEffect } from 'react';
import { RakiTenyWord, RakiTenyFormData, WordRarity } from '@/types/raki-teny';
import { Modal, Field } from '@/components/ui';
import { Sparkles } from 'lucide-react';

interface RakiTenyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RakiTenyFormData, id?: string | null) => Promise<void>;
  wordToEdit?: RakiTenyWord | null;
}

const RARITY_PRESETS: Record<
  WordRarity,
  { labelFr: string; labelMg: string; description: string }
> = {
  POETIC: {
    labelFr: 'Poétique & Évocateur',
    labelMg: 'Haisoratra & Kanto',
    description: 'Usage dans les poèmes, chants traditionnels ou prose lyrique.',
  },
  VERY_RARE: {
    labelFr: 'Très Rare',
    labelMg: 'Tena Vitsy Mpampiasa',
    description: 'Mot peu connu du grand public, d’un raffinement exceptionnel.',
  },
  ARCHAIC: {
    labelFr: 'Ancien & Mystique',
    labelMg: 'Teny Tranainy',
    description: 'Terme ancestral, rituels Ntaolo ou coutumes d’autrefois.',
  },
  LITERAL: {
    labelFr: 'Littéraire & Puissant',
    labelMg: 'Haisoratra Mahitsy',
    description: 'Discours solennels, kabary ou textes classiques malgaches.',
  },
  PROVERBIAL: {
    labelFr: 'Proverbial & Historique',
    labelMg: 'Fomba Fiteny Manan-tantara',
    description: 'Directement lié à la philosophie des proverbes ancestraux.',
  },
};

const CATEGORIES = [
  { id: 'nature_temps', labelFr: 'Nature & Temps', labelMg: 'Natiora & Fotoana' },
  { id: 'art_musique', labelFr: 'Art & Parole', labelMg: 'Kanto & Haivolana' },
  { id: 'societe_force', labelFr: 'Société & Union', labelMg: 'Fiarahamonina & Hery' },
  { id: 'destin_croyance', labelFr: 'Croyances & Destin', labelMg: 'Finoana & Vintana' },
  { id: 'emotions', labelFr: 'Émotions & Cœur', labelMg: 'Fihetseham-po & Fo' },
  { id: 'spiritualite', labelFr: 'Sagesse & Esprit', labelMg: 'Fahendrena & Fanahy' },
  { id: 'justice_societe', labelFr: 'Justice & Ordre', labelMg: 'Fahamarinana & Rariny' },
  { id: 'communication', labelFr: 'Communication & Liens', labelMg: 'Resaka & Fifandraisana' },
  { id: 'comportement', labelFr: 'Mœurs & Éthique', labelMg: 'Fahalalam-pomba & Toetra' },
];

export function RakiTenyModal({
  isOpen,
  onClose,
  onSave,
  wordToEdit,
}: RakiTenyModalProps) {
  const isEdit = !!wordToEdit;

  const [formData, setFormData] = useState<RakiTenyFormData>({
    word: '',
    phonetic: '',
    category: 'nature_temps',
    wordClassMg: '',
    wordClassFr: '',
    rarity: 'VERY_RARE',
    rarityLabelMg: 'Tena Vitsy Mpampiasa',
    rarityLabelFr: 'Très Rare',
    meaningMg: '',
    meaningFr: '',
    exampleMg: '',
    exampleFr: '',
    contextUsage: '',
    etymology: '',
    isFeatured: false,
    status: 'PUBLISHED',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wordToEdit) {
      setFormData({
        word: wordToEdit.word,
        phonetic: wordToEdit.phonetic || '',
        category: wordToEdit.category,
        wordClassMg: wordToEdit.wordClassMg,
        wordClassFr: wordToEdit.wordClassFr,
        rarity: wordToEdit.rarity,
        rarityLabelMg: wordToEdit.rarityLabelMg,
        rarityLabelFr: wordToEdit.rarityLabelFr,
        meaningMg: wordToEdit.meaningMg,
        meaningFr: wordToEdit.meaningFr,
        exampleMg: wordToEdit.exampleMg,
        exampleFr: wordToEdit.exampleFr,
        contextUsage: wordToEdit.contextUsage,
        etymology: wordToEdit.etymology || '',
        isFeatured: wordToEdit.isFeatured,
        status: wordToEdit.status,
      });
    } else {
      setFormData({
        word: '',
        phonetic: '',
        category: 'nature_temps',
        wordClassMg: 'Anarana',
        wordClassFr: 'Nom masculin',
        rarity: 'VERY_RARE',
        rarityLabelMg: RARITY_PRESETS.VERY_RARE.labelMg,
        rarityLabelFr: RARITY_PRESETS.VERY_RARE.labelFr,
        meaningMg: '',
        meaningFr: '',
        exampleMg: '',
        exampleFr: '',
        contextUsage: '',
        etymology: '',
        isFeatured: false,
        status: 'PUBLISHED',
      });
    }
    setError(null);
  }, [wordToEdit, isOpen]);

  const handleRarityChange = (newRarity: WordRarity) => {
    const preset = RARITY_PRESETS[newRarity];
    setFormData((prev) => ({
      ...prev,
      rarity: newRarity,
      rarityLabelFr: preset.labelFr,
      rarityLabelMg: preset.labelMg,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.word.trim()) {
      setError('Le mot malgache est obligatoire.');
      return;
    }
    if (!formData.meaningMg.trim() || !formData.meaningFr.trim()) {
      setError('Les définitions malgache et française sont obligatoires.');
      return;
    }
    if (!formData.exampleMg.trim() || !formData.exampleFr.trim()) {
      setError("Les exemples d'utilisation sont obligatoires.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(formData, wordToEdit?.id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit
          ? `Modifier le mot « ${wordToEdit?.word} »`
          : 'Ajouter un Mot Rare au Dictionnaire'
      }
      subtitle="Raki-teny Miafina — Enrichissement du trésor lexical malgache"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-xs bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 rounded-xl">
            {error}
          </div>
        )}

        {/* 1. Ligne Principale : Mot, Phonétique, Catégorie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Mot malgache" required>
            <input
              type="text"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              placeholder="Ex: Somambisamby"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </Field>

          <Field label="Phonétique (aide prononciation)">
            <input
              type="text"
              value={formData.phonetic || ''}
              onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
              placeholder="Ex: sou-mam-bi-sam-by"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </Field>

          <Field label="Catégorie thématique">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.labelFr} ({cat.labelMg})
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* 2. Classe grammaticale & Degré de rareté */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Classe grammaticale (MG)" required>
            <input
              type="text"
              value={formData.wordClassMg}
              onChange={(e) => setFormData({ ...formData, wordClassMg: e.target.value })}
              placeholder="Ex: Mpamari-toetra / Anarana"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </Field>

          <Field label="Classe grammaticale (FR)" required>
            <input
              type="text"
              value={formData.wordClassFr}
              onChange={(e) => setFormData({ ...formData, wordClassFr: e.target.value })}
              placeholder="Ex: Adjectif / Nom"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </Field>

          <Field label="Niveau de Rareté" required>
            <select
              value={formData.rarity}
              onChange={(e) => handleRarityChange(e.target.value as WordRarity)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] font-semibold"
            >
              <option value="VERY_RARE">Très Rare (Tena Vitsy)</option>
              <option value="POETIC">Poétique & Kanto</option>
              <option value="ARCHAIC">Archaïque & Ntaolo</option>
              <option value="LITERAL">Littéraire & Mahitsy</option>
              <option value="PROVERBIAL">Proverbial (Ohabolana)</option>
            </select>
          </Field>
        </div>

        {/* 3. Définitions Bilingues */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Définition / Heviny (Malgache)" required>
            <textarea
              rows={3}
              value={formData.meaningMg}
              onChange={(e) => setFormData({ ...formData, meaningMg: e.target.value })}
              placeholder="Hazavao amin'ny teny malagasy madio ny hevitr'ity teny ity..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </Field>

          <Field label="Définition / Traduction (Français)" required>
            <textarea
              rows={3}
              value={formData.meaningFr}
              onChange={(e) => setFormData({ ...formData, meaningFr: e.target.value })}
              placeholder="Explication et nuances littéraires en français..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </Field>
        </div>

        {/* 4. Exemples d'Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Exemple de phrase (Malgache)" required>
            <textarea
              rows={2}
              value={formData.exampleMg}
              onChange={(e) => setFormData({ ...formData, exampleMg: e.target.value })}
              placeholder="Ohatra fampiasana azy anaty fehezanteny..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </Field>

          <Field label="Traduction de l'exemple (Français)" required>
            <textarea
              rows={2}
              value={formData.exampleFr}
              onChange={(e) => setFormData({ ...formData, exampleFr: e.target.value })}
              placeholder="Traduction de la phrase exemple..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </Field>
        </div>

        {/* 5. Contexte et Étymologie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Contexte d'utilisation" required>
            <input
              type="text"
              value={formData.contextUsage}
              onChange={(e) => setFormData({ ...formData, contextUsage: e.target.value })}
              placeholder="Ex: Poésie, récits contemplatifs, kabary d'ambiance."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </Field>

          <Field label="Étymologie & Origine">
            <input
              type="text"
              value={formData.etymology || ''}
              onChange={(e) => setFormData({ ...formData, etymology: e.target.value })}
              placeholder="Ex: Avy amin'ny 'somambo' (manjavozavo)..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </Field>
        </div>

        {/* 6. Options de publication & mise en avant */}
        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              Mettre en avant sur la page d&apos;accueil de l&apos;application
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--card-hover)] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[var(--accent)] hover:opacity-90 text-white shadow-sm transition-opacity"
            >
              {isSubmitting
                ? 'Enregistrement...'
                : isEdit
                ? 'Mettre à jour'
                : 'Ajouter au dictionnaire'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
