'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui';
import { fetchApi } from '@/lib/api-client';
import {
  BookOpen,
  Headphones,
  ScrollText,
  ArrowUpRight,
  Volume2,
  Quote,
  Mic,
  Lock,
  CheckCheck,
  Puzzle,
  LayoutDashboard,
} from 'lucide-react';

interface StatsData {
  totalContes: number;
  contesWithAudioMg: number;
  contesWithAudioFr: number;
  totalItems: number;
  totalCitations: number;
}

interface ConteSummary {
  id: string;
  audioUrlMg?: string | null;
  audioUrlFr?: string | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    totalContes: 0,
    contesWithAudioMg: 0,
    contesWithAudioFr: 0,
    totalItems: 0,
    totalCitations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const contesRes = await fetchApi<{ data: ConteSummary[] }>('/contes?limit=100');
        const contes = contesRes.data || [];

        const withMg = contes.filter((c) => !!c.audioUrlMg).length;
        const withFr = contes.filter((c) => !!c.audioUrlFr).length;

        let itemsCount = 0;
        let citationsCount = 0;
        try {
          const itemsRes = await fetchApi<{ meta?: { total?: number } }>('/items?limit=1');
          itemsCount = itemsRes.meta?.total || 0;
        } catch {}

        try {
          const citRes = await fetchApi<{ meta?: { total?: number } }>('/citations?limit=1');
          citationsCount = citRes.meta?.total || 0;
        } catch {}

        if (!isMounted) return;
        setStats({
          totalContes: contes.length,
          contesWithAudioMg: withMg,
          contesWithAudioFr: withFr,
          totalItems: itemsCount,
          totalCitations: citationsCount,
        });
      } catch (err: unknown) {
        console.error('Erreur chargement des métriques :', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const mgPercentage =
    stats.totalContes > 0
      ? Math.round((stats.contesWithAudioMg / stats.totalContes) * 100)
      : 0;
  const frPercentage =
    stats.totalContes > 0
      ? Math.round((stats.contesWithAudioFr / stats.totalContes) * 100)
      : 0;

  return (
    <AdminShell>
      <div className="space-y-6 max-w-6xl">
        {/* En-tête standardisé */}
        <PageHeader
          title="Vue d'ensemble • Conservatoire"
          description="Supervision du patrimoine culturel numérisé et des flux audio Gemini TTS."
          icon={LayoutDashboard}
        />

        {/* Grille de cartes métriques épurée et standardisée */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Contes Traditionnels"
            value={isLoading ? '...' : stats.totalContes}
            subtitle="Récits intégraux répertoriés"
            icon={BookOpen}
            variant="default"
          />

          <StatCard
            title="Audio Malagasy (MG)"
            value={isLoading ? '...' : `${stats.contesWithAudioMg}/${stats.totalContes}`}
            subtitle={`${mgPercentage}% avec enregistrement`}
            icon={Headphones}
            variant="success"
            badge={`${mgPercentage}%`}
          />

          <StatCard
            title="Audio Français (FR)"
            value={isLoading ? '...' : `${stats.contesWithAudioFr}/${stats.totalContes}`}
            subtitle={`${frPercentage}% avec enregistrement`}
            icon={Volume2}
            variant="info"
            badge={`${frPercentage}%`}
          />

          <StatCard
            title="Proverbes & Sagesses"
            value={isLoading ? '...' : stats.totalItems}
            subtitle="Corpus Ohabolana & Fady"
            icon={ScrollText}
            variant="warning"
          />
        </div>

        {/* Accès Rapides */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Collections & Modules
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Link
              href="/contes"
              className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Contes & Angano
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Studio Audio Gemini TTS
                  </div>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors" />
            </Link>

            <Link
              href="/proverbes"
              className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <ScrollText size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Proverbes & Fady
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Recueil des Ohabolana
                  </div>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors" />
            </Link>

            <Link
              href="/kabary"
              className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Mic size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Discours & Kabary
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Protocoles oratoires
                  </div>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors" />
            </Link>

            <Link
              href="/citations"
              className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Quote size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Citations & Auteurs
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Pensées et figures historiques
                  </div>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors" />
            </Link>

            <Link
              href="/true-false"
              className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <CheckCheck size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Vrai ou Faux (Jeux)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Affirmations bilingues
                  </div>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors" />
            </Link>

            <Link
              href="/word-puzzle"
              className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Puzzle size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Remise en Ordre (Jeux)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Niveaux romains & phrases
                  </div>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors" />
            </Link>

            <Link
              href="/locks"
              className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Lock size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Accès & Verrouillage
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Contrôle en direct des modules
                  </div>
                </div>
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
