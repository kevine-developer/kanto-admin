import Link from 'next/link';
import { Compass, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 selection:bg-[var(--accent)] selection:text-white">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Badge & Icône minimaliste */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full border border-[var(--card-border)] bg-[var(--card)] flex items-center justify-center text-[var(--accent)] shadow-xs">
            <Compass className="w-8 h-8 stroke-[1.75]" />
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wider uppercase border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-subtle)]">
            Erreur 404 &bull; Introuvable
          </span>
        </div>

        {/* Titre & Description épurée */}
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Page introuvable
          </h1>
          <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
            La section demandée dans le panneau d&apos;administration n&apos;existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions simples et directes */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
          <Link
            href="/"
            className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Tableau de bord</span>
          </Link>

          <Link
            href="/locks"
            className="w-full sm:flex-1 py-2 px-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Jeux &amp; Catégories</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
