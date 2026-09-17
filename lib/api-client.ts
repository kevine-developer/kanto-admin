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
    let errorMsg = `Erreur HTTP ${response.status}`;
    try {
      const errJson = (await response.json()) as { message?: string };
      errorMsg = errJson.message || errorMsg;
    } catch {
      // Ignorer l'erreur de parsing JSON
    }
    throw new Error(errorMsg);
  }

  return (await response.json()) as T;
}

export type { ApiResponse };
