import { fetchApi } from '@/lib/api-client';

export type EventCategory =
  | 'CULTURE'
  | 'CHALLENGE'
  | 'REWARD'
  | 'SEASONAL'
  | 'COMMUNITY'
  | 'SPECIAL';

export type EventStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type EventParticipationType = 'OPEN' | 'REGISTRATION_REQUIRED' | 'EXCLUSIVE_TIER';

export type EventRewardType =
  | 'XP'
  | 'COINS'
  | 'BADGE'
  | 'PREMIUM_ACCESS'
  | 'PHYSICAL_LOT'
  | 'CUSTOM';

export interface EventRewardItem {
  id: string;
  eventId: string;
  rewardType: EventRewardType;
  titleMg: string;
  titleFr: string;
  amount?: number | null;
  badgeId?: string | null;
  lotDescription?: string | null;
  criteria?: string | null;
  maxWinners?: number | null;
  claimsCount?: number;
}

export interface EventAdminItem {
  id: string;
  slug: string;
  titleMg: string;
  titleFr: string;
  shortDescMg?: string | null;
  shortDescFr?: string | null;
  descriptionMg: string;
  descriptionFr: string;
  category: EventCategory;
  status: EventStatus;
  participationType: EventParticipationType;
  minTier?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  location?: string | null;
  externalUrl?: string | null;
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
  maxParticipants?: number | null;
  currentParticipantsCount: number;
  viewsCount: number;
  sharesCount: number;
  isFeatured: boolean;
  rulesMg?: string | null;
  rulesFr?: string | null;
  metadata?: any;
  cancelledReason?: string | null;
  createdAt: string;
  updatedAt: string;
  rewards?: EventRewardItem[];
  _count?: {
    participations: number;
    leaderboardEntries: number;
  };
}

export interface EventAdminOverviewMetrics {
  totalEvents: number;
  draftCount: number;
  scheduledCount: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  suspendedCount: number;
  totalRegistrations: number;
  completedParticipations: number;
  totalRewardsDistributed: number;
}

export interface EventRecentActivityItem {
  id: string;
  eventId: string;
  eventTitle: string;
  eventCategory?: EventCategory;
  userId: string;
  userName: string;
  userEmail?: string | null;
  userAvatar?: string | null;
  status: string;
  score: number;
  registeredAt: string;
  completedAt?: string | null;
}

export interface EventAdminOverview {
  metrics: EventAdminOverviewMetrics;
  recentActivity: EventRecentActivityItem[];
}

export interface AdminEventParticipantItem {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string | null;
  userAvatar?: string | null;
  status: string;
  score: number;
  progressPercent: number;
  registeredAt: string;
  completedAt?: string | null;
}

export interface AdminEventParticipantsResponse {
  items: AdminEventParticipantItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminEventsListResponse {
  items: EventAdminItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateEventInput {
  slug?: string;
  titleMg: string;
  titleFr: string;
  shortDescMg?: string;
  shortDescFr?: string;
  descriptionMg: string;
  descriptionFr: string;
  category: EventCategory;
  participationType?: EventParticipationType;
  minTier?: string;
  imageUrl?: string;
  bannerUrl?: string;
  location?: string;
  externalUrl?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  isFeatured?: boolean;
  rulesMg?: string;
  rulesFr?: string;
  metadata?: any;
  rewards?: {
    rewardType: EventRewardType;
    titleMg: string;
    titleFr: string;
    amount?: number;
    badgeId?: string;
    lotDescription?: string;
    criteria?: string;
    maxWinners?: number;
  }[];
}

export const eventsAdminService = {
  /**
   * Récupère le tableau de bord des métriques calculées en direct sur PostgreSQL
   */
  async getOverview(): Promise<EventAdminOverview> {
    return fetchApi<EventAdminOverview>('/events/admin/overview');
  },

  /**
   * Récupère la liste paginée et filtrée des événements (admin)
   */
  async getEvents(params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
  } = {}): Promise<AdminEventsListResponse> {
    const qs = new URLSearchParams();
    if (params.page) qs.append('page', params.page.toString());
    if (params.limit) qs.append('limit', params.limit.toString());
    if (params.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params.category && params.category !== 'ALL') qs.append('category', params.category);
    if (params.search && params.search.trim()) qs.append('search', params.search.trim());

    const url = `/events/admin/all${qs.toString() ? `?${qs.toString()}` : ''}`;
    return fetchApi<AdminEventsListResponse>(url);
  },

  /**
   * Récupère la fiche détaillée d'un événement
   */
  async getEvent(idOrSlug: string): Promise<EventAdminItem> {
    return fetchApi<EventAdminItem>(`/events/${encodeURIComponent(idOrSlug)}`);
  },

  /**
   * Crée un nouvel événement
   */
  async createEvent(input: CreateEventInput): Promise<EventAdminItem> {
    return fetchApi<EventAdminItem>('/events/admin/create', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Modifie un événement existant
   */
  async updateEvent(id: string, input: Partial<CreateEventInput>): Promise<EventAdminItem> {
    return fetchApi<EventAdminItem>(`/events/admin/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  /**
   * Met à jour le statut du cycle de vie (Publier, Suspendre, Annuler, Terminer)
   */
  async updateStatus(
    id: string,
    status: EventStatus,
    cancelledReason?: string
  ): Promise<EventAdminItem> {
    return fetchApi<EventAdminItem>(`/events/admin/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancelledReason }),
    });
  },

  /**
   * Ajoute une récompense à un événement existant
   */
  async addReward(
    id: string,
    reward: {
      rewardType: EventRewardType;
      titleMg: string;
      titleFr: string;
      amount?: number;
      badgeId?: string;
      lotDescription?: string;
      criteria?: string;
      maxWinners?: number;
    }
  ): Promise<EventRewardItem> {
    return fetchApi<EventRewardItem>(`/events/admin/${encodeURIComponent(id)}/rewards`, {
      method: 'POST',
      body: JSON.stringify(reward),
    });
  },

  /**
   * Récupère la liste réelle des participants d'un événement
   */
  async getParticipants(
    id: string,
    params: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {}
  ): Promise<AdminEventParticipantsResponse> {
    const qs = new URLSearchParams();
    if (params.page) qs.append('page', params.page.toString());
    if (params.limit) qs.append('limit', params.limit.toString());
    if (params.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params.search && params.search.trim()) qs.append('search', params.search.trim());

    const url = `/events/admin/${encodeURIComponent(id)}/participants${
      qs.toString() ? `?${qs.toString()}` : ''
    }`;
    return fetchApi<AdminEventParticipantsResponse>(url);
  },

  /**
   * Supprime définitivement un brouillon ou archive un événement avec historique
   */
  async deleteEvent(id: string): Promise<{
    success: boolean;
    action: 'DELETED' | 'ARCHIVED';
    message: string;
  }> {
    return fetchApi<{
      success: boolean;
      action: 'DELETED' | 'ARCHIVED';
      message: string;
    }>(`/events/admin/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
