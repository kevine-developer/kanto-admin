'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary de segment — capte les erreurs runtime des routes dans RootLayout.
 */
export default function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Kanto Admin] Erreur non gérée :', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 text-center flex flex-col items-center gap-5 shadow-sm">
        <div className="w-14 h-14 rounded-2xl border border-rose-500/25 bg-rose-500/10 flex items-center justify-center text-rose-500">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            Une erreur inattendue est survenue
          </h1>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Le Conservatoire Kanto a rencontré un problème lors de l&apos;affichage de cette page. Vous pouvez réessayer ou revenir au tableau de bord.
          </p>
        </div>

        {error.digest && (
          <code className="text-[11px] font-mono text-[var(--text-subtle)] bg-[var(--background)] border border-[var(--card-border)] px-3 py-1 rounded-md">
            Réf : {error.digest}
          </code>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
          <button
            type="button"
            onClick={reset}
            className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>

          <Link
            href="/"
            className="w-full sm:flex-1 py-2 px-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--card-hover)] transition text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Tableau de bord</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
