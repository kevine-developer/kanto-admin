'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { useTheme } from '@/lib/theme-context';
import {
  LayoutDashboard,
  BookOpen,
  ScrollText,
  Mic,
  Quote,
  Users,
  Sliders,
  CheckCheck,
  HelpCircle,
  Layers,
  Smartphone,
  Bell,
  Puzzle,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    label: "Vue d'ensemble",
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Contes & Angano',
    href: '/contes',
    icon: BookOpen,
  },
  {
    label: 'Proverbes & Fady',
    href: '/proverbes',
    icon: ScrollText,
  },
  {
    label: 'Discours & Kabary',
    href: '/kabary',
    icon: Mic,
  },
  {
    label: 'Citations & Auteurs',
    href: '/citations',
    icon: Quote,
  },
  {
    label: 'Vrai ou Faux (Jeux)',
    href: '/true-false',
    icon: CheckCheck,
  },
  {
    label: "Remets dans l'ordre (Jeux)",
    href: '/word-puzzle',
    icon: Puzzle,
  },
  {
    label: 'Mot Manquant (Jeux)',
    href: '/missing-word',
    icon: HelpCircle,
  },
  {
    label: 'Jeux & Catégories',
    href: '/locks',
    icon: Layers,
  },
  {
    label: 'Onboarding & Slides',
    href: '/onboarding',
    icon: Smartphone,
  },
  {
    label: 'Notifications & Alertes',
    href: '/notifications',
    icon: Bell,
  },
  {
    label: 'Utilisateurs & Rôles',
    href: '/users',
    icon: Users,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { zoomLevel } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <aside className="w-60 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] text-[var(--foreground)] flex flex-col shrink-0 h-screen sticky top-0 z-20 select-none transition-colors">
        {/* Brand Header */}
        <div className="h-13 px-4 border-b border-[var(--sidebar-border)] flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-heritage font-bold text-xs">
            K
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heritage font-bold text-base text-[var(--foreground)] leading-none">
              Kanto
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
              Admin
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-2 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
            Menu
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold'
                    : 'text-[var(--text-muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon
                  size={16}
                  className={
                    isActive
                      ? 'text-[var(--accent-text)]'
                      : 'text-[var(--text-subtle)]'
                  }
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer avec Thème, Zoom & Paramètres */}
        <div className="p-3 border-t border-[var(--sidebar-border)] space-y-2 bg-[var(--background)]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
              Affichage
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-[10.5px] font-medium text-[var(--accent-text)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sliders size={11} />
              <span>Zoom ({zoomLevel}%)</span>
            </button>
          </div>
          <ThemeToggle variant="pills" />
        </div>
      </aside>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
