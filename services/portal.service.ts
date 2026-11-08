import { fetchApi } from '@/lib/api-client';

export interface PartnerProfile {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  email: string;
  phone?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  websiteUrl?: string | null;
  address?: string | null;
  socialLinks?: Record<string, string> | null;
  verifiedAt?: string | null;
  createdAt: string;
  _count?: {
    events: number;
    apiKeys: number;
    marketingRequests: number;
  };
}

export interface PartnerDashboardStats {
  partnerId: string;
  partnerName: string;
  partnerStatus: string;
  totalEvents: number;
  activeEvents: number;
  pendingReviewEvents: number;
  totalParticipants: number;
  totalViews: number;
  totalShares: number;
  activeApiKeys: number;
  marketingRequestsCount: number;
}

export interface PartnerApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  environment: 'LIVE' | 'TEST';
  rateLimit: number;
  lastUsedAt?: string | null;
  lastUsedIp?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  createdAt: string;
}

export interface CreateApiKeyResult {
  apiKey: PartnerApiKeyItem;
  secretKey: string;
  warning: string;
}

export interface PartnerApiLogItem {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  responseTimeMs?: number | null;
  createdAt: string;
}

export const partnerPortalService = {
  /**
   * Enregistrement d'une nouvelle organisation partenaire
   */
  async register(data: {
    name: string;
    type: string;
    email: string;
    phone?: string;
    description?: string;
    websiteUrl?: string;
    address?: string;
  }): Promise<PartnerProfile> {
    return fetchApi('/partners/portal/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Récupère le profil du partenaire connecté
   */
  async getMyProfile(): Promise<PartnerProfile> {
    return fetchApi('/partners/portal/me');
  },

  /**
   * Met à jour le profil de l'organisation
   */
  async updateMyProfile(data: Partial<PartnerProfile>): Promise<PartnerProfile> {
    return fetchApi('/partners/portal/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Statistiques consolidées du dashboard
   */
  async getDashboardStats(): Promise<PartnerDashboardStats> {
    return fetchApi('/partners/portal/dashboard');
  },

  /**
   * Liste les clés API du partenaire
   */
  async listApiKeys(): Promise<PartnerApiKeyItem[]> {
    return fetchApi('/partners/portal/api-keys');
  },

  /**
   * Génère une nouvelle clé API
   */
  async createApiKey(data: {
    name: string;
    scopes: string[];
    environment?: 'LIVE' | 'TEST';
    expiresInDays?: number;
    rateLimit?: number;
  }): Promise<CreateApiKeyResult> {
    return fetchApi('/partners/portal/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Révoque une clé API
   */
  async revokeApiKey(keyId: string): Promise<{ success: boolean; id: string }> {
    return fetchApi(`/partners/portal/api-keys/${encodeURIComponent(keyId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Logs d'appels récents
   */
  async getApiLogs(limit = 50): Promise<PartnerApiLogItem[]> {
    return fetchApi(`/partners/portal/api-logs?limit=${limit}`);
  },
};

