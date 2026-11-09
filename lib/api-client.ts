import { ApiResponse } from '@/types/common';
import { getAuthBaseUrl } from './auth-client';

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getAuthBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login') &&
      !window.location.pathname.startsWith('/reset-password')
    ) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/login';
    }

    let errorMsg = `Erreur HTTP ${response.status}`;
    try {
      const errJson = (await response.json()) as { message?: string };
      errorMsg = errJson.message || errorMsg;
    } catch {
      // Ignorer l'erreur de parsing JSON
    }
    throw new Error(errorMsg);
  }

  const text = await response.text();
  if (!text || text.trim().length === 0) {
    return null as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export type { ApiResponse };
