import { fetchApi } from '@/lib/api-client';

export interface ReferralConfig {
  id: string;
  isEnabled: boolean;
  referrerXp: number;
  referrerCoins: number;
  refereeXp: number;
  refereeCoins: number;
  maxRewardsPerReferrer: number;
  requireFirstActivity: boolean;
  welcomeMessageMg?: string | null;
  welcomeMessageFr?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface ReferralAdminOverview {
  config: ReferralConfig;
  metrics: {
    totalCodes: number;
    totalClicks: number;
    totalReferrals: number;
    pendingCount: number;
    completedCount: number;
    rejectedCount: number;
    conversionRate: number;
    totalXpDistributed: number;
    totalCoinsDistributed: number;
  };
}

export interface AdminReferralItem {
  id: string;
  code: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';
  referrerId: string;
  refereeId: string;
  referrerXpAwarded: number;
  referrerCoinsAwarded: number;
  refereeXpAwarded: number;
  refereeCoinsAwarded: number;
  completedAt: string | null;
  createdAt: string;
  referrer: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  };
  referee: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  };
}

export interface AdminReferralsListResponse {
  items: AdminReferralItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const adminReferralService = {
  /**
   * Récupère les métriques globales et la configuration du parrainage.
   */
  async getOverview(): Promise<ReferralAdminOverview> {
    return fetchApi<ReferralAdminOverview>('/referral/admin/overview');
  },

  /**
   * Récupère la liste paginée des parrainages avec filtres.
   */
  async getList(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<AdminReferralsListResponse> {
    const qs = new URLSearchParams();
    if (params.page) qs.append('page', params.page.toString());
    if (params.limit) qs.append('limit', params.limit.toString());
    if (params.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params.search && params.search.trim()) qs.append('search', params.search.trim());

    const url = `/referral/admin/list${qs.toString() ? `?${qs.toString()}` : ''}`;
    return fetchApi<AdminReferralsListResponse>(url);
  },

  /**
   * Récupère la configuration actuelle du parrainage.
   */
  async getConfig(): Promise<ReferralConfig> {
    return fetchApi<ReferralConfig>('/referral/admin/config');
  },

  /**
   * Met à jour les paramètres du programme de parrainage.
   */
  async updateConfig(payload: Partial<ReferralConfig>): Promise<ReferralConfig> {
    return fetchApi<ReferralConfig>('/referral/admin/config', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
