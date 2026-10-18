import { fetchApi } from '@/lib/api-client';
import {
  NotificationItem,
  UserAccount,
  UserDetails,
  UserRole,
  SubscriptionTier,
  DashboardMetrics,
  AdminAuditLog,
} from '@/types';

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
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    tier?: string;
  }): Promise<{
    data: UserAccount[];
    meta?: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.role && params.role !== 'ALL') query.set('role', params.role);
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.tier && params.tier !== 'ALL') query.set('tier', params.tier);

    const qs = query.toString();
    const res = await fetchApi<{
      data: UserAccount[];
      meta?: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/users${qs ? `?${qs}` : ''}`);

    return {
      data: res.data || [],
      meta: res.meta,
    };
  },

  async getUserDetails(id: string): Promise<UserDetails> {
    return fetchApi<UserDetails>(`/admin/users/${id}`);
  },

  async updateUserRole(id: string, role: UserRole): Promise<void> {
    await fetchApi(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async updateUserTier(
    id: string,
    tier: SubscriptionTier,
  ): Promise<{ success: boolean; message: string; user: UserAccount }> {
    return fetchApi<{ success: boolean; message: string; user: UserAccount }>(
      `/admin/users/${id}/tier`,
      {
        method: 'PATCH',
        body: JSON.stringify({ tier }),
      },
    );
  },


  async banUser(
    id: string,
    reason: string,
    expiresAt?: string | null,
  ): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/admin/users/${id}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ reason, expiresAt }),
    });
  },

  async unbanUser(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/admin/users/${id}/unban`, {
      method: 'PATCH',
    });
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async resetUserPassword(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(
      `/admin/users/${id}/reset-password`,
      { method: 'POST' }
    );
  },

  // ─── Tableau de bord & Audit ────────────────────────────────────────────────
  async getDashboardMetrics(period = '7d'): Promise<DashboardMetrics> {
    return fetchApi<DashboardMetrics>(`/admin/stats/dashboard?period=${period}`);
  },

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    targetType?: string;
    userId?: string;
  }): Promise<{
    data: AdminAuditLog[];
    meta?: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.action) query.set('action', params.action);
    if (params?.targetType) query.set('targetType', params.targetType);
    if (params?.userId) query.set('userId', params.userId);

    const qs = query.toString();
    return fetchApi<{
      data: AdminAuditLog[];
      meta?: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },

  // ─── Diagnostic & Test Email ────────────────────────────────────────────────
  async sendTestEmail(
    to: string,
    template = 'system',
  ): Promise<{ success: boolean; message: string }> {
    return fetchApi('/admin/system/test-email', {
      method: 'POST',
      body: JSON.stringify({ to, template }),
    });
  },

  async previewEmail(
    to?: string,
    template = 'system',
  ): Promise<{
    success: boolean;
    template: string;
    subject: string;
    html: string;
    text: string;
  }> {
    return fetchApi('/admin/system/preview-email', {
      method: 'POST',
      body: JSON.stringify({ to, template }),
    });
  },
};
