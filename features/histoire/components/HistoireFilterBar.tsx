'use client';

import { SearchBar } from '@/components/ui';

import type { BanknoteSeriesFilter } from '../hooks/useHistoireFilters';

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
            Période / Émission :
          </span>
          <select
            value={banknoteSeriesFilter}
            onChange={(e) => onBanknoteSeriesChange(e.target.value as BanknoteSeriesFilter)}
            className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-emerald-500 shadow-xs"
          >
            <option value="ALL">Toutes les époques ({totalBanknotes})</option>
            <optgroup label="✨ Série Actuelle (2017 - Présent)">
              <option value="SERIE_2017">Banque Centrale de Madagascar (2017 - Présent)</option>
            </optgroup>
            <optgroup label="🔄 Ère Ariary & Transition (2003 - 2015)">
              <option value="SERIE_2003">Toutes les séries Transition (2003 - 2015)</option>
              <option value="MDG475">Banque Centrale de Madagascar (2007-2015)</option>
              <option value="MDG470">Banque Centrale de Madagascar (2007)</option>
              <option value="MDG465">Banque Centrale de Madagascar (2004-2006)</option>
              <option value="MDG460">Banque Centrale de Madagascar (2003)</option>
            </optgroup>
            <optgroup label="🇲🇬 Époque Républicaine en FMG (1960 - 2003)">
              <option value="SERIE_FMG">Toutes les séries FMG (1960 - 2003)</option>
              <option value="MDG450">Banque Centrale de Madagascar (1994-1998)</option>
              <option value="MDG400">Banque Centrale de Madagascar (1983-1993)</option>
              <option value="MDG300">Banque Centrale de la République Malgache (1974-1975)</option>
              <option value="MDG250">Institut d'Émission Malgache (1964-1970)</option>
              <option value="MDG200">Institut d'Émission Malgache (1961)</option>
            </optgroup>
            <optgroup label="🏛️ Période Coloniale (1917 - 1960)">
              <option value="COLONIAL">Toutes les séries coloniales</option>
              <option value="MDG150">Banque de Madagascar et des Comores (1950-1951)</option>
              <option value="MDG100">Banque de Madagascar (1926-1947)</option>
              <option value="MDG105">Colonie de Madagascar (1917)</option>
            </optgroup>
          </select>
        </div>
      )}
    </div>
  );
}
