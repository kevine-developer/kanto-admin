'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary critique racine (GlobalError) — enveloppe RootLayout.
 * Capturé uniquement en cas de défaillance du layout racine lui-même.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Kanto Admin] Erreur critique racine :', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0D0D0B',
          color: '#F0F0EC',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            <AlertTriangle size={26} color="#ef4444" />
          </div>

          <div>
            <h1
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                marginBottom: '0.375rem',
                color: '#F0F0EC',
              }}
            >
              Une erreur critique est survenue
            </h1>
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#9C9C98',
                lineHeight: 1.6,
              }}
            >
              Le Conservatoire Kanto a rencontré un problème inattendu au chargement de l&apos;interface.
            </p>
          </div>

          {error.digest && (
            <code
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'monospace',
                color: '#8B949E',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
              }}
            >
              Ref: {error.digest}
            </code>
          )}

          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                background: '#4A6741',
                color: '#FAF9F6',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} />
              Réessayer
            </button>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F0F0EC',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Home size={13} />
              Tableau de bord
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
