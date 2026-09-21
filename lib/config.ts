/**
 * Configuration centralisée des URLs du backend Kanto.
 * Évite d'avoir à déclarer des variables d'environnement publiques (NEXT_PUBLIC_*) en production.
 */
export const PRODUCTION_API_URL = 'https://api-kanto.gastsar.fr';
export const LOCAL_API_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  const isProd = process.env.NODE_ENV === 'production';

  // 1. RÈGLE STRICTE EN PRODUCTION : Ne jamais utiliser localhost
  if (isProd) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return PRODUCTION_API_URL;
  }

  // 2. Détection côté client (navigateur)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // En environnement local (localhost / IP privée de dev)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || LOCAL_API_URL;
    }

    const isLocalIp =
      /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.)/.test(hostname);
    if (isLocalIp) {
      return `http://${hostname}:3000`;
    }

    // Dès qu'on est sur un domaine public (ex: admin.kanto.mg, *.vercel.app)
    return PRODUCTION_API_URL;
  }

  // 3. Fallback développement local (serveur Next.js)
  return process.env.NEXT_PUBLIC_API_URL || LOCAL_API_URL;
}
