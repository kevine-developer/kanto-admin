import { fetchApi } from '@/lib/api-client';

export type EmailDeliveryStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'SENT'
  | 'DELIVERED'
  | 'DELIVERY_DELAYED'
  | 'BOUNCED'
  | 'COMPLAINED'
  | 'FAILED';

export interface EmailLogEvent {
  type: string;
  at: string;
  data?: Record<string, any>;
  note?: string;
  error?: string;
  resendId?: string;
}

export interface EmailLogItem {
  id: string;
  resendId: string | null;
  idempotencyKey: string | null;
  recipient: string;
  recipientName: string | null;
  from: string;
  subject: string;
  templateType: string;
  status: EmailDeliveryStatus;
  bounceType: string | null;
  bounceSubtype: string | null;
  errorReason: string | null;
  attempts: number;
  lastAttemptAt: string | null;
  metadata: Record<string, any> | null;
  events: EmailLogEvent[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailStats {
  total: number;
  statusCounts: {
    pending: number;
    accepted: number;
    sent: number;
    delivered: number;
    delayed: number;
    bounced: number;
    complained: number;
    failed: number;
  };
  suppressionsCount: number;
  deliveryRate: number;
  bounceRate: number;
}

export interface EmailListResponse {
  items: EmailLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EmailSuppressionItem {
  id: string;
  email: string;
  reason: string;
  details: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuppressionListResponse {
  items: EmailSuppressionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const emailsService = {
  /**
   * Récupère la liste des e-mails envoyés avec pagination et filtres.
   */
  async getEmails(params?: {
    status?: EmailDeliveryStatus | 'ALL';
    templateType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<EmailListResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.templateType && params.templateType !== 'ALL') query.set('templateType', params.templateType);
    if (params?.search) query.set('search', params.search);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/admin/emails${qs ? `?${qs}` : ''}`;
    const res = await fetchApi<{ success: boolean; data: EmailListResponse }>(endpoint);
    return res.data;
  },

  /**
   * Récupère les métriques de délivrabilité et les compteurs de statuts.
   */
  async getEmailStats(): Promise<EmailStats> {
    const res = await fetchApi<{ success: boolean; data: EmailStats }>('/admin/emails/stats');
    return res.data;
  },

  /**
   * Récupère les détails complets d'un e-mail incluant sa timeline d'événements Resend.
   */
  async getEmailDetail(id: string): Promise<EmailLogItem> {
    const res = await fetchApi<{ success: boolean; data: EmailLogItem }>(`/admin/emails/${id}`);
    return res.data;
  },

  /**
   * Relance manuelle sécurisée d'un e-mail en échec.
   */
  async retryEmail(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(`/admin/emails/${id}/retry`, {
      method: 'POST',
    });
  },

  /**
   * Récupère la liste des adresses supprimées (bounces / plaintes).
   */
  async getSuppressions(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SuppressionListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/admin/emails/suppressions/list${qs ? `?${qs}` : ''}`;
    const res = await fetchApi<{ success: boolean; data: SuppressionListResponse }>(endpoint);
    return res.data;
  },

  /**
   * Supprime une adresse de la liste d'exclusion (déblocage manuel).
   */
  async removeSuppression(email: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(
      `/admin/emails/suppressions/${encodeURIComponent(email)}`,
      { method: 'DELETE' },
    );
  },
};
