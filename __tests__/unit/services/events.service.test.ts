import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventsAdminService, CreateEventInput } from '@/services/events.service';
import * as apiClient from '@/lib/api-client';
import { mockEventsList, mockOverviewMetrics } from '../../fixtures';

describe('services/events.service - eventsAdminService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getOverview() appelle /events/admin/overview et renvoie les métriques', async () => {
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue(mockOverviewMetrics);

    const data = await eventsAdminService.getOverview();

    expect(spy).toHaveBeenCalledWith('/events/admin/overview');
    expect(data.metrics.totalEvents).toBe(12);
    expect(data.recentActivity).toHaveLength(1);
  });

  it('getEvents() construit la query string sans inclure ALL pour le statut et la catégorie', async () => {
    const mockResponse = {
      items: mockEventsList,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
    };
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue(mockResponse);

    await eventsAdminService.getEvents({
      page: 2,
      limit: 15,
      status: 'ACTIVE',
      category: 'ALL', // doit être ignoré
      search: 'asaramanitra',
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const calledUrl = spy.mock.calls[0][0];
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=15');
    expect(calledUrl).toContain('status=ACTIVE');
    expect(calledUrl).toContain('search=asaramanitra');
    expect(calledUrl).not.toContain('category=ALL');
  });

  it('getEvent() encode correctement le slug ou ID dans l\'URL', async () => {
    const singleEvent = mockEventsList[0];
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue(singleEvent);

    const result = await eventsAdminService.getEvent('defi/proverbes 2026');

    expect(spy).toHaveBeenCalledWith('/events/defi%2Fproverbes%202026');
    expect(result.id).toBe('evt-1');
  });

  it('createEvent() envoie une requête POST avec le corps JSON', async () => {
    const input: CreateEventInput = {
      titleMg: 'Hetsika Vaovao',
      titleFr: 'Nouvel Événement',
      descriptionMg: 'Famaritana',
      descriptionFr: 'Description en français',
      category: 'CULTURE',
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-11-10T00:00:00.000Z',
    };
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue({
      id: 'new-evt-1',
      ...input,
    });

    const res = await eventsAdminService.createEvent(input);

    expect(spy).toHaveBeenCalledTimes(1);
    const [endpoint, options] = spy.mock.calls[0];
    expect(endpoint).toBe('/events/admin/create');
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body as string)).toMatchObject({
      titleMg: 'Hetsika Vaovao',
      category: 'CULTURE',
    });
    expect(res.id).toBe('new-evt-1');
  });

  it('deleteEvent() envoie une requête DELETE vers /events/admin/:id', async () => {
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue({ success: true });

    await eventsAdminService.deleteEvent('evt-to-delete');

    expect(spy).toHaveBeenCalledWith('/events/admin/evt-to-delete', {
      method: 'DELETE',
    });
  });

  it('updateStatus() transmet le nouveau statut et le motif via PATCH', async () => {
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue({ success: true });

    await eventsAdminService.updateStatus('evt-1', 'CANCELLED', 'Reporté pour cause météo');

    expect(spy).toHaveBeenCalledWith('/events/admin/evt-1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED', cancelledReason: 'Reporté pour cause météo' }),
    });
  });
});
