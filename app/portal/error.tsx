'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Kanto Partners Portal] Erreur :', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-[65vh] w-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">
            Impossible de charger cet écran
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Une erreur inattendue est survenue dans votre espace organisateur. Vous pouvez réessayer ou revenir au tableau de bord partenaire.
          </p>
        </div>

        {error.digest && (
          <code className="text-[11px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-md">
            Réf : {error.digest}
          </code>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={reset}
            className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>

          <Link
            href="/portal"
            className="w-full sm:flex-1 py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-xs font-medium flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Accueil Portail</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
