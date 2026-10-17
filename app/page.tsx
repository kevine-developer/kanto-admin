'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { systemService } from '@/services/system.service';
import { DashboardMetrics } from '@/types';
import {
  BookOpen,
  ScrollText,
  ArrowUpRight,
  CheckCheck,
  Puzzle,
  HeartHandshake,
  LayoutDashboard,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FileText,
  Users,
  ShieldCheck,
  Activity,
  CheckCircle2,
  DollarSign,
  Info,
} from 'lucide-react';

type PeriodType = 'today' | '7d' | '30d' | 'all';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [period, setPeriod] = useState<PeriodType>('7d');
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await systemService.getDashboardMetrics(period);
      setMetrics(data);
    } catch (err: unknown) {
      console.error('Erreur chargement des métriques du dashboard :', err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  const hasUrgentActions =
    (metrics?.moderation.totalUrgent || 0) > 0;

  return (
    <AdminShell>
      <div className="w-full space-y-6 pb-12">
        {/* En-tête avec sélecteur de période */}
        <PageHeader
          title="Tableau de Bord & Pilotage"
          description="Vue synthétique du conservatoire Kanto : communauté active, modération citoyenne, corpus culturel et état des services."
          badge={
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--accent)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Système Opérationnel
            </span>
          }
          icon={LayoutDashboard}
          actions={
            <div className="flex items-center gap-2">
              {/* Sélecteur de période */}
              <div className="inline-flex items-center p-0.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-xs">
                {(
                  [
                    { id: 'today', label: "Aujourd'hui" },
                    { id: '7d', label: '7 jours' },
                    { id: '30d', label: '30 jours' },
                    { id: 'all', label: 'Global' },
                  ] as { id: PeriodType; label: string }[]
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                      period === p.id
                        ? 'bg-[var(--accent)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void loadMetrics()}
                title="Actualiser les métriques"
                className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
              >
                <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          }
        />

        {/* 1. Alerte prioritaire d'actions requises (File de modération) */}
        {hasUrgentActions && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <span className="font-semibold text-[var(--foreground)]">Actions requises en modération : </span>
                <span className="text-[var(--text-muted)]">
                  {metrics?.moderation.pendingContributions
                    ? `${metrics.moderation.pendingContributions} contribution(s) citoyenne(s) en attente`
                    : ''}
                  {metrics?.moderation.pendingContributions && metrics?.moderation.pendingReports
                    ? ' • '
                    : ''}
                  {metrics?.moderation.pendingReports
                    ? `${metrics.moderation.pendingReports} signalement(s) non traité(s)`
                    : ''}
                  {metrics?.moderation.disputedContributions
                    ? ` • ${metrics.moderation.disputedContributions} réclamation(s) doublon`
                    : ''}
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

        {/* 2. KPIs Clés : Utilisateurs, Modération, Corpus & Activité */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1 : Communauté Utilisateurs */}
          <Link
            href="/users"
            className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-[11px] font-mono uppercase tracking-wider">Communauté Kanto</span>
              <Users size={15} className="text-purple-500" />
            </div>
            <div className="my-2.5">
              <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
                {metrics?.users.total.toLocaleString('fr-FR') || 0}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{metrics?.users.newInPeriod || 0}
                </span>{' '}
                {period === 'today'
                  ? "aujourd'hui"
                  : period === '7d'
                  ? 'sur 7 jours'
                  : period === '30d'
                  ? 'sur 30 jours'
                  : 'au total'}
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[10.5px] text-[var(--text-muted)]">
              <span>{metrics?.users.roles.admin || 0} admin(s)</span>
              <span>{metrics?.users.banned || 0} suspendu(s)</span>
            </div>
          </Link>

          {/* KPI 2 : Modération Citoyenne */}
          <Link
            href="/contributions"
            className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-[11px] font-mono uppercase tracking-wider">File de Modération</span>
              <HeartHandshake size={15} className="text-amber-500" />
            </div>
            <div className="my-2.5">
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {metrics?.moderation.totalUrgent || 0}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Dossiers en attente d&apos;arbitrage
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[10.5px] text-[var(--text-muted)]">
              <span>{metrics?.moderation.pendingContributions || 0} proposition(s)</span>
              <span>{metrics?.moderation.pendingReports || 0} signalement(s)</span>
            </div>
          </Link>

          {/* KPI 3 : Patrimoine & Contes */}
          <Link
            href="/contes"
            className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-[11px] font-mono uppercase tracking-wider">Contes & Récits</span>
              <BookOpen size={15} className="text-emerald-500" />
            </div>
            <div className="my-2.5">
              <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
                {metrics?.content.contes.total || 0}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Couverture audio bilingue :
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[10.5px] font-mono">
              <span className="text-emerald-600 dark:text-emerald-400">
                MG: {metrics?.content.contes.audioCoverageMg || 0}%
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                FR: {metrics?.content.contes.audioCoverageFr || 0}%
              </span>
            </div>
          </Link>

          {/* KPI 4 : Sagesse & Culture */}
          <Link
            href="/proverbes"
            className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition flex flex-col justify-between shadow-xs"
          >
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-[11px] font-mono uppercase tracking-wider">Corpus Culturel</span>
              <ScrollText size={15} className="text-blue-500" />
            </div>
            <div className="my-2.5">
              <div className="text-2xl font-bold font-mono text-[var(--foreground)]">
                {((metrics?.content.items || 0) + (metrics?.content.citations || 0)).toLocaleString('fr-FR')}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Proverbes, fady et citations
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between text-[10.5px] text-[var(--text-muted)]">
              <span>{metrics?.content.items || 0} items</span>
              <span>{metrics?.content.kabary || 0} kabary</span>
            </div>
          </Link>
        </div>

        {/* 3. Deuxième rangée : Activité UGC Quiz + Santé des Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Carte 1 : Activité UGC Quiz Communautaires (2 colonnes) */}
          <div className="lg:col-span-2 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--accent)]" />
                <h3 className="font-semibold text-xs text-[var(--foreground)]">
                  Activité Jeux, Duels & Communauté
                </h3>
              </div>
              <Link
                href="/true-false"
                className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 font-medium"
              >
                Explorer la gamification <ArrowUpRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
                <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                  Quiz UGC créés
                </div>
                <div className="text-xl font-bold font-mono text-[var(--foreground)] mt-1">
                  {metrics?.activity.ugcQuizSets || 0}
                </div>
                <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
                  Decks créés par les joueurs
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
                <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                  Abonnements VIP
                </div>
                <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                  {metrics?.users.premium || 0}
                </div>
                <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
                  Membres Premium actifs
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
                <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase">
                  Modération Auto
                </div>
                <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {metrics?.moderation.flaggedContributions || 0}
                </div>
                <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
                  Mots sensibles interceptés
                </div>
              </div>
            </div>

            {/* Accès rapide aux jeux */}
            <div className="pt-2 border-t border-[var(--card-border)] grid grid-cols-3 gap-2 text-center text-xs">
              <Link
                href="/true-false"
                className="p-2 rounded-lg bg-[var(--background)] hover:bg-[var(--card-hover)] border border-[var(--card-border)] transition"
              >
                <CheckCheck size={14} className="mx-auto text-emerald-500 mb-1" />
                <span className="font-medium text-[11px]">Vrai ou Faux</span>
              </Link>
              <Link
                href="/word-puzzle"
                className="p-2 rounded-lg bg-[var(--background)] hover:bg-[var(--card-hover)] border border-[var(--card-border)] transition"
              >
                <Puzzle size={14} className="mx-auto text-blue-500 mb-1" />
                <span className="font-medium text-[11px]">Remets en Ordre</span>
              </Link>
              <Link
                href="/missing-word"
                className="p-2 rounded-lg bg-[var(--background)] hover:bg-[var(--card-hover)] border border-[var(--card-border)] transition"
              >
                <FileText size={14} className="mx-auto text-purple-500 mb-1" />
                <span className="font-medium text-[11px]">Mot Manquant</span>
              </Link>
            </div>
          </div>

          {/* Carte 2 : Santé des Services & Verrous (1 colonne) */}
          <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-emerald-500" />
              <h3 className="font-semibold text-xs text-[var(--foreground)]">
                État des Services & Serveur
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Base de données PostgreSQL</span>
                {metrics?.system.databaseHealthy ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} /> Opérationnelle
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-red-500">
                    <AlertTriangle size={12} /> Déconnectée
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Modules verrouillés</span>
                <span className="font-mono font-semibold text-[var(--foreground)]">
                  {metrics?.system.lockedModules || 0} module(s)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Annonces actives</span>
                <span className="font-mono font-semibold text-[var(--foreground)]">
                  {metrics?.system.activeAnnouncements || 0} active(s)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)]">
                <span className="text-[var(--text-muted)]">Auth & Sessions</span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={12} /> Better-Auth Actif
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--card-border)]">
              <Link
                href="/locks"
                className="w-full py-1.5 px-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--card-hover)] text-xs text-[var(--foreground)] transition flex items-center justify-center gap-1.5 font-medium cursor-pointer"
              >
                Gérer les Verrous & Annonces
              </Link>
            </div>
          </div>
        </div>

        {/* 4. Section Monétisation Google AdMob (Transparence & Directives de Production) */}
        <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-amber-500" />
              <h3 className="font-semibold text-xs text-[var(--foreground)]">
                Monétisation & Performance AdMob
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400">
              Reporting API — Notice Technique
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <Info size={13} className="text-[var(--accent)]" />
                Intégration de l&apos;API Google AdMob Reporting
              </div>
              <p className="text-[11px] text-[var(--text-muted)] max-w-2xl leading-relaxed">
                Les unités publicitaires Kanto (Bannières adaptatives, Interstitiels solo et Vidéos récompensées)
                sont opérationnelles avec filtrage parental <strong>PG</strong> et consentement UMP.
                Pour rapatrier les revenus réels, eCPM et impressions dans ce CRM sans exposer de secrets,
                activez l&apos;API <em>Google AdMob Reporting</em> sur la Google Cloud Console du projet et
                déclarez le service account JSON dans les variables d&apos;environnement serveur.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Link
                href="/cgu"
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[11px] font-medium text-[var(--foreground)] transition"
              >
                Politique & CGU
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
