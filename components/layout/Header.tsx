'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { useTheme } from '@/lib/theme-context';
import { LogOut, Sliders } from 'lucide-react';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    image?: string | null;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { zoomLevel } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (err) {
      console.error('Erreur lors de la déconnexion :', err);
    }
  };

  return (
    <>
      <header className="h-13 border-b border-[var(--card-border)] bg-[var(--card)]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-2">
          <span>Conservatoire Culturel Malagasy</span>
          <span className="text-neutral-300 dark:text-neutral-700">&bull;</span>
          <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">Backoffice Admin</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Settings & Zoom indicator */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Ouvrir les Paramètres d'affichage & Zoom"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-xs font-medium transition-all cursor-pointer"
          >
            <Sliders size={13} className="text-[var(--accent)]" />
            <span className="hidden sm:inline">Affichage</span>
            <span className="px-1 py-0.2 rounded bg-[var(--input-bg)] font-mono text-[10px] text-[var(--text-muted)]">
              {zoomLevel}%
            </span>
          </button>

          {/* Quick Theme Toggle */}
          <ThemeToggle />

          {/* User Info */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-[var(--card-border)]">
            <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold font-heritage">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-xs leading-tight hidden md:block">
              <div className="font-semibold text-[var(--foreground)]">
                {user?.name || 'Administrateur'}
              </div>
              <div className="text-[10.5px] text-[var(--text-subtle)] font-mono">
                {user?.email || 'admin@kanto.mg'}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Se déconnecter"
            className="p-1.5 rounded-lg text-[var(--text-subtle)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
