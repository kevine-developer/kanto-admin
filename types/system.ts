export interface NotificationItem {
  id: string;
  titleMg: string;
  titleFr?: string | null;
  messageMg: string;
  messageFr?: string | null;
  category: string;
  badgeText?: string | null;
  badgeType?: string | null;
  iconName?: string | null;
  iconColor?: string | null;
  targetRoute?: string | null;
  isBroadcast: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'MODERATOR' | 'CONTRIBUTOR' | 'USER';
export type SubscriptionTier = 'FREE' | 'PREMIUM';

export interface UserAccount {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  tier: SubscriptionTier;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt: string;
  updatedAt: string;
  image?: string | null;
  _count?: {
    favorites: number;
    likes: number;
    contributions?: number;
    quizSets?: number;
    reports?: number;
  };
}

export interface UserDetails {
  user: UserAccount & {
    termsAcceptedAt?: string | null;
    termsVersion?: string | null;
  };
  accounts: {
    id: string;
    providerId: string;
    createdAt: string;
  }[];
  progress?: {
    level: number;
    totalXp: number;
    currentStreak: number;
    highestStreak: number;
  } | null;
  metrics: {
    counts: Record<string, number>;
    contributions: {
      pending: number;
      approved: number;
      rejected: number;
      total: number;
    };
  };
  reportsAgainstUser: {
    id: string;
    reason: string;
    description?: string | null;
    resolved: boolean;
    createdAt: string;
  }[];
}

export interface DashboardMetrics {
  period: string;
  users: {
    total: number;
    newInPeriod: number;
    banned: number;
    premium: number;
    roles: {
      admin: number;
      moderator: number;
      contributor: number;
      user: number;
    };
  };
  content: {
    contes: {
      total: number;
      withAudioMg: number;
      withAudioFr: number;
      audioCoverageMg: number;
      audioCoverageFr: number;
    };
    items: number;
    citations: number;
    kabary: number;
    poesies: number;
  };
  moderation: {
    pendingContributions: number;
    disputedContributions: number;
    pendingReports: number;
    flaggedContributions: number;
    totalUrgent: number;
  };
  activity: {
    ugcQuizSets: number;
  };
  system: {
    databaseHealthy: boolean;
    lockedModules: number;
    activeAnnouncements: number;
  };
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  userName?: string | null;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel?: string | null;
  reason?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

