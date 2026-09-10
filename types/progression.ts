export interface ProgressionStats {
  totalPlayers: number;
  totalXpDistributed: number;
  totalCoinsDistributed: number;
  maxLevel: number;
  highestXp: number;
  maxStreakDays: number;
  averageLevel: number;
  activeStreaksCount: number;
  levelDistribution: Record<number, number>;
}

export interface LeaderboardUserItem {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  totalXP: number;
  level: number;
  streakDays: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardUserItem[];
  totalPlayers: number;
  period: 'alltime' | 'day' | 'week' | 'month';
}

export interface CulturalRank {
  level: number;
  minXp: number;
  titleMg: string;
  titleFr: string;
  color: string;
  descriptionMg: string;
  descriptionFr: string;
}
