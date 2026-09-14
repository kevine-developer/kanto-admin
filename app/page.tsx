'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/layout/AdminShell';
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
  HeartHandshake,
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

const QUICK_LINKS = [
  {
    href: '/contributions',
    icon: HeartHandshake,
    label: 'Contributions',
    sub: 'Modération & Objectif Hebdo',
    accent: '#3FB950',
  },
  {
    href: '/contes',
    icon: BookOpen,
    label: 'Contes & Angano',
    sub: 'Studio Audio Gemini TTS',
    accent: null,
  },
  {
    href: '/proverbes',
    icon: ScrollText,
    label: 'Proverbes & Fady',
    sub: 'Recueil des Ohabolana',
    accent: null,
  },
  {
    href: '/kabary',
    icon: Mic,
    label: 'Discours & Kabary',
    sub: 'Protocoles oratoires',
    accent: null,
  },
  {
    href: '/citations',
    icon: Quote,
    label: 'Citations & Auteurs',
    sub: 'Pensées et figures historiques',
    accent: null,
  },
  {
    href: '/true-false',
    icon: CheckCheck,
    label: 'Vrai ou Faux',
    sub: 'Affirmations bilingues',
    accent: null,
  },
  {
    href: '/word-puzzle',
    icon: Puzzle,
    label: 'Remise en Ordre',
    sub: 'Niveaux romains & phrases',
    accent: null,
  },
  {
    href: '/locks',
    icon: Lock,
    label: 'Accès & Verrouillage',
    sub: 'Contrôle des modules',
    accent: null,
  },
];

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
    return () => { isMounted = false; };
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
      <div className="w-full space-y-8 pb-10">

        {/* ── En-tête Culturel & Stately ───────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-medium tracking-wider uppercase mb-1.5" style={{ color: 'var(--accent)' }}>
              <span>Patrimoine & Conservatoire Vivant Malagasy</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold font-heritage tracking-tight leading-tight"
              style={{ color: 'var(--foreground)' }}
            >
              Vue d&apos;ensemble
            </h1>
            <p
              className="text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Supervision des archives culturelles numérisées, des enregistrements bilingues et de la modération.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/contes"
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-2 shadow-xs cursor-pointer text-white"
              style={{ background: 'var(--accent)' }}
            >
              <BookOpen size={14} />
              <span>Explorer les Contes</span>
            </Link>
          </div>
        </div>

        {/* ── Métriques du Corpus (Plein écran) ─────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span
              className="text-[11px] font-semibold uppercase tracking-widest font-mono"
              style={{ color: 'var(--text-subtle)' }}
            >
              Métriques du Corpus Numérique
            </span>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              Mise à jour en temps réel
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
            <StatCard
              title="Contes (Angano)"
              value={isLoading ? '—' : stats.totalContes}
              subtitle="Récits oraux archivés"
              icon={BookOpen}
              variant="default"
            />
            <StatCard
              title="Audio Malagasy"
              value={isLoading ? '—' : `${stats.contesWithAudioMg}/${stats.totalContes}`}
              subtitle={`${mgPercentage}% voix malagasy`}
              icon={Headphones}
              variant="success"
              badge={`${mgPercentage}%`}
            />
            <StatCard
              title="Audio Français"
              value={isLoading ? '—' : `${stats.contesWithAudioFr}/${stats.totalContes}`}
              subtitle={`${frPercentage}% voix française`}
              icon={Volume2}
              variant="info"
              badge={`${frPercentage}%`}
            />
            <StatCard
              title="Ohabolana & Fady"
              value={isLoading ? '—' : stats.totalItems}
              subtitle="Proverbes répertoriés"
              icon={ScrollText}
              variant="warning"
            />
            <StatCard
              title="Citations"
              value={isLoading ? '—' : stats.totalCitations}
              subtitle="Auteurs & grandes figures"
              icon={Quote}
              variant="default"
            />
          </div>
        </div>

        {/* ── Collections & Modules d'administration ─────────────────── */}
        <div className="space-y-3">
          <div
            className="text-[11px] font-semibold uppercase tracking-widest font-mono"
            style={{ color: 'var(--text-subtle)' }}
          >
            Modules du Conservatoire
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {QUICK_LINKS.map(({ href, icon: Icon, label, sub, accent }) => (
              <Link
                key={href}
                href={href}
                className="group relative p-4 sm:p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:translate-y-[-1px] cursor-pointer"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="p-2 rounded-xl transition-colors"
                    style={{
                      background: 'color-mix(in srgb, var(--card-border) 40%, transparent)',
                      color: accent || 'var(--foreground)',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                    style={{ color: accent || 'var(--accent)' }}
                  />
                </div>

                <div className="mt-4">
                  <div
                    className="text-sm font-semibold tracking-tight leading-snug font-heritage group-hover:text-[var(--accent)] transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {label}
                  </div>
                  <div
                    className="text-xs mt-1 leading-relaxed line-clamp-2"
                    style={{ color: 'var(--text-subtle)' }}
                  >
                    {sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AdminShell>
  );
}
