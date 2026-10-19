export type WordRarity =
  | 'LITERAL'
  | 'VERY_RARE'
  | 'ARCHAIC'
  | 'POETIC'
  | 'PROVERBIAL';

export interface RakiTenyWord {
  id: string;
  slug: string;
  word: string;
  phonetic?: string | null;
  category: string;
  wordClassMg: string;
  wordClassFr: string;
  rarity: WordRarity;
  rarityLabelMg: string;
  rarityLabelFr: string;
  meaningMg: string;
  meaningFr: string;
  exampleMg: string;
  exampleFr: string;
  contextUsage: string;
  etymology?: string | null;
  audioUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  viewCount: number;
  likesCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RakiTenyFormData {
  word: string;
  phonetic?: string;
  category: string;
  wordClassMg: string;
  wordClassFr: string;
  rarity: WordRarity;
  rarityLabelMg: string;
  rarityLabelFr: string;
  meaningMg: string;
  meaningFr: string;
  exampleMg: string;
  exampleFr: string;
  contextUsage: string;
  etymology?: string;
  audioUrl?: string;
  isFeatured?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export type RarityFilterType = 'ALL' | WordRarity;
