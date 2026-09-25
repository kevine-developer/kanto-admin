/**
 * Constantes pour la feature Histoire & Patrimoine.
 * Extraites de app/histoire/page.tsx pour réutilisation.
 */

import type { TabKey } from '../types/tabs';

// ─── Onglets ──────────────────────────────────────────────────────────────────

export const VALID_TAB_KEYS: TabKey[] = [
  'presidents',
  'emblems',
  'banknotes',
  'provinces',
  'nature',
  'dates',
  'lessons',
];

/** Mapping onglet → sous-dossier Cloudinary */
export const TAB_SUBFOLDER_MAP: Record<TabKey, string> = {
  presidents: 'presidents',
  emblems: 'national_emblems',
  banknotes: 'banknotes',
  provinces: 'provinces',
  nature: 'nature',
  dates: 'dates',
  lessons: 'lessons',
};

// ─── Palettes couleur ─────────────────────────────────────────────────────────

export const PRESET_COLORS = [
  { label: 'Bleu Royal', hex: '#2B6CB0', bg: '#EBF8FF', border: '#BEE3F8' },
  { label: 'Vert Émeraude', hex: '#2F855A', bg: '#F0FFF4', border: '#C6F6D5' },
  { label: 'Rouge Madagascar', hex: '#C53030', bg: '#FFF5F5', border: '#FED7D7' },
  { label: 'Orange Terre', hex: '#DD6B20', bg: '#FFFAF0', border: '#FEEBC8' },
  { label: 'Pourpre Sacré', hex: '#805AD5', bg: '#FAF5FF', border: '#E9D8FD' },
  { label: 'Ocre Doré', hex: '#D69E2E', bg: '#FFFFF0', border: '#FEFCBF' },
  { label: 'Turquoise Océan', hex: '#319795', bg: '#E6FFFA', border: '#B2F5EA' },
  { label: 'Sépia Ancien', hex: '#744210', bg: '#FFFAF0', border: '#FBD38D' },
] as const;

export type PresetColor = typeof PRESET_COLORS[number];

// ─── Valeurs par défaut des formulaires ──────────────────────────────────────

export const PRESIDENT_DEFAULTS = {
  badgeColor: '#2A6B3D',
  achievementsFrRaw: '',
  achievementsMgRaw: '',
  republic: '4ème République',
  republicMg: 'Repoblika Fahefatra',
} as const;

export const PROVINCE_DEFAULTS = {
  color: '#2B6CB0',
  bgLight: '#EBF8FF',
  borderLight: '#BEE3F8',
  keyFactsFrRaw: '',
  keyFactsMgRaw: '',
} as const;

export const NATURE_DEFAULTS = {
  type: 'FLORA',
  statusFr: 'Espèce protégée / Endémique',
  statusMg: 'Harena voaaro',
  accentColor: '#1B5E20',
} as const;

export const BANKNOTE_DEFAULTS = {
  series: 'SERIE_2017',
  seriesLabelFr: 'Série 2017 - Madagascar et ses Richesses',
  seriesLabelMg: 'Sokajy 2017 - Madagasikara sy ny Harenany',
  colorLight: '#2E7D32',
  colorDark: '#1B5E20',
  securityFeaturesRaw: '',
  imageUrl: '',
  imageUrlVerso: '',
} as const;

export const HISTORY_DATE_DEFAULTS = {
  accentColor: '#B71C1C',
  era: 'Époque contemporaine',
} as const;

export const CIVIC_LESSON_DEFAULTS = {
  categoryRaw: 'culture-histoire, patrimoine',
  lessonStatus: true,
} as const;

/** Empty symbol initial pour les blasons de province */
export const EMPTY_PROVINCE_SYMBOL = {
  labelFr: '',
  labelMg: '',
  meaningFr: '',
  meaningMg: '',
} as const;
