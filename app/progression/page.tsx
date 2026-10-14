'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  progressionService,
  CULTURAL_RANKS,
} from '@/services/progression.service';
import {
  ProgressionStats,
  LeaderboardUserItem,
} from '@/types/progression';
import {
  Trophy,
  Users,
  Flame,
  Search,
  Award,
  Crown,
  Medal,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Layers,
  X,
  Loader2,
  ChevronDown,
  Filter,
  RotateCcw,
} from 'lucide-react';

type ActiveTab = 'leaderboard' | 'ranks';

/**
 * Page d'administration de la progression, des rangs culturels et du classement des joueurs.
 * Permet la supervision de l'XP, du leaderboard et l'ajustement direct des points.
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

  const activeRankObj = useMemo(() => {
    return selectedLevel === 'ALL'
      ? null
      : CULTURAL_RANKS.find((r) => r.level === selectedLevel);
  }, [selectedLevel]);

  const hasActiveFilters = selectedLevel !== 'ALL' || searchQuery.trim().length > 0;
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

  // Filtrage local
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
        text: `Points mis à jour pour ${selectedUserForXp.name || 'le joueur'} (${delta > 0 ? `+${delta}` : delta} XP).`,
      });

      setSelectedUserForXp(null);
      setXpDeltaInput('50');
      setXpReasonInput('');
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'ajustement";
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmittingXp(false);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 max-w-6xl mx-auto pb-12">
        {/* En-tête standardisé */}
        <PageHeader
          title="Progression & Gamification"
          description="Supervision de l'engagement des joueurs, des séries actives et de la hiérarchie des 10 Rangs Culturels Malagasy."
          icon={Trophy}
          actions={
            <button
              onClick={() => void loadData()}
              disabled={isLoading}
              className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Actualiser"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
        />

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl flex items-center justify-between text-xs font-medium border shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0" />
              ) : (
                <AlertCircle size={15} className="shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 4 Métriques compactes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Joueurs Inscrits</span>
              <Users size={13} className="text-[var(--accent)]" />
            </div>
            <div className="text-lg font-bold font-mono text-[var(--foreground)] mt-1">
              {isLoading ? '...' : stats.totalPlayers.toLocaleString()}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Profils avec progression</div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Total XP Distribué</span>
              <Flame size={13} className="text-amber-500" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {isLoading ? '...' : `${stats.totalXpDistributed.toLocaleString()} XP`}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Points acquis en jeu</div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Niveau Record</span>
              <Crown size={13} className="text-emerald-500" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {isLoading ? '...' : `Niveau ${stats.maxLevel}`}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Moyenne : Niv. {stats.averageLevel}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Séries Actives (Streaks)</span>
              <Flame size={13} className="text-orange-500" />
            </div>
            <div className="text-lg font-bold font-mono text-orange-600 dark:text-orange-400 mt-1">
              {isLoading ? '...' : stats.activeStreaksCount}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Record : {stats.maxStreakDays} j consécutifs
            </div>
          </div>
        </div>

        {/* Onglets épurés */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs w-fit">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <Trophy size={13} />
            <span>Classement & Joueurs</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'leaderboard' ? 'bg-white/20 text-white' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
              }`}
            >
              {leaderboard.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ranks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'ranks'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <Layers size={13} />
            <span>Les 10 Rangs Culturels</span>
          </button>
        </div>

        {/* ─── ONGLET 1 : CLASSEMENT ─────────────────────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            {/* Barre de recherche et filtre de niveau */}
            <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <label htmlFor="search-progression-players" className="sr-only">
                  Rechercher un joueur par nom ou ID
                </label>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                <input
                  id="search-progression-players"
                  name="searchPlayers"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher parmi le Top 100 des joueurs (nom ou ID)..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filtre Niveau */}
              <div className="relative shrink-0 flex items-center gap-2" ref={dropdownRef}>
                <button
                  onClick={() => setIsLevelDropdownOpen((prev) => !prev)}
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    selectedLevel !== 'ALL'
                      ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent-text)]'
                      : 'border-[var(--input-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)]'
                  }`}
                >
                  <Filter size={13} className="text-[var(--text-subtle)]" />
                  {activeRankObj ? (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeRankObj.color }} />
                      Niveau {activeRankObj.level} • {activeRankObj.titleMg}
                    </span>
                  ) : (
                    <span>Tous les niveaux</span>
                  )}
                  <ChevronDown
                    size={13}
                    className={`text-[var(--text-subtle)] transition-transform ${
                      isLevelDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedLevel('ALL');
                      setSearchQuery('');
                    }}
                    className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
                    title="Réinitialiser les filtres"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}

                {/* Menu déroulant */}
                {isLevelDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-72 max-h-80 overflow-y-auto rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl z-30 p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setSelectedLevel('ALL');
                        setIsLevelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer text-left ${
                        selectedLevel === 'ALL'
                          ? 'bg-[var(--accent)] text-white font-semibold'
                          : 'hover:bg-[var(--card-hover)] text-[var(--foreground)]'
                      }`}
                    >
                      <span>Tous les niveaux</span>
                      <span className="font-mono text-[11px] opacity-80">{stats.totalPlayers} j.</span>
                    </button>

                    <div className="h-px bg-[var(--card-border)] my-1" />

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
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold border border-[var(--accent-border)]'
                              : 'hover:bg-[var(--card-hover)] text-[var(--foreground)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rank.color }} />
                            <span className="truncate">
                              Niv. {rank.level} • {rank.titleMg}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] opacity-75 shrink-0 ml-1">
                            {count} j.
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tableau du Classement */}
            <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs overflow-hidden">
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                  <span className="text-xs text-[var(--text-muted)]">Chargement du classement...</span>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                  Aucun joueur ne correspond à ce niveau ou à cette recherche.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)] text-[11px] font-semibold text-[var(--text-muted)]">
                        <th className="py-2.5 px-3.5 w-16 text-center">Rang</th>
                        <th className="py-2.5 px-3.5">Joueur</th>
                        <th className="py-2.5 px-3.5">Rang Culturel</th>
                        <th className="py-2.5 px-3.5 text-center">Niveau</th>
                        <th className="py-2.5 px-3.5 text-center">Série (Streak)</th>
                        <th className="py-2.5 px-3.5 text-right">XP Acquis</th>
                        <th className="py-2.5 px-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                      {filteredPlayers.map((player, idx) => {
                        const rankNumber = player.rank || idx + 1;
                        const culturalRank = progressionService.getRankForLevel(player.level);

                        return (
                          <tr key={player.userId || idx} className="hover:bg-[var(--card-hover)] transition-colors">
                            {/* Position */}
                            <td className="py-2.5 px-3.5 text-center">
                              {rankNumber === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                  <Crown size={13} />
                                </span>
                              ) : rankNumber === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300/40 text-slate-700 dark:text-slate-300 font-bold text-xs">
                                  <Medal size={13} />
                                </span>
                              ) : rankNumber === 3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold text-xs">
                                  <Award size={13} />
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-[var(--text-muted)] font-medium">
                                  #{rankNumber}
                                </span>
                              )}
                            </td>

                            {/* Joueur */}
                            <td className="py-2.5 px-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--accent-text)] font-bold flex items-center justify-center text-xs shrink-0">
                                  {player.name ? player.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-[var(--foreground)] truncate">
                                    {player.name || 'Anonyme'}
                                  </div>
                                  <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                                    ID: {player.userId?.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Rang Culturel Malagasy */}
                            <td className="py-2.5 px-3.5">
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border shadow-2xs"
                                style={{
                                  borderColor: culturalRank.color,
                                  color: culturalRank.color,
                                  backgroundColor: `${culturalRank.color}15`,
                                }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: culturalRank.color }} />
                                <span>{culturalRank.titleMg}</span>
                                <span className="opacity-70 text-[10px] font-normal">
                                  ({culturalRank.titleFr})
                                </span>
                              </span>
                            </td>

                            {/* Niveau */}
                            <td className="py-2.5 px-3.5 text-center">
                              <span className="font-mono font-bold text-xs text-[var(--foreground)]">
                                Niv. {player.level}
                              </span>
                            </td>

                            {/* Streak */}
                            <td className="py-2.5 px-3.5 text-center">
                              {player.streakDays > 0 ? (
                                <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                                  <Flame size={13} />
                                  <span>{player.streakDays} j</span>
                                </span>
                              ) : (
                                <span className="text-[var(--text-muted)] text-xs">—</span>
                              )}
                            </td>

                            {/* XP Total */}
                            <td className="py-2.5 px-3.5 text-right">
                              <div className="font-mono font-bold text-xs text-[var(--foreground)]">
                                {player.totalXP.toLocaleString()} XP
                              </div>
                            </td>

                            {/* Action Modérateur */}
                            <td className="py-2.5 px-3.5 text-right">
                              <button
                                onClick={() => {
                                  setSelectedUserForXp(player);
                                  setXpDeltaInput('50');
                                  setXpReasonInput('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer shadow-xs"
                              >
                                <PlusCircle size={12} className="text-emerald-500" />
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

        {/* ─── ONGLET 2 : LES 10 RANGS CULTURELS ───────────────────────────────── */}
        {activeTab === 'ranks' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs">
              <h3 className="text-xs font-bold text-[var(--foreground)]">
                Échelle Initiatique du Conservatoire Kanto
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Chaque palier d&apos;expérience franchi par un apprenant débloque un titre culturel
                traditionnel malagasy récompensant sa maîtrise des contes, sagesses et de l&apos;art oratoire.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CULTURAL_RANKS.map((rank) => {
                const playerCount = stats.levelDistribution[rank.level] || 0;
                const percentOfTotal =
                  stats.totalPlayers > 0
                    ? Math.round((playerCount / stats.totalPlayers) * 100)
                    : 0;

                return (
                  <div
                    key={rank.level}
                    className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)] transition-colors shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Titre & Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: rank.color }}
                          >
                            {rank.level}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[var(--foreground)] truncate">
                              {rank.titleMg}
                            </h4>
                            <span className="text-[10px] text-[var(--text-muted)] block">
                              {rank.titleFr}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono text-xs font-semibold text-[var(--foreground)] bg-[var(--input-bg)] border border-[var(--input-border)] px-2 py-0.5 rounded-md shrink-0">
                          {rank.minXp} XP+
                        </span>
                      </div>

                      {/* Description Bilingue */}
                      <div className="space-y-1 text-xs mt-2.5">
                        <p className="text-[var(--foreground)] font-medium leading-relaxed text-[11px]">
                          {rank.descriptionMg}
                        </p>
                        <p className="text-[var(--text-muted)] italic leading-relaxed text-[10px]">
                          {rank.descriptionFr}
                        </p>
                      </div>
                    </div>

                    {/* Jauge des joueurs ayant ce rang */}
                    <div className="pt-2 border-t border-[var(--card-border)] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-muted)]">Joueurs à ce niveau</span>
                        <span className="font-mono font-semibold text-[var(--foreground)]">
                          {playerCount} ({percentOfTotal}%)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--input-bg)] h-1.5 rounded-full overflow-hidden">
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
                        className="w-full py-1 text-center text-xs font-medium rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer"
                      >
                        Filtrer les joueurs de ce rang &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── MODALE : AJUSTEMENT D'XP MANUEL ──────────────────────────────── */}
        {selectedUserForXp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)]">
                <div className="flex items-center gap-2">
                  <Award size={15} className="text-amber-500" />
                  <h3 className="font-semibold text-sm text-[var(--foreground)]">
                    Ajuster les points d&apos;XP
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedUserForXp(null)}
                  className="p-1 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--card-border)] text-xs space-y-0.5">
                  <div className="font-semibold text-[var(--foreground)]">
                    {selectedUserForXp.name || 'Joueur sans nom'}
                  </div>
                  <div className="text-[var(--text-muted)] font-mono text-[11px]">
                    XP Actuel : {selectedUserForXp.totalXP.toLocaleString()} XP • Niveau {selectedUserForXp.level}
                  </div>
                </div>

                <form onSubmit={handleConfirmXpAdjustment} className="space-y-3.5">
                  <div>
                    <label htmlFor="xp-delta-input" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Valeur d&apos;ajustement (XP)
                    </label>
                    <input
                      id="xp-delta-input"
                      name="xpDelta"
                      type="number"
                      step="1"
                      required
                      value={xpDeltaInput}
                      onChange={(e) => setXpDeltaInput(e.target.value)}
                      placeholder="Ex: 50 ou -20"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--accent)]"
                    />
                    {/* Raccourcis rapides */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {[25, 50, 100, 250, 500].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setXpDeltaInput(String(val))}
                          className="px-2 py-0.5 rounded-md text-[10.5px] font-mono border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] cursor-pointer text-[var(--foreground)]"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="xp-reason-input" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Motif ou Justification (optionnel)
                    </label>
                    <input
                      id="xp-reason-input"
                      name="xpReason"
                      type="text"
                      value={xpReasonInput}
                      onChange={(e) => setXpReasonInput(e.target.value)}
                      placeholder="Ex: Récompense contribution culturelle"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--card-border)]">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForXp(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-xs font-medium text-[var(--foreground)] cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingXp}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-xs disabled:opacity-50"
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
          </div>
        )}
      </div>
    </AdminShell>
  );
}
