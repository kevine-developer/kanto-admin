import { fetchApi } from '@/lib/api-client';

export type PartnerType =
  | 'ASSOCIATION'
  | 'COMPANY'
  | 'INSTITUTION'
  | 'INDEPENDENT_ORGANIZER'
  | 'DEVELOPER'
  | 'OTHER';

export type PartnerStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'SUSPENDED'
  | 'REJECTED';

export type EventModerationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type MarketingRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PENDING_PAYMENT'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PartnerItem {
  id: string;
  name: string;
  slug: string;
  type: PartnerType;
  status: PartnerStatus;
  email: string;
  phone?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  _count?: {
    events: number;
    apiKeys: number;
    marketingRequests: number;
  };
}

export interface PartnerEventItem {
  id: string;
  slug: string;
  titleFr: string;
  titleMg: string;
  descriptionFr: string;
  category: string;
  status: string;
  moderationStatus: EventModerationStatus;
  moderationRejectionReason?: string | null;
  startDate: string;
  endDate: string;
  currentParticipantsCount: number;
  maxParticipants?: number | null;
  imageUrl?: string | null;
  partner?: {
    id: string;
    name: string;
    slug: string;
    type: PartnerType;
    status: PartnerStatus;
    logoUrl?: string | null;
  };
}

export interface MarketingRequestItem {
  id: string;
  status: MarketingRequestStatus;
  requestedStartDate: string;
  requestedEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  campaignGoals?: string | null;
  targetAudience?: string | null;
  proposedBudget?: number | null;
  currency?: string | null;
  impressionsCount: number;
  clicksCount: number;
  conversionsCount: number;
  messages?: Array<{
    senderRole: 'PARTNER' | 'ADMIN';
    senderName: string;
    text: string;
    sentAt: string;
  }>;
  partner: {
    id: string;
    name: string;
    slug: string;
    email: string;
    type: PartnerType;
  };
  event: {
    id: string;
    titleFr: string;
    titleMg: string;
    slug: string;
  };
  placements: Array<{
    placement: {
      id: string;
      code: string;
      nameFr: string;
      basePrice?: number | null;
    };
  }>;
  createdAt: string;
}

export const partnersAdminService = {
  // ─── Partenaires (Organisations) ──────────────────────────────────────────

  async getPartners(params?: {
    status?: PartnerStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: PartnerItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return fetchApi(`/admin/partners${qs ? `?${qs}` : ''}`);
  },

  async getPartnerDetails(id: string): Promise<PartnerItem> {
    return fetchApi(`/admin/partners/${encodeURIComponent(id)}`);
  },

  async verifyPartner(
    id: string,
    data: {
      status: PartnerStatus;
      rejectionReason?: string;
    }
  ): Promise<PartnerItem> {
    return fetchApi(`/admin/partners/${encodeURIComponent(id)}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ─── Modération des événements partenaires ────────────────────────────────

  async getPartnerEvents(params?: {
    moderationStatus?: EventModerationStatus;
    partnerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: PartnerEventItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.moderationStatus) query.set('moderationStatus', params.moderationStatus);
    if (params?.partnerId) query.set('partnerId', params.partnerId);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return fetchApi(`/admin/partners/events/list${qs ? `?${qs}` : ''}`);
  },

  async reviewPartnerEvent(
    eventId: string,
    data: {
      decision: EventModerationStatus;
      rejectionReason?: string;
    }
  ): Promise<PartnerEventItem> {
    return fetchApi(
      `/admin/partners/events/${encodeURIComponent(eventId)}/review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  // ─── Prestations Marketing ─────────────────────────────────────────────────

  async getMarketingRequests(params?: {
    status?: MarketingRequestStatus;
    partnerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: MarketingRequestItem[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.partnerId) query.set('partnerId', params.partnerId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return fetchApi(`/admin/partners/marketing/requests${qs ? `?${qs}` : ''}`);
  },

  async getMarketingRequestDetails(id: string): Promise<MarketingRequestItem> {
    return fetchApi(
      `/admin/partners/marketing/requests/${encodeURIComponent(id)}`
    );
  },

  async reviewMarketingRequest(
    requestId: string,
    data: {
      status: MarketingRequestStatus;
      actualStartDate?: string;
      actualEndDate?: string;
      adminFeedback?: string;
    }
  ): Promise<MarketingRequestItem> {
    return fetchApi(
      `/admin/partners/marketing/requests/${encodeURIComponent(requestId)}/review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  async sendMarketingMessage(
    requestId: string,
    message: string
  ): Promise<{ success: boolean; message: unknown }> {
    return fetchApi(
      `/admin/partners/marketing/requests/${encodeURIComponent(requestId)}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      }
    );
  },
};

