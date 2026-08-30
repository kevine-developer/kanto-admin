/**
 * Résout une URL d'image ou d'audio pour l'administration Kanto.
 * Gère les URLs Cloudinary absolues, data URIs, et préfixes d'API locale/production.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

  // Nettoyage des anciennes IP fixes de développement si présentes dans la base
  if (url.includes('192.168.1.100:3000')) {
    return url.replace('http://192.168.1.100:3000', backendBase);
  }

  // URL déjà absolue ou data URI
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // URL relative backend
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
}

/**
 * Convertit un nombre entier en chiffre romain.
 */
export function toRoman(num: number): string {
  const map: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let res = '';
  let n = num;
  for (const [v, r] of map) {
    while (n >= v) {
      res += r;
      n -= v;
    }
  }
  return res || 'I';
}

/**
 * Mélange aléatoirement un tableau (algorithme de Fisher-Yates).
 */
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Génère un slug normalisé à partir d'une chaîne de caractères.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
