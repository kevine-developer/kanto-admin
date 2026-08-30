import { fetchApi } from '@/lib/api-client';
import { ConteItem, ConteFormData } from '@/types/conte';

export const contesService = {
  async getContes(limit: number = 100): Promise<ConteItem[]> {
    const res = await fetchApi<{ data: ConteItem[] }>(`/contes?limit=${limit}`);
    return res.data || [];
  },

  async getConteById(id: string): Promise<ConteItem> {
    return fetchApi<ConteItem>(`/contes/${id}`);
  },

  async createConte(data: ConteFormData): Promise<ConteItem> {
    const validParagraphs = data.paragraphs
      .filter((p) => p.textMg.trim() && p.textFr.trim())
      .map((p, idx) => ({
        paragraphNumber: idx + 1,
        textMg: p.textMg.trim(),
        textFr: p.textFr.trim(),
      }));

    return fetchApi<ConteItem>('/contes', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title.trim(),
        titleFr: data.titleFr.trim(),
        subtitle: data.subtitle?.trim() || undefined,
        author: data.author?.trim() || 'Angano Malagasy',
        moralMg: data.moralMg?.trim() || undefined,
        moralFr: data.moralFr?.trim() || undefined,
        paragraphs: validParagraphs,
      }),
    });
  },

  async updateConte(id: string, data: ConteFormData): Promise<ConteItem> {
    const validParagraphs = data.paragraphs
      .filter((p) => p.textMg.trim() && p.textFr.trim())
      .map((p, idx) => ({
        paragraphNumber: idx + 1,
        textMg: p.textMg.trim(),
        textFr: p.textFr.trim(),
      }));

    return fetchApi<ConteItem>(`/contes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: data.title.trim(),
        titleFr: data.titleFr.trim(),
        subtitle: data.subtitle?.trim() || undefined,
        author: data.author?.trim() || 'Angano Malagasy',
        moralMg: data.moralMg?.trim() || undefined,
        moralFr: data.moralFr?.trim() || undefined,
        paragraphs: validParagraphs,
      }),
    });
  },

  async deleteConte(id: string): Promise<void> {
    await fetchApi(`/contes/${id}`, { method: 'DELETE' });
  },

  async generateAudio(
    id: string,
    lang: 'mg' | 'fr' | 'all',
    force: boolean = false
  ): Promise<ConteItem> {
    return fetchApi<ConteItem>(`/admin/contes/${id}/generate-audio`, {
      method: 'POST',
      body: JSON.stringify({ lang, force }),
    });
  },
};
