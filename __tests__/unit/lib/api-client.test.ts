import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchApi } from '@/lib/api-client';

describe('lib/api-client - fetchApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('appelle fetch avec l\'URL préfixée et les credentials include', async () => {
    const mockData = { success: true, count: 5 };
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify(mockData)),
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const result = await fetchApi('/test-endpoint');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
    expect(calledUrl).toContain('/test-endpoint');
    expect(calledOptions?.credentials).toBe('include');
    expect((calledOptions?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(result).toEqual(mockData);
  });

  it('conserve une URL absolue commençant par http:// ou https://', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({ ok: true })),
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    await fetchApi('https://api.external.org/items');

    const [calledUrl] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('https://api.external.org/items');
  });

  it('propage les en-têtes personnalisés additionnels', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({ ok: true })),
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    await fetchApi('/protected', {
      headers: {
        'X-Custom-Header': 'KantoAdminValue',
      },
    });

    const [, calledOptions] = fetchSpy.mock.calls[0];
    const headers = calledOptions?.headers as Record<string, string>;
    expect(headers['X-Custom-Header']).toBe('KantoAdminValue');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('lance une exception avec le message d\'erreur renvoyé par le backend', async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ message: 'Droits administrateur requis pour cette action' }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    await expect(fetchApi('/admin/restricted')).rejects.toThrow(
      'Droits administrateur requis pour cette action'
    );
  });

  it('lance une exception générique avec le code HTTP si le corps de l\'erreur n\'est pas du JSON', async () => {
    const mockResponse = {
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new Error('SyntaxError')),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    await expect(fetchApi('/failing-service')).rejects.toThrow('Erreur HTTP 502');
  });

  it('retourne null si la réponse renvoyée est vide ou ne contient que des espaces', async () => {
    const mockResponse = {
      ok: true,
      status: 204,
      text: vi.fn().mockResolvedValue('   '),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const result = await fetchApi('/empty');
    expect(result).toBeNull();
  });

  it('retourne le texte brut si le corps n\'est pas du JSON valide', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('REPONSE_TEXTE_BRUT'),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const result = await fetchApi('/raw');
    expect(result).toBe('REPONSE_TEXTE_BRUT');
  });
});

