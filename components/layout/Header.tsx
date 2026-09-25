'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings2, Sun, Moon, PanelLeft } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// Mapping pathname → titre de page
const PAGE_TITLES: Record<string, string> = {
  '/':              "Vue d'ensemble",
  '/contributions': 'Contributions & Modération',
  '/welcome-slides':"Écran d'Accueil & Carrousel",
  '/marketing-banners': 'Bannières Marketing',
  '/locks':         'Visuels Jeux & Catégories',
  '/announcements': 'Annonces Système',
  '/histoire':      'Histoire & Emblèmes',
  '/contes':        'Contes & Angano',
  '/proverbes':     'Proverbes & Fady',
  '/kabary':        'Discours & Kabary',
  '/citations':     'Citations & Auteurs',
  '/true-false':    'Vrai ou Faux',
  '/word-puzzle':   "Remets dans l'ordre",
  '/missing-word':  'Mot Manquant',
  '/progression':   'Progression & XP',
  '/notifications': 'Notifications Push',
  '/users':         'Utilisateurs & Rôles',
  '/settings':      'Paramètres & Configuration',
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // match prefix (/contes/...)
  for (const [key, value] of Object.entries(PAGE_TITLES)) {
    if (key !== '/' && pathname.startsWith(key)) return value;
  }
  return 'Kanto Admin';
}

/**
 * Barre d'en-tête supérieure de l'espace d'administration.
 * Affiche le titre de la route active, le badge contextuel, et les contrôles utilisateur.
 */
export function Header() {
  const { toggleTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();

  const pageTitle = resolveTitle(pathname);
  const isSettings = pathname === '/settings';

  return (
    <header
      className="h-14 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10 shrink-0 transition-colors"
      style={{
        borderBottom: '1px solid var(--card-border)',
        background: 'color-mix(in srgb, var(--background) 85%, transparent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Gauche : Bouton toggle sidebar + Titre contextuel */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('kanto:toggle-sidebar'))}
          title="Afficher / Masquer la barre latérale"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-[var(--card-hover)] text-[var(--text-subtle)] hover:text-[var(--foreground)]"
        >
          <PanelLeft size={16} />
        </button>

        <div className="h-4 w-[1px] bg-[var(--card-border)] hidden sm:block" />

        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold tracking-tight font-heritage"
            style={{ color: 'var(--foreground)' }}
          >
            {pageTitle}
          </span>
        </div>
      </div>

      {/* Actions droite */}
      <div className="flex items-center gap-2">
        {/* Badge d'environnement neutre */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)]"
          title="Espace d'administration Kanto"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <span>Kanto Admin</span>
        </div>

        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          title={resolvedTheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-[var(--card-hover)] text-[var(--text-subtle)] hover:text-[var(--foreground)]"
        >
          {resolvedTheme === 'dark'
            ? <Sun size={15} style={{ color: '#f59e0b' }} />
            : <Moon size={15} style={{ color: 'var(--accent)' }} />
          }
        </button>

        {/* Paramètres (Lien vers la page /settings) */}
        <Link
          href="/settings"
          title="Paramètres de l'application"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            isSettings
              ? 'bg-[var(--card-hover)] text-[var(--foreground)]'
              : 'hover:bg-[var(--card-hover)] text-[var(--text-subtle)] hover:text-[var(--foreground)]'
          }`}
        >
          <Settings2 size={15} className={isSettings ? 'text-[var(--accent)]' : ''} />
        </Link>
      </div>
    </header>
  );
}
