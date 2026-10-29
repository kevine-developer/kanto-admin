import { describe, it, expect, vi, beforeEach } from 'vitest';
import { systemService } from '@/services/system.service';
import * as apiClient from '@/lib/api-client';
import { mockUsersList } from '../../fixtures';

describe('services/system.service - systemService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getUsers() sérialise les paramètres de pagination et filtres', async () => {
    const mockRes = {
      data: mockUsersList,
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    };
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue(mockRes);

    const res = await systemService.getUsers({
      page: 1,
      limit: 20,
      search: 'rabe',
      role: 'ADMIN',
      status: 'ALL', // Ignoré car ALL
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const calledUrl = spy.mock.calls[0][0];
    expect(calledUrl).toContain('/admin/users');
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('search=rabe');
    expect(calledUrl).toContain('role=ADMIN');
    expect(calledUrl).not.toContain('status=ALL');
    expect(res.data).toHaveLength(2);
  });

  it('getNotifications() renvoie un tableau vide par défaut si la réponse est falsy', async () => {
    vi.spyOn(apiClient, 'fetchApi').mockResolvedValue(null);

    const notifications = await systemService.getNotifications();
    expect(notifications).toEqual([]);
  });

  it('createNotification() envoie une requête POST avec les données fournies', async () => {
    const notifData = {
      titleMg: 'Fanavaozana lehibe',
      titleFr: 'Mise à jour majeure',
      messageMg: 'Kinova vaovao',
      messageFr: 'Nouvelle version du conservatoire disponible',
      category: 'SYSTEM',
    };
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue({ id: 'notif-1', ...notifData });

    const created = await systemService.createNotification(notifData);

    expect(spy).toHaveBeenCalledWith('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(notifData),
    });
    expect(created.id).toBe('notif-1');
  });

  it('deleteNotification() envoie une requête DELETE', async () => {
    const spy = vi.spyOn(apiClient, 'fetchApi').mockResolvedValue({});

    await systemService.deleteNotification('notif-123');

    expect(spy).toHaveBeenCalledWith('/admin/notifications/notif-123', {
      method: 'DELETE',
    });
  });
});
