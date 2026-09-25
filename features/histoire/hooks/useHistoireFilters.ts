'use client';

import { useMemo, useState } from 'react';
import type { HistoireAllData } from './useHistoireData';
import type { TabKey } from '../types/tabs';

export type BanknoteSeriesFilter =
  | 'ALL'
  | 'SERIE_2017'
  | 'SERIE_2003'
  | 'SERIE_FMG'
  | 'COLONIAL';

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
      const isColonial =
        b.series === 'COLONIAL' ||
        b.id.toLowerCase().includes('colonial') ||
        b.period.includes('1925') ||
        b.period.includes('1950');

      const matchesQuery =
        !q ||
        b.titleFr.toLowerCase().includes(q) ||
        b.titleMg.toLowerCase().includes(q) ||
        String(b.valueAriary).includes(q) ||
        String(b.valueFmg).includes(q) ||
        b.series.toLowerCase().includes(q) ||
        b.period.toLowerCase().includes(q);

      let matchesSeries = true;
      if (banknoteSeriesFilter === 'COLONIAL') {
        matchesSeries = isColonial;
      } else if (banknoteSeriesFilter === 'SERIE_FMG') {
        matchesSeries = b.series === 'SERIE_FMG' && !isColonial;
      } else if (banknoteSeriesFilter !== 'ALL') {
        matchesSeries = b.series === banknoteSeriesFilter;
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
