import { fetchApi } from '@/lib/api-client';

export interface MarketingBanner {
  id: string;
  badgeFr: string;
  badgeMg: string;
  titleFr: string;
  titleMg: string;
  descriptionFr: string;
  descriptionMg: string;
  ctaFr: string;
  ctaMg: string;
  imageUrl: string;
  deepLink: string;
  accentColor: string;
  orderIndex: number;
  isActive: boolean;
  actionType: 'DEEP_LINK' | 'BOTTOM_SHEET' | 'CENTER_MODAL';
  modalBodyFr?: string | null;
  modalBodyMg?: string | null;
  modalImageUrl?: string | null;
  modalCtaLabelFr?: string | null;
  modalCtaLabelMg?: string | null;
  modalCtaLink?: string | null;
  targetLocation?: 'HOME' | 'CATEGORY' | 'ALL';
  categoryKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MarketingBannerAiLanguageMode = 'MG_ONLY' | 'BILINGUAL' | 'FR_ONLY';

export const BANNER_AI_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: MarketingBannerAiLanguageMode;
  label: string;
  shortLabel: string;
}> = [
  {
    value: 'BILINGUAL',
    label: 'Malgache & Français',
    shortLabel: 'MG + FR',
  },
  {
    value: 'MG_ONLY',
    label: 'Seulement en malgache',
    shortLabel: 'Malagasy',
  },
  {
    value: 'FR_ONLY',
    label: 'Seulement en français',
    shortLabel: 'Français',
  },
];

export interface MarketingBannerAiStatus {
  enabled: boolean;
  description: string;
  languageMode?: MarketingBannerAiLanguageMode;
}

export interface CreateMarketingBannerInput {
  languageMode?: MarketingBannerAiLanguageMode;
  badgeFr: string;
  badgeMg: string;
  titleFr: string;
  titleMg: string;
  descriptionFr: string;
  descriptionMg: string;
  ctaFr?: string;
  ctaMg?: string;
  imageUrl: string;
  deepLink: string;
  accentColor?: string;
  orderIndex?: number;
  isActive?: boolean;
  actionType?: 'DEEP_LINK' | 'BOTTOM_SHEET' | 'CENTER_MODAL';
  modalBodyFr?: string;
  modalBodyMg?: string;
  modalImageUrl?: string;
  modalCtaLabelFr?: string;
  modalCtaLabelMg?: string;
  modalCtaLink?: string;
  targetLocation?: 'HOME' | 'CATEGORY' | 'ALL';
  categoryKey?: string | null;
}

export const BANNER_TARGET_LOCATIONS = [
  { value: 'HOME', label: "Accueil (Home)", description: "Carrousel en haut de la page d'accueil" },
  { value: 'CATEGORY', label: "Listes de catégories", description: "Bannière en tête des listes de contenus culturels" },
  { value: 'ALL', label: "Partout (Accueil + Catégories)", description: "Visible à la fois sur l'accueil et dans les catégories" },
] as const;

export const BANNER_CATEGORIES = [
  { value: 'ALL', label: 'Toutes les catégories' },
  { value: 'conte', label: 'Contes & Légendes (Angano)' },
  { value: 'proverbe', label: 'Proverbes & Sagesses (Ohabolana)' },
  { value: 'expression', label: 'Expressions imagées (Oha-pitenenana)' },
  { value: 'dicton', label: 'Dictons populaires (Fomba fiteny)' },
  { value: 'citation', label: 'Citations & Penseurs (Tenin\'olon-kendry)' },
  { value: 'raki-teny', label: 'Mots Rares & Insolites (Raki-teny Miafina)' },
  { value: 'discours', label: 'Discours & Kabary' },
  { value: 'poesie', label: 'Poésies (Tononkalo)' },
  { value: 'recitation', label: 'Récitations (Tsianjery)' },
] as const;

export type UpdateMarketingBannerInput = Partial<CreateMarketingBannerInput>;

export const marketingBannersService = {
  /**
   * Récupère toutes les bannières pour l'administration
   */
  async getBanners(): Promise<MarketingBanner[]> {
    const res = await fetchApi<MarketingBanner[]>('/marketing-banners/admin');
    return res || [];
  },

  /**
   * Crée une nouvelle bannière
   */
  async createBanner(data: CreateMarketingBannerInput): Promise<MarketingBanner> {
    return fetchApi<MarketingBanner>('/marketing-banners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Met à jour une bannière
   */
  async updateBanner(id: string, data: UpdateMarketingBannerInput): Promise<MarketingBanner> {
    return fetchApi<MarketingBanner>(`/marketing-banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Bascule le statut actif/inactif
   */
  async toggleActive(id: string): Promise<MarketingBanner> {
    return fetchApi<MarketingBanner>(`/marketing-banners/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  /**
   * Supprime une bannière
   */
  async deleteBanner(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/marketing-banners/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Réordonne les bannières
   */
  async reorderBanners(items: { id: string; orderIndex: number }[]): Promise<{ success: boolean }> {
    return fetchApi<{ success: boolean }>('/marketing-banners/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    });
  },

  /**
   * Récupère le statut d'activation et la langue de génération IA (Gemini)
   */
  async getAiStatus(): Promise<MarketingBannerAiStatus> {
    const res = await fetchApi<MarketingBannerAiStatus>('/marketing-banners/ai-status');
    return res
      ? {
          ...res,
          languageMode: res.languageMode ?? 'BILINGUAL',
        }
      : {
          enabled: false,
          description: 'Désactivée par défaut',
          languageMode: 'BILINGUAL',
        };
  },

  /**
   * Active/désactive la génération automatique par IA et/ou met à jour sa langue
   */
  async updateAiStatus(
    payload:
      | boolean
      | {
          enabled?: boolean;
          languageMode?: MarketingBannerAiLanguageMode;
        }
  ): Promise<MarketingBannerAiStatus> {
    const body = typeof payload === 'boolean' ? { enabled: payload } : payload;
    const res = await fetchApi<MarketingBannerAiStatus>('/marketing-banners/ai-status', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return {
      ...res,
      languageMode: res.languageMode ?? 'BILINGUAL',
    };
  },

  /**
   * Déclenche manuellement la génération d'une nouvelle bannière via Gemini AI
   */
  async triggerAiGeneration(
    force = true,
    languageMode?: MarketingBannerAiLanguageMode,
    theme?: string
  ): Promise<{ success: boolean; bannerId?: string; message: string }> {
    const cleanTheme = theme?.trim();
    const body: {
      force: boolean;
      languageMode?: MarketingBannerAiLanguageMode;
      theme?: string;
    } = { force };

    if (languageMode) {
      body.languageMode = languageMode;
    }
    if (cleanTheme) {
      body.theme = cleanTheme;
    }

    return fetchApi<{ success: boolean; bannerId?: string; message: string }>(
      '/marketing-banners/generate',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  },
};
