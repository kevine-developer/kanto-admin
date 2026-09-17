import { fetchApi } from '@/lib/api-client';
import {
  WelcomeSlide,
  CreateWelcomeSlideInput,
  UpdateWelcomeSlideInput,
} from '@/types';

export const welcomeSlidesService = {
  /**
   * Récupère toutes les slides (administration)
   */
  async getSlides(): Promise<WelcomeSlide[]> {
    const res = await fetchApi<WelcomeSlide[]>('/welcome-slides/admin');
    return res || [];
  },

  /**
   * Crée une nouvelle slide
   */
  async createSlide(data: CreateWelcomeSlideInput): Promise<WelcomeSlide> {
    return fetchApi<WelcomeSlide>('/welcome-slides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Met à jour une slide
   */
  async updateSlide(
    id: string,
    data: UpdateWelcomeSlideInput,
  ): Promise<WelcomeSlide> {
    return fetchApi<WelcomeSlide>(`/welcome-slides/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Supprime une slide
   */
  async deleteSlide(id: string): Promise<void> {
    await fetchApi(`/welcome-slides/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Réorganise l'ordre d'affichage des slides
   */
  async reorderSlides(
    slides: { id: string; orderIndex: number }[],
  ): Promise<WelcomeSlide[]> {
    return fetchApi<WelcomeSlide[]>('/welcome-slides/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ slides }),
    });
  },
};
