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

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  image?: string | null;
}
