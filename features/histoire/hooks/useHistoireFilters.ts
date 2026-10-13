'use client';

import { useMemo, useState } from 'react';
import type { HistoireAllData } from './useHistoireData';
import type { TabKey } from '../types/tabs';

export type BanknoteSeriesFilter =
  | 'ALL'
  | 'SERIE_2017'
  | 'SERIE_2003'
  | 'SERIE_FMG'
  | 'COLONIAL'
  | string;

interface UseHistoireFiltersProps {
  data: HistoireAllData;
  activeTab: TabKey;
}

export function useHistoireFilters({ data }: UseHistoireFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [banknoteSeriesFilter, setBanknoteSeriesFilter] =
    useState<BanknoteSeriesFilter>('ALL');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const presidents = data.presidents.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.period.toLowerCase().includes(q) ||
        p.republic.toLowerCase().includes(q) ||
        p.titleFr.toLowerCase().includes(q)
    );

    const emblems = data.nationalEmblems.filter(
      (e) =>
        !q ||
        e.period.toLowerCase().includes(q) ||
        e.government.toLowerCase().includes(q) ||
        e.descriptionFr.toLowerCase().includes(q)
    );

    const banknotes = data.banknotes.filter((b) => {
      const seriesLower = (b.series || '').toLowerCase();
      const idLower = (b.id || '').toLowerCase();
      const periodLower = (b.period || '').toLowerCase();

      const isColonial =
        b.series === 'COLONIAL' ||
        b.series === 'MDG105' ||
        b.series === 'MDG100' ||
        b.series === 'MDG150' ||
        idLower.includes('colonial') ||
        periodLower.includes('1917') ||
        periodLower.includes('1925') ||
        periodLower.includes('1926') ||
        periodLower.includes('1950');

      const isFmgEra =
        b.series === 'SERIE_FMG' ||
        b.series === 'MDG200' ||
        b.series === 'MDG250' ||
        b.series === 'MDG300' ||
        b.series === 'MDG400' ||
        b.series === 'MDG450';

      const isAriaryTransition =
        b.series === 'SERIE_2003' ||
        b.series === 'MDG460' ||
        b.series === 'MDG465' ||
        b.series === 'MDG470' ||
        b.series === 'MDG475';

      const matchesQuery =
        !q ||
        b.titleFr.toLowerCase().includes(q) ||
        b.titleMg.toLowerCase().includes(q) ||
        String(b.valueAriary).includes(q) ||
        String(b.valueFmg).includes(q) ||
        seriesLower.includes(q) ||
        periodLower.includes(q);

      let matchesSeries = true;
      if (banknoteSeriesFilter === 'COLONIAL') {
        matchesSeries = isColonial;
      } else if (banknoteSeriesFilter === 'SERIE_FMG') {
        matchesSeries = isFmgEra && !isColonial;
      } else if (banknoteSeriesFilter === 'SERIE_2003') {
        matchesSeries = isAriaryTransition;
      } else if (banknoteSeriesFilter !== 'ALL') {
        matchesSeries =
          b.series === banknoteSeriesFilter ||
          idLower.includes(banknoteSeriesFilter.toLowerCase());
      }

      return matchesQuery && matchesSeries;
    });

    const provinces = data.provinces.filter(
      (pr) =>
        !q ||
        pr.province.toLowerCase().includes(q) ||
        pr.chefLieu.toLowerCase().includes(q) ||
        pr.titleFr.toLowerCase().includes(q)
    );

    const nature = data.natureEmblems.filter(
      (n) =>
        !q ||
        n.nameFr.toLowerCase().includes(q) ||
        n.scientificName.toLowerCase().includes(q) ||
        n.nameMg.toLowerCase().includes(q)
    );

    const dates = data.historyDates.filter(
      (d) => !q || d.year.includes(q) || d.titleFr.toLowerCase().includes(q)
    );

    const lessons = data.lessons.filter(
      (l) => !q || l.titleFr.toLowerCase().includes(q) || l.descriptionFr.toLowerCase().includes(q)
    );

    return {
      presidents,
      emblems,
      banknotes,
      provinces,
      nature,
      dates,
      lessons,
    };
  }, [data, searchQuery, banknoteSeriesFilter]);

  return {
    searchQuery,
    setSearchQuery,
    banknoteSeriesFilter,
    setBanknoteSeriesFilter,
    filtered,
  };
}
