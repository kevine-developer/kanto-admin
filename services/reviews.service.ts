import { fetchApi } from '@/lib/api-client';

export type ReviewModerationStatus =
  | 'NOT_AUTHORIZED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type PublicDisplayNameType = 'FIRSTNAME' | 'PSEUDO' | 'ANONYMOUS';

export interface AdminReviewItem {
  id: string;
  rating: number;
  comment: string;
  category?: string | null;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    image?: string | null;
  } | null;
  authorName?: string | null;
  authorEmail?: string | null;
  isPublicationAuthorized: boolean;
  publicDisplayNameType: PublicDisplayNameType;
  publicDisplayName?: string | null;
  consentDate?: string | null;
  consentWithdrawnDate?: string | null;
  consentVersion?: string | null;
  moderationStatus: ReviewModerationStatus;
  moderatorNote?: string | null;
  moderatedAt?: string | null;
  moderatedBy?: string | null;
  appVersion?: string | null;
  platform?: string | null;
  deviceInfo?: string | null;
  authorKey?: string;
  authorTotalReviews?: number;
  authorApprovedReviewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewsResponse {
  data: AdminReviewItem[];
  summary?: {
    approvedCount: number;
    pendingCount: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminReviewsFilterParams {
  page?: number;
  limit?: number;
  rating?: number;
  status?: string;
  search?: string;
}

export const adminReviewsService = {
  /**
   * Récupère la liste filtrée et paginée des avis pour l'administration
   */
  async getReviews(params?: AdminReviewsFilterParams): Promise<AdminReviewsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.rating) query.set('rating', String(params.rating));
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search && params.search.trim()) query.set('search', params.search.trim());

    const qs = query.toString();
    return fetchApi<AdminReviewsResponse>(`/api/admin/reviews${qs ? `?${qs}` : ''}`);
  },

  /**
   * Modère un avis (Approuver, Rejeter, Remettre en attente)
   * Note : La note attribuée (rating) et le texte (comment) ne peuvent JAMAIS être altérés.
   */
  async moderateReview(
    reviewId: string,
    status: 'APPROVED' | 'REJECTED' | 'PENDING',
    moderatorNote?: string,
  ): Promise<{
    success: boolean;
    id: string;
    moderationStatus: string;
    replacedReviewIds?: string[];
  }> {
    return fetchApi<{
      success: boolean;
      id: string;
      moderationStatus: string;
      replacedReviewIds?: string[];
    }>(`/api/admin/reviews/${reviewId}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ status, moderatorNote }),
    });
  },

  /**
   * Sélectionne ou retire un lot d'avis à afficher sur app-kanto.gastsar.fr
   */
  async batchModerateReviews(
    reviewIds: string[],
    status: 'APPROVED' | 'REJECTED' | 'PENDING',
    moderatorNote?: string,
  ): Promise<{
    success: boolean;
    updatedCount: number;
    replacedReviewIds: string[];
    status: string;
  }> {
    return fetchApi<{
      success: boolean;
      updatedCount: number;
      replacedReviewIds: string[];
      status: string;
    }>('/api/admin/reviews/batch-visibility', {
      method: 'PATCH',
      body: JSON.stringify({ reviewIds, status, moderatorNote }),
    });
  },
};

