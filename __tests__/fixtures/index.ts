import { EventAdminItem, EventAdminOverview } from '@/services/events.service';
import { UserAccount } from '@/types';

export const mockUserAdmin = {
  id: 'usr-admin-1',
  name: 'Administrateur Kanto',
  email: 'admin@kanto.mg',
  role: 'ADMIN',
  image: null,
};

export const mockUserStandard = {
  id: 'usr-standard-2',
  name: 'Utilisateur Standard',
  email: 'user@kanto.mg',
  role: 'USER',
  image: null,
};

export const mockOverviewMetrics: EventAdminOverview = {
  metrics: {
    totalEvents: 12,
    draftCount: 2,
    scheduledCount: 3,
    activeCount: 5,
    completedCount: 2,
    cancelledCount: 0,
    suspendedCount: 0,
    totalRegistrations: 1450,
    completedParticipations: 920,
    totalRewardsDistributed: 350,
  },
  recentActivity: [
    {
      id: 'act-1',
      eventId: 'evt-1',
      eventTitle: 'Fihaonana Asaramanitra 2026',
      userId: 'usr-standard-2',
      userName: 'Soa Rakoto',
      score: 120,
      status: 'COMPLETED',
      registeredAt: '2026-10-25T10:00:00.000Z',
    },
  ],
};

export const mockEventsList: EventAdminItem[] = [
  {
    id: 'evt-1',
    slug: 'asaramanitra-2026',
    titleMg: 'Asaramanitra 2026',
    titleFr: 'Nouvel An Malagasy 2026',
    descriptionMg: 'Fankalazana ny taom-baovao malagasy.',
    descriptionFr: 'Célébration du nouvel an malgache.',
    category: 'CULTURE',
    status: 'ACTIVE',
    participationType: 'OPEN',
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2026-10-31T23:59:59.000Z',
    currentParticipantsCount: 420,
    viewsCount: 1500,
    sharesCount: 300,
    isFeatured: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
  },
  {
    id: 'evt-2',
    slug: 'quiz-ohabolana-fahavaratra',
    titleMg: 'Fanamby Ohabolana',
    titleFr: 'Défi Proverbes Malgaches',
    descriptionMg: 'Fanontaniana momba ny ohabolana.',
    descriptionFr: 'Quiz culturel sur les proverbes.',
    category: 'CHALLENGE',
    status: 'SCHEDULED',
    participationType: 'REGISTRATION_REQUIRED',
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: '2026-11-15T23:59:59.000Z',
    currentParticipantsCount: 85,
    viewsCount: 340,
    sharesCount: 50,
    isFeatured: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
];

export const mockUsersList: UserAccount[] = [
  {
    id: 'usr-1',
    name: 'Andry Rabe',
    email: 'andry@kanto.mg',
    role: 'ADMIN',
    tier: 'PREMIUM',
    emailVerified: true,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'usr-2',
    name: 'Bakoly Rasoa',
    email: 'bakoly@kanto.mg',
    role: 'USER',
    tier: 'FREE',
    emailVerified: true,
    createdAt: '2026-02-10T09:30:00.000Z',
    updatedAt: '2026-02-10T09:30:00.000Z',
  },
];
