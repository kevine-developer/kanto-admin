export interface ConteParagraph {
  id?: string;
  paragraphNumber: number;
  textMg: string;
  textFr: string;
  illustration?: string | null;
}

export interface ConteTheme {
  theme: {
    nameMg: string;
    nameFr: string;
  };
}

export interface ConteItem {
  id: string;
  slug: string;
  title: string;
  titleFr: string;
  subtitle?: string | null;
  subtitleFr?: string | null;
  author?: string | null;
  illustration?: string | null;
  status: string;
  isFeatured?: boolean;
  moralMg?: string | null;
  moralFr?: string | null;
  audioUrlMg?: string | null;
  audioUrlFr?: string | null;
  viewCount?: number;
  likesCount?: number;
  paragraphs?: ConteParagraph[];
  themes?: ConteTheme[];
}

export interface ConteFormData {
  title: string;
  titleFr: string;
  subtitle?: string;
  author?: string;
  moralMg?: string;
  moralFr?: string;
  paragraphs: Array<{ textMg: string; textFr: string }>;
}

export type AudioFilterType = 'ALL' | 'HAS_MG' | 'HAS_FR' | 'MISSING';
