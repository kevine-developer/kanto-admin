import { fetchApi } from '@/lib/api-client';
import {
  MalagasyItem,
  KabaryItem,
  CitationItem,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export const cultureService = {
  // ─── Proverbes & Ohabolana ──────────────────────────────────────────────────
  async getItems(
    params: PaginationParams & { category?: string; difficulty?: string } = {}
  ): Promise<PaginatedResponse<MalagasyItem>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.category && params.category !== 'ALL') query.append('category', params.category);
    if (params.difficulty && params.difficulty !== 'ALL') query.append('difficulty', params.difficulty);
    if (params.search?.trim()) query.append('search', params.search.trim());

    return fetchApi<PaginatedResponse<MalagasyItem>>(`/items?${query.toString()}`);
  },

  async createItem(data: Partial<MalagasyItem>): Promise<MalagasyItem> {
    return fetchApi<MalagasyItem>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateItem(id: string, data: Partial<MalagasyItem>): Promise<MalagasyItem> {
    return fetchApi<MalagasyItem>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteItem(id: string): Promise<void> {
    await fetchApi(`/items/${id}`, { method: 'DELETE' });
  },

  // ─── Discours & Kabary ──────────────────────────────────────────────────────
  async getKabaries(params: PaginationParams = {}): Promise<PaginatedResponse<KabaryItem>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search?.trim()) query.append('search', params.search.trim());

    return fetchApi<PaginatedResponse<KabaryItem>>(`/kabary?${query.toString()}`);
  },

  async createKabary(data: Partial<KabaryItem>): Promise<KabaryItem> {
    return fetchApi<KabaryItem>('/kabary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateKabary(id: string, data: Partial<KabaryItem>): Promise<KabaryItem> {
    return fetchApi<KabaryItem>(`/kabary/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteKabary(id: string): Promise<void> {
    await fetchApi(`/kabary/${id}`, { method: 'DELETE' });
  },

  // ─── Citations ──────────────────────────────────────────────────────────────
  async getCitations(params: PaginationParams = {}): Promise<PaginatedResponse<CitationItem>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search?.trim()) query.append('search', params.search.trim());

    return fetchApi<PaginatedResponse<CitationItem>>(`/citations?${query.toString()}`);
  },

  async createCitation(data: Partial<CitationItem>): Promise<CitationItem> {
    return fetchApi<CitationItem>('/citations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCitation(id: string, data: Partial<CitationItem>): Promise<CitationItem> {
    return fetchApi<CitationItem>(`/citations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCitation(id: string): Promise<void> {
    await fetchApi(`/citations/${id}`, { method: 'DELETE' });
  },
};
