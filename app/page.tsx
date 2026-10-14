'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchApi } from '@/lib/api-client';
import { contributionsService } from '@/services/contributions.service';
import {
  BookOpen,
  Headphones,
  ScrollText,
  ArrowUpRight,
  Quote,
  Mic,
  Lock,
  CheckCheck,
  Puzzle,
  HeartHandshake,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Landmark,
  FileText,
  Megaphone,
  Users,
  Settings2,
} from 'lucide-react';

interface StatsData {
  totalContes: number;
  contesWithAudioMg: number;
  contesWithAudioFr: number;
  totalItems: number;
  totalCitations: number;
  pendingContributions: number;
  pendingReports: number;
}

interface ConteSummary {
  id: string;
  audioUrlMg?: string | null;
  audioUrlFr?: string | null;
}

const MODULE_POLES = [
  {
    title: 'Patrimoine Culturel',
    badge: 'Corpus',
    links: [
      {
        href: '/contes',
        label: 'Contes & Angano',
        detail: 'Studio audio TTS bilingue et récits',
        icon: BookOpen,
      },
      {
        href: '/proverbes',
        label: 'Proverbes & Fady',
        detail: 'Sagesses ancestrales et interdits',
        icon: ScrollText,
      },
      {
        href: '/kabary',
        label: 'Discours & Kabary',
        detail: 'Art oratoire et protocoles oraux',
        icon: Mic,
      },
      {
        href: '/citations',
        label: 'Citations & Auteurs',
        detail: 'Grandes pensées et mémoires',
        icon: Quote,
      },
      {
        href: '/histoire',
        label: 'Histoire & Chronologie',
        detail: 'Grandes époques et repères',
        icon: Landmark,
      },
    ],
  },
  {
    title: 'Gamification & Quiz',
    badge: 'Apprentissage',
    links: [
      {
        href: '/true-false',
        label: 'Vrai ou Faux',
        detail: 'Affirmations bilingues et quiz',
        icon: CheckCheck,
      },
      {
        href: '/word-puzzle',
        label: 'Remise en Ordre',
        detail: 'Puzzles de phrases et syntaxes',
        icon: Puzzle,
      },
      {
        href: '/missing-word',
        label: 'Mots Manquants',
        detail: 'Complétion lexicale contextuelle',
        icon: FileText,
      },
      {
        href: '/progression',
        label: 'Niveaux & Récompenses',
        detail: 'Points de fahalalana et badges',
        icon: Sparkles,
      },
    ],
  },
  {
    title: 'Pilotage & Système',
    badge: 'Gouvernance',
    links: [
      {
        href: '/contributions',
        label: 'Modération Citoyenne',
        detail: 'Validation collaborative du public',
        icon: HeartHandshake,
      },
      {
        href: '/announcements',
        label: 'Annonces Système',
        detail: 'Communications et alertes mobiles',
        icon: Megaphone,
      },
      {
        href: '/locks',
        label: 'Visuels & Accès',
        detail: 'Bannières de couverture et verrous',
        icon: Lock,
      },
      {
        href: '/users',
        label: 'Utilisateurs & Rôles',
        detail: 'Gestion des comptes et droits',
        icon: Users,
      },
      {
        href: '/settings',
        label: 'Paramètres & CGU',
        detail: 'Configuration globale et mentions',
        icon: Settings2,
      },
    ],
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    totalContes: 0,
    contesWithAudioMg: 0,
    contesWithAudioFr: 0,
    totalItems: 0,
    totalCitations: 0,
    pendingContributions: 0,
    pendingReports: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);

      const [contesSettled, itemsSettled, citationsSettled, contribSettled] =
        await Promise.allSettled([
          fetchApi<{ data: ConteSummary[] }>('/contes?limit=100'),
          fetchApi<{ meta?: { total?: number } }>('/items?limit=1'),
          fetchApi<{ meta?: { total?: number } }>('/citations?limit=1'),
          contributionsService.getStats(),
        ]);

      let totalContes = 0;
      let withMg = 0;
      let withFr = 0;
      if (contesSettled.status === 'fulfilled') {
        const contes = contesSettled.value?.data || [];
        totalContes = contes.length;
        withMg = contes.filter((c) => !!c.audioUrlMg).length;
        withFr = contes.filter((c) => !!c.audioUrlFr).length;
      }

      let totalItems = 0;
      if (itemsSettled.status === 'fulfilled') {
        totalItems = itemsSettled.value?.meta?.total || 0;
      }

      let totalCitations = 0;
      if (citationsSettled.status === 'fulfilled') {
        totalCitations = citationsSettled.value?.meta?.total || 0;
      }

      let pendingContributions = 0;
      let pendingReports = 0;
      if (contribSettled.status === 'fulfilled') {
        pendingContributions = contribSettled.value?.totalPending || 0;
        pendingReports = contribSettled.value?.totalReportsPending || 0;
      }

      setStats({
        totalContes,
        contesWithAudioMg: withMg,
        contesWithAudioFr: withFr,
        totalItems,
        totalCitations,
        pendingContributions,
        pendingReports,
      });
    } catch (err: unknown) {
      console.error('Erreur chargement des métriques :', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const mgPercentage =
    stats.totalContes > 0
      ? Math.round((stats.contesWithAudioMg / stats.totalContes) * 100)
      : 0;
  const frPercentage =
    stats.totalContes > 0
      ? Math.round((stats.contesWithAudioFr / stats.totalContes) * 100)
      : 0;

  const hasUrgentActions = stats.pendingContributions > 0 || stats.pendingReports > 0;

  return (
    <AdminShell>
      <div className="w-full space-y-5 pb-8">
        {/* En-tête standardisé et compact */}
        <PageHeader
          title="Vue d'ensemble"
          description="Supervision synthétique du conservatoire Kanto : corpus vivant, couverture audio bilingue et modération citoyenne."
          badge={
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Conservatoire Kanto
            </span>
          }
          icon={LayoutDashboard}
          actions={
            <button
              type="button"
              onClick={() => void loadStats()}
              title="Actualiser les métriques"
              className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
          primaryAction={{
            label: 'Studio Audio Contes',
            icon: <Headphones size={13} />,
            href: '/contes',
          }}
        />

        {/* Alerte contextuelle UX si actions requises */}
        {hasUrgentActions && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={14} />
              </div>
              <div>
                <span className="font-semibold text-[var(--foreground)]">Action prioritaire requise : </span>
                <span className="text-[var(--text-muted)]">
                  {stats.pendingContributions > 0 &&
                    `${stats.pendingContributions} proposition(s) citoyenne(s) en attente de modération`}
                  {stats.pendingContributions > 0 && stats.pendingReports > 0 && ' et '}
                  {stats.pendingReports > 0 && `${stats.pendingReports} signalement(s) à instruire`}
                </span>
              </div>
            </div>
            <Link
              href="/contributions"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-xs"
            >
              Traiter la file <ArrowUpRight size={12} />
            </Link>
          </div>
        )}

        {/* Ruban des Indicateurs Clés (KPIs minimalistes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1 : Contes & Récits */}
          <Link
            href="/contes"
            className="group p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Contes & Angano
              </span>
              <BookOpen size={15} className="text-[var(--accent)] opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
                {isLoading ? '—' : stats.totalContes}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {isLoading
                  ? 'Chargement...'
                  : `${stats.totalContes - Math.min(stats.contesWithAudioMg, stats.contesWithAudioFr)} à compléter en audio`}
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[10.5px]">
              <span className="text-[var(--text-subtle)] font-mono">Corpus récits</span>
              <span className="text-[var(--accent)] font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Gérer <ArrowUpRight size={11} />
              </span>
            </div>
          </Link>

          {/* KPI 2 : Couverture Audio Bilingue */}
          <Link
            href="/contes"
            className="group p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Couverture Audio
              </span>
              <Headphones size={15} className="text-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="my-1.5 space-y-1.5">
              <div>
                <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)] mb-1">
                  <span>Malagasy</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {isLoading ? '—' : `${mgPercentage}%`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--input-border)] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${mgPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)] mb-1">
                  <span>Français</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {isLoading ? '—' : `${frPercentage}%`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--input-border)] overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-500"
                    style={{ width: `${frPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[10.5px]">
              <span className="text-[var(--text-subtle)] font-mono">
                {stats.contesWithAudioMg} MG • {stats.contesWithAudioFr} FR
              </span>
              <span className="text-[var(--accent)] font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Studio <ArrowUpRight size={11} />
              </span>
            </div>
          </Link>

          {/* KPI 3 : Sagesses & Citations */}
          <Link
            href="/proverbes"
            className="group p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Sagesses & Citations
              </span>
              <ScrollText size={15} className="text-amber-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
                {isLoading ? '—' : stats.totalItems + stats.totalCitations}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {isLoading
                  ? 'Chargement...'
                  : `${stats.totalItems} proverbes • ${stats.totalCitations} citations`}
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[10.5px]">
              <span className="text-[var(--text-subtle)] font-mono">Patrimoine écrit</span>
              <span className="text-[var(--accent)] font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Explorer <ArrowUpRight size={11} />
              </span>
            </div>
          </Link>

          {/* KPI 4 : Modération & Flux */}
          <Link
            href="/contributions"
            className="group p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Modération Citoyenne
              </span>
              <HeartHandshake size={15} className="text-indigo-500 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="my-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-[var(--foreground)]">
                  {isLoading ? '—' : stats.pendingContributions}
                </span>
                {!isLoading && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium ${
                      stats.pendingContributions > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {stats.pendingContributions > 0 ? `${stats.pendingContributions} en attente` : 'À jour'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {isLoading
                  ? 'Chargement...'
                  : stats.pendingReports > 0
                  ? `${stats.pendingReports} signalement(s) actif(s)`
                  : 'Aucun signalement actif'}
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[10.5px]">
              <span className="text-[var(--text-subtle)] font-mono">Contributions</span>
              <span className="text-[var(--accent)] font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Arbitrer <ArrowUpRight size={11} />
              </span>
            </div>
          </Link>
        </div>

        {/* Pôles d'Activités & Espaces de Travail (Compact & Épuré) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono text-[var(--text-subtle)]">
              Espaces & Pôles de Pilotage
            </span>
            <span className="text-[10.5px] font-mono text-[var(--text-muted)]">
              Accès directs aux modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODULE_POLES.map((pole) => (
              <div
                key={pole.title}
                className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[var(--card-border)]">
                    <span className="text-[11.5px] font-bold uppercase tracking-wider font-mono text-[var(--foreground)]">
                      {pole.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-muted)] font-medium">
                      {pole.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {pole.links.map(({ href, label, detail, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className="group flex items-center justify-between p-2 rounded-lg hover:bg-[var(--card-hover)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:border-[var(--card-border)] transition-colors flex items-center justify-center shrink-0">
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors truncate">
                              {label}
                            </div>
                            <div className="text-[10.5px] text-[var(--text-muted)] truncate">
                              {detail}
                            </div>
                          </div>
                        </div>

                        <ArrowUpRight
                          size={13}
                          className="text-[var(--text-subtle)] group-hover:text-[var(--foreground)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-2"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

