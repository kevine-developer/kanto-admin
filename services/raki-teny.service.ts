import { fetchApi } from '@/lib/api-client';
import { RakiTenyWord, RakiTenyFormData, RarityFilterType } from '@/types/raki-teny';

export interface GetRakiTenyParams {
  page?: number;
  limit?: number;
  search?: string;
  letter?: string;
  rarity?: RarityFilterType;
  category?: string;
}

export interface PaginatedRakiTenyResponse {
  data: RakiTenyWord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const rakiTenyService = {
  /**
   * Récupère la liste paginée et filtrée des mots rares.
   */
  async getWords(params: GetRakiTenyParams = {}): Promise<PaginatedRakiTenyResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search.trim());
    if (params.letter && params.letter !== 'ALL') searchParams.set('letter', params.letter);
    if (params.rarity && params.rarity !== 'ALL') searchParams.set('rarity', params.rarity);
    if (params.category && params.category !== 'all') searchParams.set('category', params.category);

    const qs = searchParams.toString();
    const endpoint = `/raki-teny${qs ? `?${qs}` : ''}`;
    return fetchApi<PaginatedRakiTenyResponse>(endpoint);
  },

  /**
   * Récupère les détails d'un mot rare par son identifiant ou son slug.
   */
  async getWordById(idOrSlug: string): Promise<RakiTenyWord> {
    return fetchApi<RakiTenyWord>(`/raki-teny/${idOrSlug}`);
  },

  /**
   * Crée un nouveau mot rare.
   */
  async createWord(data: RakiTenyFormData): Promise<RakiTenyWord> {
    return fetchApi<RakiTenyWord>('/raki-teny', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Met à jour un mot rare existant.
   */
  async updateWord(id: string, data: Partial<RakiTenyFormData>): Promise<RakiTenyWord> {
    return fetchApi<RakiTenyWord>(`/raki-teny/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Supprime un mot rare.
   */
  async deleteWord(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/raki-teny/${id}`, {
      method: 'DELETE',
    });
  },
};
