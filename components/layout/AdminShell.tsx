'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
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

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const user = session?.user as AuthUser | undefined;
  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    if (!isPending) {
      if (!session || !isAdmin) {
        router.replace('/login');
      }
    }
  }, [session, isPending, isAdmin, router]);

  if (isPending) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <Loader2 size={28} className="animate-spin text-[#2D6A4F] dark:text-[#52B788] mb-3" />
        <div className="text-sm font-semibold text-[#525252] dark:text-[#A6ACA8]">
          Ouverture du Conservatoire...
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 shadow-sm">
          <ShieldAlert size={28} />
        </div>
        <div className="text-lg font-bold text-red-950 dark:text-red-300">Accès Refusé</div>
        <p className="text-sm text-[#525252] dark:text-[#A6ACA8] max-w-sm mt-1 mb-5">
          Vous devez posséder les privilèges <strong>ADMIN</strong> pour accéder au Conservatoire Kanto.
        </p>
        <button
          onClick={() => router.replace('/login')}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-[#1A1A1A] dark:bg-[#2D6A4F] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-soft"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 p-8 md:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
