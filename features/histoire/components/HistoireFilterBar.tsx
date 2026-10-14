'use client';

import { Search, X } from 'lucide-react';
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
    <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <div className="relative flex-1">
        <label htmlFor="search-histoire" className="sr-only">
          Rechercher par nom, province, mot-clé, date
        </label>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
        <input
          id="search-histoire"
          name="searchHistoire"
          type="search"
          aria-label="Rechercher par nom, province, mot-clé, date..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher par nom, province, mot-clé, date..."
          className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)] transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {showBanknoteFilter && (
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <label htmlFor="banknote-series-filter" className="text-[11px] font-medium text-[var(--text-muted)]">
            Époque / Série :
          </label>
          <select
            id="banknote-series-filter"
            name="banknoteSeriesFilter"
            aria-label="Filtrer par époque ou série de billets"
            value={banknoteSeriesFilter}
            onChange={(e) => onBanknoteSeriesChange(e.target.value as BanknoteSeriesFilter)}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
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
              <option value="MDG250">Institut d&apos;Émission Malgache (1964-1970)</option>
              <option value="MDG200">Institut d&apos;Émission Malgache (1961)</option>
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
