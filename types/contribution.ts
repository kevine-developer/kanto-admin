export type ContributionCategory = 'KABARY' | 'PROVERBE' | 'CITATION' | 'CONTE';

export type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface ContributionItem {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ContributionStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
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
