'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Lock,
  Mail,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@kanto.mg');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res?.error) {
        setErrorMessage(res.error.message || 'Identifiants invalides');
        setIsLoading(false);
        return;
      }

      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur réseau est survenue';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between p-6 transition-colors selection:bg-[var(--accent-light)] selection:text-[var(--accent-text)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center font-bold text-xs">
            K
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm text-[var(--foreground)] leading-none">
              Kanto
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
              Admin
            </span>
          </div>
        </div>

        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="max-w-sm w-full mx-auto my-auto space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
            Accès Conservatoire
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Espace d&apos;administration du patrimoine Kanto
          </p>
        </div>

        <div className="kanto-card rounded-xl p-5 border border-[var(--card-border)] bg-[var(--card)]">
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Adresse Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kanto.mg"
                  className="w-full pl-8 pr-3 py-1.5 rounded-md kanto-input text-xs placeholder-[var(--text-subtle)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                Mot de Passe
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-8 pr-3 py-1.5 rounded-md kanto-input text-xs placeholder-[var(--text-subtle)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se Connecter</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-subtle)] max-w-4xl mx-auto w-full">
        Plateforme Kanto &bull; Patrimoine &amp; Langue Malagasy
      </div>
    </div>
  );
}
