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
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketingBannerInput {
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
}

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
};
