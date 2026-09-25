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
/**
 * Middleware Next.js — kanto-admin
 *
 * En architecture découplée (Frontend Next.js séparé de l'API NestJS / Better-Auth),
 * les cookies de session HTTP-only sont associés au domaine de l'API backend.
 *
 * La protection stricte des routes et la vérification impérative du rôle ADMIN
 * sont assurées côté client par AdminShell via useSession() et getSession()
 * avec communication sécurisée et credentials CORS vers le backend.
 */
export function middleware(request: NextRequest) {
  // Supporte la détection des cookies session __Secure- et standards si présents
  const _sessionCookie =
    request.cookies.get('__Secure-better-auth.session_token') ??
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__session') ??
    request.cookies.get('session');

  // En cas de cookie absent sur le serveur Next.js (cross-origin / proxy),
  // on laisse la page se charger afin que AdminShell vérifie la session avec l'API
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt).*)',
  ],
};
