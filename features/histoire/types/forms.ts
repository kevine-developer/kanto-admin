/**
 * Types de formulaires pour les entités Histoire & Patrimoine.
 * Un type distinct par entité → pas de type "fourre-tout".
 */

import type { ProvinceSymbol } from '@/types/history';

export type BanknoteSeriesKey =
  | 'SERIE_2017'
  | 'SERIE_2003'
  | 'SERIE_FMG'
  | 'COLONIAL';

// ─── Formulaire Président ─────────────────────────────────────────────────────
export interface PresidentFormData {
  id?: string;
  name?: string;
  titleFr?: string;
  titleMg?: string;
  republic?: string;
  republicMg?: string;
  period?: string;
  quoteFr?: string;
  quoteMg?: string;
  bioFr?: string;
  bioMg?: string;
  /** Champ intermédiaire textarea (ligne par ligne) */
  achievementsFrRaw?: string;
  achievementsMgRaw?: string;
  achievementsFr?: string[];
  achievementsMg?: string[];
  badgeColor?: string;
  imageUrl?: string | null;
  orderIndex?: number;
  status?: string;
}

// ─── Formulaire Emblème National ──────────────────────────────────────────────
export interface NationalEmblemFormData {
  id?: string;
  period?: string;
  government?: string;
  descriptionFr?: string;
  descriptionMg?: string;
  notesFr?: string;
  notesMg?: string;
  imageUrl?: string | null;
  orderIndex?: number;
  status?: string;
}

// ─── Formulaire Billet ────────────────────────────────────────────────────────
export interface BanknoteFormData {
  id?: string;
  titleFr?: string;
  titleMg?: string;
  valueAriary?: number;
  valueFmg?: number;
  series?: string;
  seriesLabelFr?: string;
  seriesLabelMg?: string;
  period?: string;
  colorLight?: string;
  colorDark?: string;
  obverseDescriptionFr?: string;
  obverseDescriptionMg?: string;
  reverseDescriptionFr?: string;
  reverseDescriptionMg?: string;
  symbolismFr?: string;
  symbolismMg?: string;
  /** Champ intermédiaire textarea (ligne par ligne) */
  securityFeaturesRaw?: string;
  securityFeaturesFr?: string[];
  imageUrl?: string | null;
  imageUrlVerso?: string | null;
  isComingSoon?: boolean;
  orderIndex?: number;
  status?: string;
}

// ─── Formulaire Blason Province ───────────────────────────────────────────────
export interface ProvinceBlasonFormData {
  id?: string;
  province?: string;
  chefLieu?: string;
  titleFr?: string;
  titleMg?: string;
  color?: string;
  bgLight?: string;
  borderLight?: string;
  descriptionFr?: string;
  descriptionMg?: string;
  symbols?: ProvinceSymbol[];
  /** Champ intermédiaire textarea (ligne par ligne) */
  keyFactsFrRaw?: string;
  keyFactsMgRaw?: string;
  keyFactsFr?: string[];
  keyFactsMg?: string[];
  imageUrl?: string | null;
  orderIndex?: number;
  status?: string;
}

// ─── Formulaire Emblème Nature ────────────────────────────────────────────────
export interface NatureEmblemFormData {
  id?: string;
  nameFr?: string;
  nameMg?: string;
  scientificName?: string;
  type?: string;
  statusFr?: string;
  statusMg?: string;
  descriptionFr?: string;
  descriptionMg?: string;
  culturalRoleFr?: string;
  culturalRoleMg?: string;
  proverbMg?: string;
  proverbFr?: string;
  accentColor?: string;
  imageUrl?: string | null;
  orderIndex?: number;
  status?: string;
}

// ─── Formulaire Date Historique ───────────────────────────────────────────────
export interface HistoryDateFormData {
  id?: string;
  year?: string;
  exactDate?: string;
  titleFr?: string;
  titleMg?: string;
  era?: string;
  summaryFr?: string;
  summaryMg?: string;
  impactFr?: string;
  impactMg?: string;
  accentColor?: string;
  imageUrl?: string | null;
  orderIndex?: number;
  status?: string;
}

// ─── Formulaire Leçon Civique ─────────────────────────────────────────────────
export interface CivicLessonFormData {
  id?: string;
  titleFr?: string;
  titleMg?: string;
  descriptionFr?: string;
  descriptionMg?: string;
  /** Champ intermédiaire — catégories séparées par virgule */
  categoryRaw?: string;
  category?: string[];
  imageUrl?: string | null;
  orderIndex?: number;
  /** Statut booléen spécifique aux leçons civiques */
  lessonStatus?: boolean;
}

// ─── Union discriminée — pour la modale générique ─────────────────────────────
export type HistoryFormData =
  | PresidentFormData
  | NationalEmblemFormData
  | BanknoteFormData
  | ProvinceBlasonFormData
  | NatureEmblemFormData
  | HistoryDateFormData
  | CivicLessonFormData;

/**
 * Type générique "escaped" pour la modale générique qui accède
 * à des champs de formulaires hétérogènes.
 * À utiliser uniquement dans le composant générique HistoryModal.
 */
export type GenericHistoryFormData = PresidentFormData &
  NationalEmblemFormData &
  BanknoteFormData &
  ProvinceBlasonFormData &
  NatureEmblemFormData &
  HistoryDateFormData &
  CivicLessonFormData & {
    // Champs intermédiaires communs
    achievementsFrRaw?: string;
    achievementsMgRaw?: string;
    keyFactsFrRaw?: string;
    keyFactsMgRaw?: string;
    securityFeaturesRaw?: string;
    categoryRaw?: string;
    // Métadonnées à ignorer lors de la soumission
    createdAt?: string;
    updatedAt?: string;
    _count?: unknown;
  };
