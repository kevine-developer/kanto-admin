import { fetchApi } from '@/lib/api-client';
import { NotificationItem, UserAccount } from '@/types';

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

  async resetUserPassword(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(
      `/admin/users/${id}/reset-password`,
      { method: 'POST' }
    );
  },

  // ─── Diagnostic & Test Email ────────────────────────────────────────────────
  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    return fetchApi('/admin/system/test-email', {
      method: 'POST',
      body: JSON.stringify({ to }),
    });
  },
};
