export type ContributionCategory = 'KABARY' | 'PROVERBE' | 'CITATION' | 'CONTE';

export type ContributionStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface ContributionAuditLog {
  id: string;
  contributionId: string;
  userId?: string | null;
  userRole?: string | null;
  action: string;
  fromStatus?: ContributionStatus | null;
  toStatus?: ContributionStatus | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ContributionItem {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  category: ContributionCategory;
  title: string;
  titleFr?: string;
  content: string;
  contentFr?: string;
  author?: string;
  explanation?: string;
  explanationFr?: string;
  context?: string;
  origin?: string;
  theme?: string;
  status: ContributionStatus;
  score: number;
  upvotesCount: number;
  downvotesCount: number;
  viewsCount?: number;
  commentsCount?: number;
  // Modération automatique
  moderationFlagged?: boolean;
  moderationCategories?: string[];
  moderationReason?: string | null;
  moderationDetails?: Record<string, unknown> | null;
  moderatedAt?: string | null;
  adminFeedback?: string | null;
  adminReviewedBy?: string | null;
  adminReviewedAt?: string | null;
  lastNotificationSentAt?: string | null;
  // Doublons
  duplicateScore?: number | null;
  duplicateOfId?: string | null;
  duplicateTypeOf?: string | null;
  duplicateTargetTitle?: string | null;
  isDuplicateConfirmed?: boolean;
  markedForDeletionAt?: string | null;
  disputeStatus?: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  disputeMessage?: string | null;
  disputedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContributionStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalFlagged?: number;
  totalChangesRequested?: number;
  totalReportsPending: number;
  approvedThisWeek: number;
  weeklyTarget: number;
}

export interface ContentReport {
  id: string;
  contentId: string;
  contentType: string;
  reportedBy: string;
  reporterName?: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  contribution?: Partial<ContributionItem>;
}
