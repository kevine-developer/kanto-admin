import { Difficulty } from './common';

// ─── Proverbes & Items ──────────────────────────────────────────────────────────
export type ItemCategory = 'PROVERBE' | 'EXPRESSION' | 'DICTON';

export interface DialectVariant {
  id?: string;
  dialectName: string;
  text: string;
  notes?: string | null;
}

export interface MalagasyItem {
  id: string;
  slug: string;
  malagasy: string;
  french: string;
  meaning: string;
  example?: string | null;
  category: ItemCategory;
  difficulty: Difficulty;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  likesCount: number;
  shareCount: number;
  reportCount: number;
  audioUrl?: string | null;
  themes?: Array<{
    theme: {
      nameMg: string;
      nameFr: string;
      color?: string;
    };
  }>;
  dialectVariants?: DialectVariant[];
}

// ─── Discours & Kabary ────────────────────────────────────────────────────────
export interface KabaryStep {
  id?: string;
  stepNumber: number;
  stepNameMg: string;
  stepNameFr: string;
  explanationMg?: string | null;
  explanationFr?: string | null;
  textMg: string;
  textFr: string;
}

export interface KabaryItem {
  id: string;
  slug: string;
  title: string;
  titleFr: string;
  subtitle?: string | null;
  occasion: string;
  occasionFr?: string | null;
  speakerRoleMg?: string | null;
  recipientRoleMg?: string | null;
  region?: string | null;
  concludingProverbMg?: string | null;
  viewCount: number;
  likesCount: number;
  steps: KabaryStep[];
  themes?: Array<{
    theme: {
      nameMg: string;
      nameFr: string;
    };
  }>;
}

// ─── Citations ────────────────────────────────────────────────────────────────
export interface AuthorItem {
  id: string;
  name: string;
  bio?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  avatarUrl?: string | null;
}

export interface CitationItem {
  id: string;
  citationMg: string;
  citationFr: string;
  sourceName: string;
  contexte?: string | null;
  audioUrl?: string | null;
  isPremium: boolean;
  viewCount: number;
  likesCount: number;
  shareCount: number;
  reportCount: number;
  createdAt: string;
  author?: AuthorItem | null;
  themes?: Array<{
    theme: {
      nameMg: string;
      nameFr: string;
      color?: string;
    };
  }>;
}
