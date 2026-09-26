export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CivicLessonItem {
  id: string;
  category: string[];
  titleFr: string;
  titleMg: string;
  descriptionFr: string;
  descriptionMg: string;
  imageUrl?: string | null;
  status: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface PresidentItem {
  id: string;
  name: string;
  titleFr: string;
  titleMg: string;
  republic: string;
  republicMg: string;
  period: string;
  quoteFr?: string | null;
  quoteMg?: string | null;
  bioFr: string;
  bioMg: string;
  achievementsFr: string[];
  achievementsMg: string[];
  badgeColor?: string | null;
  imageUrl?: string | null;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BanknoteItem {
  id: string;
  valueAriary: number;
  valueFmg: number;
  titleFr: string;
  titleMg: string;
  series: string;
  seriesLabelFr: string;
  seriesLabelMg: string;
  period: string;
  colorLight: string;
  colorDark: string;
  obverseDescriptionFr?: string | null;
  obverseDescriptionMg?: string | null;
  reverseDescriptionFr?: string | null;
  reverseDescriptionMg?: string | null;
  symbolismFr?: string | null;
  symbolismMg?: string | null;
  securityFeaturesFr?: string[];
  imageUrl?: string | null;
  imageUrlVerso?: string | null;
  isComingSoon?: boolean;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProvinceSymbol {
  labelFr: string;
  labelMg: string;
  meaningFr: string;
  meaningMg: string;
}

export interface ProvinceBlasonItem {
  id: string;
  province: string;
  chefLieu: string;
  titleFr: string;
  titleMg: string;
  color: string;
  bgLight: string;
  borderLight: string;
  descriptionFr: string;
  descriptionMg: string;
  symbols?: ProvinceSymbol[] | null;
  keyFactsFr: string[];
  keyFactsMg: string[];
  imageUrl?: string | null;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NatureEmblemItem {
  id: string;
  nameFr: string;
  nameMg: string;
  scientificName: string;
  type: 'FAUNA' | 'FLORA' | string;
  statusFr: string;
  statusMg: string;
  descriptionFr: string;
  descriptionMg: string;
  culturalRoleFr: string;
  culturalRoleMg: string;
  proverbMg?: string | null;
  proverbFr?: string | null;
  accentColor?: string | null;
  imageUrl?: string | null;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryDateItem {
  id: string;
  year: string;
  exactDate: string;
  titleFr: string;
  titleMg: string;
  era: string;
  summaryFr: string;
  summaryMg: string;
  impactFr: string;
  impactMg: string;
  accentColor?: string | null;
  imageUrl?: string | null;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NationalEmblemItem {
  id: string;
  period: string;
  imageUrl?: string | null;
  government: string;
  descriptionFr: string;
  descriptionMg?: string | null;
  notesFr?: string | null;
  notesMg?: string | null;
  orderIndex: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export type HistoryItem =
  | PresidentItem
  | NationalEmblemItem
  | BanknoteItem
  | ProvinceBlasonItem
  | NatureEmblemItem
  | HistoryDateItem
  | CivicLessonItem;

