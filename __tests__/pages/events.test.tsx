import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPage from '@/app/events/page';
import { eventsAdminService } from '@/services/events.service';
import { useSearchParams } from 'next/navigation';
import { renderWithProviders } from '../utils/test-utils';
import { mockEventsList, mockOverviewMetrics } from '../fixtures';

vi.mock('@/services/events.service', () => ({
  eventsAdminService: {
    getOverview: vi.fn(),
    getEvents: vi.fn(),
    createEvent: vi.fn(),
    deleteEvent: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

// Mock AdminShell pour se focaliser sur le contenu de EventsPage
vi.mock('@/components/layout/AdminShell', () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-admin-shell">{children}</div>
  ),
}));

describe('app/events/page - Gestion des Événements & Célébrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );
    vi.mocked(eventsAdminService.getOverview).mockResolvedValue(mockOverviewMetrics);
    vi.mocked(eventsAdminService.getEvents).mockResolvedValue({
      items: mockEventsList,
      pagination: { total: 2, page: 1, limit: 12, totalPages: 1 },
    });
  });

  it('charge et affiche la liste des événements et les métriques', async () => {
    renderWithProviders(<EventsPage />);

    // Vérifie que les données d'événements apparaissent à l'écran
    await waitFor(() => {
      expect(screen.getByText('Asaramanitra 2026')).toBeInTheDocument();
      expect(screen.getByText('Fanamby Ohabolana')).toBeInTheDocument();
    });

    expect(eventsAdminService.getOverview).toHaveBeenCalledTimes(1);
    expect(eventsAdminService.getEvents).toHaveBeenCalledTimes(1);
  });

  it('ouvre automatiquement le modal de création si ?create=true est présent dans l\'URL', async () => {
    const params = new URLSearchParams({ create: 'true' }) as unknown as ReturnType<
      typeof useSearchParams
    >;
    vi.mocked(useSearchParams).mockReturnValue(params);

    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Nouvel Événement/i })
      ).toBeInTheDocument();
    });
  });

  it('ouvre le modal de création lors du clic sur le bouton Créer un événement', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText('Asaramanitra 2026')).toBeInTheDocument();
    });

    const createBtn = screen.getByRole('button', { name: /Créer un événement/i });
    await user.click(createBtn);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Nouvel Événement/i })
      ).toBeInTheDocument();
    });
  });
});
