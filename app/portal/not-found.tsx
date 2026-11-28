import Link from 'next/link';
import { Compass, LayoutDashboard } from 'lucide-react';
import { BackButton } from '@/components/feedback/BackButton';

export default function PortalNotFound() {
  return (
    <div className="min-h-[65vh] w-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center text-center space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-emerald-400">
            <Compass className="w-7 h-7 stroke-[1.75]" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wider uppercase border border-zinc-700 bg-zinc-900 text-zinc-400">
            Erreur 404 &bull; Portail Partenaires
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">
            Page introuvable
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            La ressource demandée dans votre espace organisateur n&apos;existe pas ou n&apos;est plus disponible.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
          <Link
            href="/portal"
            className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs font-semibold flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Accueil Portail</span>
          </Link>

          <BackButton
            fallbackHref="/portal"
            className="w-full sm:flex-1 py-2 px-3 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
