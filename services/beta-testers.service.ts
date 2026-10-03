import { fetchApi } from '@/lib/api-client';

export type TesterStatus = 'PENDING' | 'APPROVED' | 'INVITED' | 'REJECTED';

export interface BetaTester {
  id: string;
  email: string;
  fullName?: string | null;
  deviceModel?: string | null;
  androidVersion?: string | null;
  notes?: string | null;
  status: TesterStatus;
  invitedAt?: string | null;
  inviteCount: number;
  playLinkSent?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BetaTesterStats {
  total: number;
  pending: number;
  approved: number;
  invited: number;
  rejected: number;
}

export interface BetaTestersResponse {
  data: BetaTester[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: BetaTesterStats;
}

export interface ExportEmailsResponse {
  count: number;
  emails: string[];
  commaSeparated: string;
  csv: string;
}

export const betaTestersService = {
  /**
   * Récupère la liste des testeurs avec filtres et pagination.
   */
  async getTesters(params?: {
    status?: TesterStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BetaTestersResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/api/beta-testers${qs ? `?${qs}` : ''}`;
    return fetchApi<BetaTestersResponse>(endpoint);
  },

  /**
   * Statistiques globales des testeurs.
   */
  async getStats(): Promise<BetaTesterStats> {
    return fetchApi<BetaTesterStats>('/api/beta-testers/stats');
  },

  /**
   * Met à jour le statut d'un testeur.
   */
  async updateStatus(
    id: string,
    status: TesterStatus,
    notes?: string
  ): Promise<BetaTester> {
    return fetchApi<BetaTester>(`/api/beta-testers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  /**
   * Envoie le lien officiel Google Play à un testeur spécifique.
   */
  async sendPlayInvite(
    id: string,
    links?: { playStoreWebLink?: string; playStoreAppLink?: string }
  ): Promise<{ success: boolean; message: string; tester: BetaTester }> {
    return fetchApi<{ success: boolean; message: string; tester: BetaTester }>(
      `/api/beta-testers/${id}/send-invite`,
      {
        method: 'POST',
        body: JSON.stringify(links || {}),
      }
    );
  },

  /**
   * Envoi groupé d'invitations Google Play aux testeurs approuvés ou sélectionnés.
   */
  async bulkInvite(params?: {
    testerIds?: string[];
    playStoreWebLink?: string;
    playStoreAppLink?: string;
  }): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    message: string;
  }> {
    return fetchApi<{
      success: boolean;
      sentCount: number;
      failedCount: number;
      message: string;
    }>('/api/beta-testers/bulk-invite', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  },

  /**
   * Exporte les emails pour import direct Google Play Console.
   */
  async exportEmails(status?: TesterStatus): Promise<ExportEmailsResponse> {
    const qs = status ? `?status=${status}` : '';
    return fetchApi<ExportEmailsResponse>(`/api/beta-testers/export${qs}`);
  },

  /**
   * Supprime un testeur.
   */
  async deleteTester(id: string): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>(
      `/api/beta-testers/${id}`,
      {
        method: 'DELETE',
      }
    );
  },
};
