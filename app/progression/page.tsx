'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui';
import {
  progressionService,
  CULTURAL_RANKS,
} from '@/services/progression.service';
import {
  ProgressionStats,
  LeaderboardUserItem,
} from '@/types/progression';
import {
  Star,
  Trophy,
  Users,
  Flame,
  Search,
  RefreshCw,
  Award,
  Crown,
  Medal,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Sparkles,
  Layers,
  X,
  Loader2,
  ChevronDown,
  Filter,
  RotateCcw,
  Check,
} from 'lucide-react';

type ActiveTab = 'leaderboard' | 'ranks';

/**
 * Page d'administration de la progression, des rangs culturels et du classement des joueurs.
 * Permet la visualisation des statistiques d'XP, la consultation du leaderboard et l'ajustement manuel d'XP.
 */
export default function ProgressionAdminPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('leaderboard');
  const [selectedLevel, setSelectedLevel] = useState<number | 'ALL'>('ALL');
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState<ProgressionStats>({
    totalPlayers: 0,
    totalXpDistributed: 0,
    totalCoinsDistributed: 0,
    maxLevel: 1,
    highestXp: 0,
    maxStreakDays: 0,
    averageLevel: 1,
    activeStreaksCount: 0,
    levelDistribution: {},
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // État de la modale d'ajustement d'XP
  const [selectedUserForXp, setSelectedUserForXp] =
    useState<LeaderboardUserItem | null>(null);
  const [xpDeltaInput, setXpDeltaInput] = useState<string>('50');
  const [xpReasonInput, setXpReasonInput] = useState<string>('');
  const [isSubmittingXp, setIsSubmittingXp] = useState(false);

  // Fermer le dropdown lors d'un clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLevelDropdownOpen(false);
      }
    }
    if (isLevelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLevelDropdownOpen]);

  // Niveau actif sélectionné
  const activeRankObj = useMemo(() => {
    return selectedLevel === 'ALL'
      ? null
      : CULTURAL_RANKS.find((r) => r.level === selectedLevel);
  }, [selectedLevel]);

  const hasActiveFilters =
    selectedLevel !== 'ALL' || searchQuery.trim().length > 0;

  const requestIdRef = useRef(0);

  // Chargement des données
  const loadData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    try {
      setIsLoading(true);
      const levelFilter = selectedLevel === 'ALL' ? undefined : selectedLevel;
      const [statsData, leaderboardData] = await Promise.all([
        progressionService.getAdminStats(),
        progressionService.getLeaderboard(levelFilter, 100),
      ]);

      if (currentRequestId === requestIdRef.current) {
        setStats(statsData);
        setLeaderboard(leaderboardData.entries || []);
      }
    } catch (err: unknown) {
      if (currentRequestId === requestIdRef.current) {
        console.error('Erreur chargement progression admin:', err);
        setFeedback({
          type: 'error',
          text: 'Erreur lors du chargement des métriques de progression.',
        });
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedLevel]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filtrage des joueurs du leaderboard
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return leaderboard;
    return leaderboard.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.userId?.toLowerCase().includes(q)
    );
  }, [leaderboard, searchQuery]);

  // Action : Ajustement XP
  const handleConfirmXpAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForXp) return;

    const delta = Number(xpDeltaInput);
    if (isNaN(delta) || delta === 0) {
      alert('Veuillez renseigner un montant de points valide différent de zéro.');
      return;
    }

    try {
      setIsSubmittingXp(true);
      await progressionService.adjustUserXp(
        selectedUserForXp.userId,
        delta,
        xpReasonInput.trim() || undefined
      );

      setFeedback({
        type: 'success',
        text: `Points mis à jour pour ${selectedUserForXp.name} (${delta > 0 ? `+${delta}` : delta} XP).`,
      });

      setSelectedUserForXp(null);
      setXpDeltaInput('50');
      setXpReasonInput('');
      void loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'ajustement";
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmittingXp(false);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <PageHeader
            title="Progression & Gamification"
            description="Supervision de l'engagement des joueurs, des séries actives et de la hiérarchie des 10 Rangs Culturels Malagasy."
            icon={Trophy}
          />

          <button
            onClick={() => void loadData()}
            disabled={isLoading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-xs font-medium text-[var(--foreground)] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-lg flex items-center justify-between text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {/* 4 KPIs Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Joueurs Enregistrés"
            value={isLoading ? '...' : stats.totalPlayers}
            subtitle="Profils avec progression"
            icon={Users}
            variant="default"
          />

          <StatCard
            title="Total XP Distribué"
            value={isLoading ? '...' : `${stats.totalXpDistributed.toLocaleString()} XP`}
            subtitle="Points acquis dans l'écosystème"
            icon={Star}
            variant="warning"
          />

          <StatCard
            title="Niveau Record"
            value={isLoading ? '...' : `Niveau ${stats.maxLevel}`}
            subtitle={`Moyenne : Niv. ${stats.averageLevel} • Max ${stats.highestXp} XP`}
            icon={Crown}
            variant="success"
          />

          <StatCard
            title="Séries Actives (Streaks)"
            value={isLoading ? '...' : stats.activeStreaksCount}
            subtitle={`Record : ${stats.maxStreakDays} j consécutifs`}
            icon={Flame}
            variant="info"
          />
        </div>

        {/* Onglets de navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <Trophy size={14} />
            <span>Classement & Joueurs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-[var(--foreground)]">
              {leaderboard.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ranks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'ranks'
                ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <Layers size={14} />
            <span>Les 10 Rangs Culturels Malagasy</span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* ONGLET 1 : CLASSEMENT ET JOUEURS                              */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3.5">
            {/* Barre de recherche et filtrage unique (KISS & DRY) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[var(--card)] p-3 rounded-2xl border border-[var(--card-border)] shadow-xs">
              {/* Champ de recherche */}
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher parmi le Top 100 des joueurs (nom ou ID)..."
                  className="w-full pl-10 pr-9 py-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 rounded-full transition cursor-pointer"
                    title="Effacer la recherche"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filtre unique par Niveau */}
              <div className="relative shrink-0 flex items-center gap-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsLevelDropdownOpen((prev) => !prev)}
                  className={`w-full sm:w-auto flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    selectedLevel !== 'ALL'
                      ? 'border-[var(--accent)] bg-[var(--card-hover)] text-[var(--foreground)]'
                      : 'border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--card-hover)] text-[var(--foreground)]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Filter
                      size={14}
                      className={
                        selectedLevel !== 'ALL'
                          ? 'text-[var(--accent)]'
                          : 'text-[var(--text-subtle)]'
                      }
                    />
                    {activeRankObj ? (
                      <span className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: activeRankObj.color }}
                        />
                        <span className="font-semibold font-heritage truncate">
                          Niveau {activeRankObj.level} • {activeRankObj.titleMg}
                        </span>
                      </span>
                    ) : (
                      <span>Tous les niveaux</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-[var(--card-border)]/50 text-[var(--text-muted)]">
                      {activeRankObj
                        ? `${stats.levelDistribution[activeRankObj.level] || 0} j.`
                        : `${stats.totalPlayers} j.`}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-[var(--text-subtle)] transition-transform duration-200 ${
                        isLevelDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Bouton direct pour réinitialiser le filtre */}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedLevel('ALL');
                      setSearchQuery('');
                    }}
                    className="p-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer shrink-0"
                    title="Réinitialiser les filtres"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}

                {/* Menu déroulant des 10 Niveaux */}
                {isLevelDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 max-h-[420px] overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl z-30 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                    style={{ backdropFilter: 'blur(16px)' }}
                  >
                    <div className="px-3 py-2 text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-subtle)] border-b border-[var(--card-border)] flex items-center justify-between">
                      <span>Filtrer par niveau</span>
                      {selectedLevel !== 'ALL' && (
                        <button
                          onClick={() => {
                            setSelectedLevel('ALL');
                            setIsLevelDropdownOpen(false);
                          }}
                          className="text-[var(--accent)] hover:underline capitalize font-sans text-xs cursor-pointer font-medium"
                        >
                          Tous les niveaux
                        </button>
                      )}
                    </div>

                    {/* Option : Tous les niveaux */}
                    <button
                      onClick={() => {
                        setSelectedLevel('ALL');
                        setIsLevelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition cursor-pointer text-left ${
                        selectedLevel === 'ALL'
                          ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold'
                          : 'hover:bg-[var(--card-hover)] text-[var(--foreground)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users size={15} className="shrink-0 opacity-70" />
                        <div>
                          <div>Tous les niveaux</div>
                          <div className="text-[10px] opacity-70 font-normal">
                            Ensemble des joueurs classés
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] opacity-80">
                          {stats.totalPlayers}
                        </span>
                        {selectedLevel === 'ALL' && <Check size={14} />}
                      </div>
                    </button>

                    <div className="h-[1px] bg-[var(--card-border)] my-1" />

                    {/* Liste des 10 Niveaux */}
                    {CULTURAL_RANKS.map((rank) => {
                      const isSelected = selectedLevel === rank.level;
                      const count = stats.levelDistribution[rank.level] || 0;

                      return (
                        <button
                          key={rank.level}
                          onClick={() => {
                            setSelectedLevel(rank.level);
                            setIsLevelDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[var(--card-hover)] border border-[var(--card-border)] font-semibold'
                              : 'hover:bg-[var(--card-hover)] text-[var(--foreground)]'
                          } ${count === 0 ? 'opacity-40 hover:opacity-75' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: rank.color }}
                            />
                            <div className="min-w-0 truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-[var(--card-border)]/50 font-bold shrink-0">
                                  Niv. {rank.level}
                                </span>
                                <span className="font-heritage truncate">{rank.titleMg}</span>
                              </div>
                              <div className="text-[10px] text-[var(--text-subtle)] truncate">
                                {rank.titleFr} • {rank.minXp} XP requis
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                                count > 0
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-[var(--card-border)]/40 text-[var(--text-subtle)]'
                              }`}
                            >
                              {count} {count > 1 ? 'joueurs' : 'joueur'}
                            </span>
                            {isSelected && <Check size={14} className="text-[var(--accent)]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Table du Classement */}
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-xs">
              {isLoading ? (
                <div className="py-16 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Chargement du classement...</span>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[var(--card-border)]/40 flex items-center justify-center text-[var(--text-subtle)]">
                    <Users size={18} />
                  </div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Aucun joueur trouvé
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                    Aucun joueur ne correspond à ce niveau ou à cette recherche.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSelectedLevel('ALL');
                        setSearchQuery('');
                      }}
                      className="mt-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--card-border)] bg-neutral-50/50 dark:bg-neutral-800/30 text-[var(--text-subtle)] font-mono text-[10.5px]">
                        <th className="py-3 px-4 w-16 text-center font-normal">RANG</th>
                        <th className="py-3 px-4 font-normal">JOUEUR</th>
                        <th className="py-3 px-4 font-normal">RANG CULTUREL</th>
                        <th className="py-3 px-4 text-center font-normal">NIVEAU</th>
                        <th className="py-3 px-4 text-center font-normal">SÉRIE (STREAK)</th>
                        <th className="py-3 px-4 text-right font-normal">XP ACQUIS</th>
                        <th className="py-3 px-4 pr-4 text-right font-normal">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {filteredPlayers.map((player, idx) => {
                        const rankNumber = player.rank || idx + 1;
                        const culturalRank = progressionService.getRankForLevel(
                          player.level
                        );

                        return (
                          <tr
                            key={player.userId || idx}
                            className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                          >
                            {/* Position */}
                            <td className="py-3 px-4 text-center">
                              {rankNumber === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 font-bold text-xs">
                                  <Crown size={13} />
                                </span>
                              ) : rankNumber === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 font-bold text-xs">
                                  <Medal size={13} />
                                </span>
                              ) : rankNumber === 3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400 font-bold text-xs">
                                  <Award size={13} />
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-[var(--text-subtle)] font-medium">
                                  #{rankNumber}
                                </span>
                              )}
                            </td>

                            {/* Joueur */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-[var(--card-border)] text-[var(--foreground)] font-bold flex items-center justify-center text-xs">
                                  {player.name ? player.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="font-semibold text-[var(--foreground)]">
                                    {player.name || 'Anonyme'}
                                  </div>
                                  <div className="text-[10.5px] font-mono text-[var(--text-subtle)]">
                                    ID: {player.userId?.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Rang Culturel Malagasy */}
                            <td className="py-3 px-4">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
                                style={{
                                  borderColor: culturalRank.color,
                                  color: culturalRank.color,
                                  backgroundColor: `${culturalRank.color}15`,
                                }}
                              >
                                <Sparkles size={11} />
                                <span>{culturalRank.titleMg}</span>
                                <span className="opacity-70 text-[10px]">
                                  ({culturalRank.titleFr})
                                </span>
                              </span>
                            </td>

                            {/* Niveau */}
                            <td className="py-3 px-4 text-center">
                              <span className="font-mono font-bold text-xs text-[var(--foreground)]">
                                Niv. {player.level}
                              </span>
                            </td>

                            {/* Streak */}
                            <td className="py-3 px-4 text-center">
                              {player.streakDays > 0 ? (
                                <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                                  <Flame size={13} />
                                  <span>{player.streakDays} j</span>
                                </span>
                              ) : (
                                <span className="text-[var(--text-subtle)] text-xs">-</span>
                              )}
                            </td>

                            {/* XP Total */}
                            <td className="py-3 px-4 text-right">
                              <div className="font-mono font-bold text-xs text-[var(--foreground)]">
                                {player.totalXP.toLocaleString()} XP
                              </div>
                            </td>

                            {/* Actions Modérateur */}
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedUserForXp(player);
                                  setXpDeltaInput('50');
                                  setXpReasonInput('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer"
                              >
                                <PlusCircle size={12} className="text-emerald-600" />
                                <span>Ajuster XP</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* ONGLET 2 : LES 10 RANGS CULTURELS MALAGASY                     */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === 'ranks' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-1">
              <h3 className="text-sm font-semibold text-[var(--foreground)] font-heritage">
                Échelle Initiatique du Conservatoire Kanto
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Chaque niveau d&apos;expérience franchi par un apprenant débloque un titre culturel
                traditionnel malagasy récompensant sa maîtrise des contes, sagesses et de l&apos;art oratoire.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {CULTURAL_RANKS.map((rank) => {
                const playerCount = stats.levelDistribution[rank.level] || 0;
                const percentOfTotal =
                  stats.totalPlayers > 0
                    ? Math.round((playerCount / stats.totalPlayers) * 100)
                    : 0;

                return (
                  <div
                    key={rank.level}
                    className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:border-neutral-300 dark:hover:border-neutral-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Titre & Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono text-white"
                            style={{ backgroundColor: rank.color }}
                          >
                            {rank.level}
                          </span>
                          <h4 className="font-semibold text-sm text-[var(--foreground)] font-heritage">
                            {rank.titleMg}
                          </h4>
                          <span className="text-xs text-[var(--text-muted)]">
                            &bull; {rank.titleFr}
                          </span>
                        </div>

                        <span className="font-mono text-xs font-bold text-[var(--foreground)] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
                          {rank.minXp} XP+
                        </span>
                      </div>

                      {/* Description Bilingue */}
                      <div className="space-y-1 text-xs mt-2">
                        <p className="text-[var(--foreground)] font-medium leading-relaxed">
                          {rank.descriptionMg}
                        </p>
                        <p className="text-[var(--text-muted)] italic leading-relaxed">
                          {rank.descriptionFr}
                        </p>
                      </div>
                    </div>

                    {/* Jauge des joueurs ayant ce rang + Bouton d'accès direct */}
                    <div className="pt-2 border-t border-[var(--card-border)] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-subtle)]">
                          Joueurs à ce niveau
                        </span>
                        <span className="font-mono font-semibold text-[var(--foreground)]">
                          {playerCount} joueur{playerCount > 1 ? 's' : ''} ({percentOfTotal}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(4, percentOfTotal)}%`,
                            backgroundColor: rank.color,
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLevel(rank.level);
                          setActiveTab('leaderboard');
                        }}
                        className="w-full py-1 text-center text-[11px] font-medium rounded border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer"
                      >
                        Voir les joueurs de ce rang &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODALE : AJUSTEMENT D'XP MANUEL                               */}
        {/* ───────────────────────────────────────────────────────────── */}
        {selectedUserForXp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
            <div className="w-full max-w-md rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-3 duration-150">
              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" />
                  <h3 className="font-semibold text-sm text-[var(--foreground)]">
                    Ajuster les points d&apos;XP
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedUserForXp(null)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-lg border border-[var(--card-border)] text-xs space-y-1">
                <div className="font-semibold text-[var(--foreground)]">
                  {selectedUserForXp.name || 'Joueur sans nom'}
                </div>
                <div className="text-[var(--text-muted)] font-mono">
                  XP Actuel : {selectedUserForXp.totalXP.toLocaleString()} XP &bull; Niveau {selectedUserForXp.level}
                </div>
              </div>

              <form onSubmit={handleConfirmXpAdjustment} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                    Valeur d&apos;ajustement (XP)
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={xpDeltaInput}
                    onChange={(e) => setXpDeltaInput(e.target.value)}
                    placeholder="Ex: 50 ou -20"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--accent)]"
                  />
                  {/* Raccourcis rapides */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[25, 50, 100, 250, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setXpDeltaInput(String(val))}
                        className="px-2 py-0.5 rounded text-[10.5px] font-mono border border-[var(--card-border)] hover:bg-[var(--card-hover)] cursor-pointer"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                    Motif ou Justification (optionnel)
                  </label>
                  <input
                    type="text"
                    value={xpReasonInput}
                    onChange={(e) => setXpReasonInput(e.target.value)}
                    placeholder="Ex: Récompense contribution culturelle exceptionnelle"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--card-border)]">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForXp(null)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-xs font-medium hover:bg-[var(--card-hover)] cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingXp}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingXp ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    <span>Confirmer l&apos;ajustement</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
