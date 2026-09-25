'use client';

import { SearchBar } from '@/components/ui';

type BanknoteSeriesFilter = 'ALL' | 'SERIE_2017' | 'SERIE_2003' | 'SERIE_FMG' | 'COLONIAL';

interface HistoireFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showBanknoteFilter: boolean;
  banknoteSeriesFilter: BanknoteSeriesFilter;
  onBanknoteSeriesChange: (v: BanknoteSeriesFilter) => void;
  totalBanknotes: number;
}

/**
 * Barre de recherche et filtres contextuels pour la page Histoire.
 * Affiche le filtre par série uniquement sur l'onglet billets.
 */
export function HistoireFilterBar({
  searchQuery,
  onSearchChange,
  showBanknoteFilter,
  banknoteSeriesFilter,
  onBanknoteSeriesChange,
  totalBanknotes,
}: HistoireFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="w-full max-w-md">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Rechercher par nom, province, mot-clé, date..."
        />
      </div>

      {showBanknoteFilter && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
            Période / Série :
          </span>
          <select
            value={banknoteSeriesFilter}
            onChange={(e) => onBanknoteSeriesChange(e.target.value as BanknoteSeriesFilter)}
            className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-emerald-500 shadow-xs"
          >
            <option value="ALL">Toutes les époques ({totalBanknotes})</option>
            <option value="SERIE_2017">Série 2017 — Ariary moderne (MGA)</option>
            <option value="SERIE_2003">Série 2003 — Transition FMG / Ariary</option>
            <option value="SERIE_FMG">Série FMG — Républiques (1960 - 2003)</option>
            <option value="COLONIAL">Ère Coloniale — Francs (Avant 1960)</option>
          </select>
        </div>
      )}
    </div>
  );
}
