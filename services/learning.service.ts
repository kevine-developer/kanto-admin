import { fetchApi } from '@/lib/api-client';
import { AdminLearningTrack, AdminLearningLesson } from '@/types/learning';

export const learningService = {
  /**
   * Récupère la liste de tous les parcours avec leurs leçons.
   */
  async getTracks(): Promise<AdminLearningTrack[]> {
    return fetchApi<AdminLearningTrack[]>('/admin/learning/tracks');
  },

  /**
   * Crée un nouveau parcours pédagogique.
   */
  async createTrack(data: Partial<AdminLearningTrack>): Promise<AdminLearningTrack> {
    return fetchApi<AdminLearningTrack>('/admin/learning/tracks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Modifie un parcours pédagogique.
   */
  async updateTrack(id: string, data: Partial<AdminLearningTrack>): Promise<AdminLearningTrack> {
    return fetchApi<AdminLearningTrack>(`/admin/learning/tracks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Supprime un parcours pédagogique.
   */
  async deleteTrack(id: string): Promise<{ success: boolean }> {
    return fetchApi(`/admin/learning/tracks/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Récupère toutes les leçons (filtrables par trackId).
   */
  async getLessons(trackId?: string): Promise<AdminLearningLesson[]> {
    const query = trackId ? `?trackId=${encodeURIComponent(trackId)}` : '';
    return fetchApi<AdminLearningLesson[]>(`/admin/learning/lessons${query}`);
  },

  /**
   * Récupère le détail complet d'une leçon par son ID.
   */
  async getLessonById(id: string): Promise<AdminLearningLesson> {
    return fetchApi<AdminLearningLesson>(`/admin/learning/lessons/${id}`);
  },

  /**
   * Crée une nouvelle leçon didactique.
   */
  async createLesson(data: Partial<AdminLearningLesson>): Promise<AdminLearningLesson> {
    return fetchApi<AdminLearningLesson>('/admin/learning/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Modifie une leçon.
   */
  async updateLesson(id: string, data: Partial<AdminLearningLesson>): Promise<AdminLearningLesson> {
    return fetchApi<AdminLearningLesson>(`/admin/learning/lessons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Bascule le statut de publication d'une leçon (Publié / Dépublié).
   */
  async togglePublish(id: string): Promise<AdminLearningLesson> {
    return fetchApi<AdminLearningLesson>(`/admin/learning/lessons/${id}/toggle-publish`, {
      method: 'PATCH',
    });
  },

  /**
   * Bascule la lecture vocale des prononciations sur toutes les leçons (ou pour un parcours spécifique).
   */
  async toggleAllAudio(audioEnabled: boolean, trackId?: string): Promise<{ success: boolean; updatedCount: number; audioEnabled: boolean }> {
    return fetchApi('/admin/learning/toggle-all-audio', {
      method: 'PATCH',
      body: JSON.stringify({ audioEnabled, trackId }),
    });
  },

  /**
   * Supprime une leçon.
   */
  async deleteLesson(id: string): Promise<{ success: boolean }> {
    return fetchApi(`/admin/learning/lessons/${id}`, {
      method: 'DELETE',
    });
  },
};

