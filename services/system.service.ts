import { fetchApi } from '@/lib/api-client';
import { NotificationItem, OnboardingSlideItem, UserAccount } from '@/types';

export const systemService = {
  // ─── Notifications ─────────────────────────────────────────────────────────
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetchApi<NotificationItem[]>('/admin/notifications');
    return res || [];
  },

  async createNotification(data: Partial<NotificationItem>): Promise<NotificationItem> {
    return fetchApi<NotificationItem>('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteNotification(id: string): Promise<void> {
    await fetchApi(`/admin/notifications/${id}`, { method: 'DELETE' });
  },

  // ─── Onboarding Slides ──────────────────────────────────────────────────────
  async getOnboardingSlides(): Promise<OnboardingSlideItem[]> {
    const res = await fetchApi<OnboardingSlideItem[]>('/admin/onboarding');
    return res || [];
  },

  async createSlide(data: Partial<OnboardingSlideItem>): Promise<OnboardingSlideItem> {
    return fetchApi<OnboardingSlideItem>('/admin/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSlide(id: string, data: Partial<OnboardingSlideItem>): Promise<OnboardingSlideItem> {
    return fetchApi<OnboardingSlideItem>(`/admin/onboarding/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async reorderSlides(slideIds: string[]): Promise<void> {
    await fetchApi('/admin/onboarding/reorder', {
      method: 'POST',
      body: JSON.stringify({ slideIds }),
    });
  },

  async deleteSlide(id: string): Promise<void> {
    await fetchApi(`/admin/onboarding/${id}`, { method: 'DELETE' });
  },

  // ─── Utilisateurs ───────────────────────────────────────────────────────────
  async getUsers(): Promise<UserAccount[]> {
    const res = await fetchApi<{ data: UserAccount[] }>('/admin/users');
    return res.data || [];
  },

  async updateUserRole(id: string, role: 'ADMIN' | 'USER'): Promise<void> {
    await fetchApi(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
};
