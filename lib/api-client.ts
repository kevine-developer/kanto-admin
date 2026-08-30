import { ApiResponse } from '@/types/common';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

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
