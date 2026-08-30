'use client';

import { useTheme } from '@/lib/theme-context';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'select' | 'pills' }) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'pills') {
    return (
      <div className="flex items-center p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)]">
        <button
          onClick={() => setTheme('light')}
          title="Thème Clair"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Sun size={15} />
          <span>Clair</span>
        </button>

        <button
          onClick={() => setTheme('dark')}
          title="Thème Sombre"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Moon size={15} />
          <span>Sombre</span>
        </button>

        <button
          onClick={() => setTheme('system')}
          title="Thème Système (Auto)"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          <Laptop size={15} />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      title={resolvedTheme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
      className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors cursor-pointer flex items-center justify-center"
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={15} className="text-amber-400" />
      ) : (
        <Moon size={15} className="text-[var(--accent)]" />
      )}
    </button>
  );
}
