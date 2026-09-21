'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, getSession } from '@/lib/auth-client';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Loader2, ShieldAlert } from 'lucide-react';

interface AuthUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  image?: string | null;
}

/**
 * Enveloppe globale d'administration avec protection de session et vérification du rôle ADMIN.
 * @param props - Composants enfants à rendre dans le shell d'administration
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isVerifying, setIsVerifying] = useState(true);
  const [resolvedIsAdmin, setResolvedIsAdmin] = useState(false);

  const user = session?.user as AuthUser | undefined;
  const role = user?.role?.toString().trim().toUpperCase();
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. Si useSession a déjà une session avec le rôle ADMIN confirmé
      if (session && isAdmin) {
        if (isMounted) {
          setResolvedIsAdmin(true);
          setIsVerifying(false);
        }
        return;
      }

      // 2. Si useSession est encore en chargement, on patiente
      if (isPending) {
        return;
      }

      // 3. Si useSession a fini mais n'a pas encore la session, faire un appel getSession direct
      try {
        const fresh = await getSession();
        const freshUser = fresh?.data?.user as AuthUser | undefined;
        const freshRole = freshUser?.role?.toString().trim().toUpperCase();

        if (freshRole === 'ADMIN') {
          if (isMounted) {
            setResolvedIsAdmin(true);
            setIsVerifying(false);
          }
          return;
        }
      } catch {
        // En cas d'erreur de requête
      }

      // 4. Si aucune session ADMIN valide n'est confirmée, redirection vers /login
      if (isMounted) {
        setResolvedIsAdmin(false);
        setIsVerifying(false);
        router.replace('/login');
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [session, isPending, isAdmin, router]);

  if (isPending || isVerifying) {
    return (
      <div
        className="h-screen w-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg font-heritage"
          style={{ background: 'var(--sidebar-accent)', color: '#080B0F' }}
        >
          K
        </div>
        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--sidebar-accent)' }} />
        <div className="text-xs font-medium font-mono" style={{ color: 'var(--sidebar-muted)' }}>
          Ouverture du Conservatoire...
        </div>
      </div>
    );
  }

  if (!resolvedIsAdmin) {
    return (
      <div
        className="h-screen w-screen flex flex-col items-center justify-center p-6 text-center gap-4"
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444',
          }}
        >
          <ShieldAlert size={26} />
        </div>
        <div>
          <div className="text-base font-bold" style={{ color: '#ef4444' }}>
            Accès Refusé
          </div>
          <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Vous devez posséder les privilèges <strong>ADMIN</strong> pour accéder au Conservatoire
            Kanto.
          </p>
        </div>
        <button
          onClick={() => router.replace('/login')}
          className="px-5 py-2 text-xs font-semibold rounded-xl text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: 'var(--accent)' }}
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen transition-colors"
      style={{ background: 'var(--background)', color: 'var(--foreground)' }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-y-auto page-animate w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
