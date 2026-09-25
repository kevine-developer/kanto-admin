import { fetchApi } from '@/lib/api-client';
import {
  CivicLessonItem,
  PresidentItem,
  BanknoteItem,
  ProvinceBlasonItem,
  NatureEmblemItem,
  HistoryDateItem,
  NationalEmblemItem,
} from '@/types/history';

export const historyService = {
  // Upload Photo
  async uploadImage(imageBase64: string, fileName?: string, subfolder = 'history') {
    return fetchApi<{ url: string; provider: 'cloudinary' | 'local' }>(
      '/admin/history/upload-image',
      {
        method: 'POST',
        body: JSON.stringify({ imageBase64, fileName, subfolder }),
      }
    );
  },

  // 1. Thèmes & Leçons
  async getLessons(): Promise<CivicLessonItem[]> {
    return fetchApi<CivicLessonItem[]>('/admin/history/lessons');
  },
  async createLesson(data: Partial<CivicLessonItem>): Promise<CivicLessonItem> {
    return fetchApi<CivicLessonItem>('/admin/history/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateLesson(id: string, data: Partial<CivicLessonItem>): Promise<CivicLessonItem> {
    return fetchApi<CivicLessonItem>(`/admin/history/lessons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async deleteLesson(id: string): Promise<CivicLessonItem> {
    return fetchApi<CivicLessonItem>(`/admin/history/lessons/${id}`, {
      method: 'DELETE',
    });
  },

  // 2. Présidents
  async getPresidents(): Promise<PresidentItem[]> {
    return fetchApi<PresidentItem[]>('/admin/history/presidents');
  },
  async createPresident(data: Partial<PresidentItem>): Promise<PresidentItem> {
    return fetchApi<PresidentItem>('/admin/history/presidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updatePresident(id: string, data: Partial<PresidentItem>): Promise<PresidentItem> {
    return fetchApi<PresidentItem>(`/admin/history/presidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async deletePresident(id: string): Promise<PresidentItem> {
    return fetchApi<PresidentItem>(`/admin/history/presidents/${id}`, {
      method: 'DELETE',
    });
  },

  // 3. Billets
  async getBanknotes(): Promise<BanknoteItem[]> {
    return fetchApi<BanknoteItem[]>('/admin/history/banknotes');
  },
  async createBanknote(data: Partial<BanknoteItem>): Promise<BanknoteItem> {
    return fetchApi<BanknoteItem>('/admin/history/banknotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateBanknote(id: string, data: Partial<BanknoteItem>): Promise<BanknoteItem> {
    return fetchApi<BanknoteItem>(`/admin/history/banknotes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async deleteBanknote(id: string): Promise<BanknoteItem> {
    return fetchApi<BanknoteItem>(`/admin/history/banknotes/${id}`, {
      method: 'DELETE',
    });
  },

  // 4. Blasons Provinces
  async getProvinces(): Promise<ProvinceBlasonItem[]> {
    return fetchApi<ProvinceBlasonItem[]>('/admin/history/provinces');
  },
  async createProvince(data: Partial<ProvinceBlasonItem>): Promise<ProvinceBlasonItem> {
    return fetchApi<ProvinceBlasonItem>('/admin/history/provinces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateProvince(id: string, data: Partial<ProvinceBlasonItem>): Promise<ProvinceBlasonItem> {
    return fetchApi<ProvinceBlasonItem>(`/admin/history/provinces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async deleteProvince(id: string): Promise<ProvinceBlasonItem> {
    return fetchApi<ProvinceBlasonItem>(`/admin/history/provinces/${id}`, {
      method: 'DELETE',
    });
  },

  // 5. Nature & Emblèmes
  async getNatureEmblems(): Promise<NatureEmblemItem[]> {
    return fetchApi<NatureEmblemItem[]>('/admin/history/nature');
  },
  async createNatureEmblem(data: Partial<NatureEmblemItem>): Promise<NatureEmblemItem> {
    return fetchApi<NatureEmblemItem>('/admin/history/nature', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateNatureEmblem(id: string, data: Partial<NatureEmblemItem>): Promise<NatureEmblemItem> {
    return fetchApi<NatureEmblemItem>(`/admin/history/nature/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async deleteNatureEmblem(id: string): Promise<NatureEmblemItem> {
    return fetchApi<NatureEmblemItem>(`/admin/history/nature/${id}`, {
      method: 'DELETE',
    });
  },

  // 6. Dates Historiques
  async getHistoryDates(): Promise<HistoryDateItem[]> {
    return fetchApi<HistoryDateItem[]>('/admin/history/dates');
  },
  async createHistoryDate(data: Partial<HistoryDateItem>): Promise<HistoryDateItem> {
    return fetchApi<HistoryDateItem>('/admin/history/dates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateHistoryDate(id: string, data: Partial<HistoryDateItem>): Promise<HistoryDateItem> {
    return fetchApi<HistoryDateItem>(`/admin/history/dates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async deleteHistoryDate(id: string): Promise<HistoryDateItem> {
    return fetchApi<HistoryDateItem>(`/admin/history/dates/${id}`, {
      method: 'DELETE',
    });
  },

  // 7. Emblèmes & Sceaux d'État
  async getNationalEmblems(): Promise<NationalEmblemItem[]> {
    return fetchApi<NationalEmblemItem[]>('/admin/history/national-emblems');
  },
  async createNationalEmblem(data: Partial<NationalEmblemItem>): Promise<NationalEmblemItem> {
    return fetchApi<NationalEmblemItem>('/admin/history/national-emblems', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateNationalEmblem(id: string, data: Partial<NationalEmblemItem>): Promise<NationalEmblemItem> {
    return fetchApi<NationalEmblemItem>(`/admin/history/national-emblems/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  async deleteNationalEmblem(id: string): Promise<NationalEmblemItem> {
    return fetchApi<NationalEmblemItem>(`/admin/history/national-emblems/${id}`, {
      method: 'DELETE',
    });
  },

  // 8. Synchronisation des données par défaut
  async seedDefaults(force = false): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>('/admin/history/seed', {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  },
};
