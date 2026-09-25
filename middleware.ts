import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de sécurité — Protection des routes admin côté serveur.
 *
 * Stratégie : le cookie de session `better-auth.session_token` est vérifié
 * avant de servir n'importe quelle page protégée. Sans cookie valide,
 * l'utilisateur est redirigé vers /login.
 *
 * La vérification stricte du rôle ADMIN reste côté client dans AdminShell
 * (double protection : serveur + client).
 *
 * Note : better-auth utilise des cookies HTTP-only signés — on vérifie
 * leur présence ici (signature cryptographique vérifiée par le backend).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Récupère le cookie de session better-auth (HTTP-only)
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__session') ??
    request.cookies.get('session');

  const isAuthenticated = !!sessionCookie?.value;

  // Si pas de session → redirection vers /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Conserve l'URL demandée pour redirection post-login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Matcher : toutes les routes protégées sauf :
 * - /login et /reset-password (pages publiques)
 * - /_next/* (assets Next.js)
 * - /favicon.ico et fichiers statiques
 */
export const config = {
  matcher: [
    '/((?!login|reset-password|_next/static|_next/image|favicon\\.ico|robots\\.txt).*)',
  ],
};
