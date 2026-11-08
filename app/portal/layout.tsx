'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from '@/lib/auth-client';
import {
  partnerPortalService,
  PartnerProfile,
} from '@/services/portal.service';
import {
  LayoutDashboard,
  Calendar,
  KeyRound,
  Megaphone,
  BookOpen,
  User,
  LogOut,
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  XCircle,
  ExternalLink,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push('/login?callbackUrl=/portal');
      return;
    }

    if (session) {
      partnerPortalService
        .getMyProfile()
        .then((data) => {
          setProfile(data);
          setNeedsRegistration(false);
        })
        .catch((err) => {
          // Si l'utilisateur est connecté mais n'a pas encore créé son organisation partenaire
          if (err?.status === 404 || err?.message?.includes('introuvable')) {
            setNeedsRegistration(true);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [session, isSessionLoading, router]);

  const navLinks = [
    { href: '/portal', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/portal/events', label: 'Mes Événements', icon: Calendar },
    { href: '/portal/api-keys', label: 'Clés API & Intégrations', icon: KeyRound },
    { href: '/portal/marketing', label: 'Prestations Marketing', icon: Megaphone },
    { href: '/portal/profile', label: 'Profil Organisateur', icon: Building2 },
  ];

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Connexion à votre espace organisateur...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0B] text-zinc-100 flex flex-col">
      {/* Barre de statut du partenaire si non vérifié */}
      {profile && profile.status === 'PENDING_VERIFICATION' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>
            Votre dossier est en cours de validation par l'équipe Kanto MG. Vous pouvez préparer vos
            brouillons d’événements et générer des clés de test.
          </span>
        </div>
      )}

      {profile && profile.status === 'SUSPENDED' && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-300 flex items-center justify-center gap-2">
          <Ban className="w-4 h-4 text-rose-400" />
          <span>
            Votre compte partenaire est temporairement suspendu. Contactez le support pour plus
            d'informations.
          </span>
        </div>
      )}

      {/* Header Portail */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/portal" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-950/40">
                K
              </div>
              <div>
                <span className="font-bold tracking-tight text-base text-zinc-100">
                  Kanto <span className="text-emerald-400">Partners</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  Organisateurs & Développeurs
                </span>
              </div>
            </Link>

            {/* Navigation principale */}
            {!needsRegistration && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.href === '/portal'
                      ? pathname === '/portal'
                      : pathname?.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isActive
                          ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/60'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Actions utilisateur & Doc */}
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:3000/api/partners/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-700 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              API Docs (OpenAPI)
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>

            {profile ? (
              <div className="flex items-center gap-3 pl-3 border-l border-zinc-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-zinc-200">{profile.name}</div>
                  <div className="text-[10px] text-zinc-500">{profile.type}</div>
                </div>
                <button
                  onClick={() => signOut({ fetchOptions: { onSuccess: () => router.push('/login') } })}
                  title="Déconnexion"
                  className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer sobre */}
      <footer className="border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-500 bg-zinc-950/40">
        <p>
          © 2026 Kanto MG — Plateforme Partenaires & API Ouverte pour la culture et le patrimoine malgache.
        </p>
      </footer>
    </div>
  );
}

