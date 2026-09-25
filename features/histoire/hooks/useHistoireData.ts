'use client';

import { useState, useCallback, useEffect } from 'react';
import { historyService } from '@/services/history.service';
import type {
  PresidentItem,
  NationalEmblemItem,
  BanknoteItem,
  ProvinceBlasonItem,
  NatureEmblemItem,
  HistoryDateItem,
  CivicLessonItem,
} from '@/types/history';

export interface HistoireAllData {
  presidents: PresidentItem[];
  nationalEmblems: NationalEmblemItem[];
  banknotes: BanknoteItem[];
  provinces: ProvinceBlasonItem[];
  natureEmblems: NatureEmblemItem[];
  historyDates: HistoryDateItem[];
  lessons: CivicLessonItem[];
}

/**
 * Hook de chargement global des 7 entités Histoire & Patrimoine.
 * Charge toutes les données en parallèle avec isolement des erreurs par entité.
 */
export function useHistoireData() {
  const [data, setData] = useState<HistoireAllData>({
    presidents: [],
    nationalEmblems: [],
    banknotes: [],
    provinces: [],
    natureEmblems: [],
    historyDates: [],
    lessons: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        presidentsData,
        emblemsData,
        banknotesData,
        provincesData,
        natureData,
        datesData,
        lessonsData,
      ] = await Promise.all([
        historyService.getPresidents().catch((err) => {
          console.error('[histoire] getPresidents:', err);
          return [] as PresidentItem[];
        }),
        historyService.getNationalEmblems().catch((err) => {
          console.error('[histoire] getNationalEmblems:', err);
          return [] as NationalEmblemItem[];
        }),
        historyService.getBanknotes().catch((err) => {
          console.error('[histoire] getBanknotes:', err);
          return [] as BanknoteItem[];
        }),
        historyService.getProvinces().catch((err) => {
          console.error('[histoire] getProvinces:', err);
          return [] as ProvinceBlasonItem[];
        }),
        historyService.getNatureEmblems().catch((err) => {
          console.error('[histoire] getNatureEmblems:', err);
          return [] as NatureEmblemItem[];
        }),
        historyService.getHistoryDates().catch((err) => {
          console.error('[histoire] getHistoryDates:', err);
          return [] as HistoryDateItem[];
        }),
        historyService.getLessons().catch((err) => {
          console.error('[histoire] getLessons:', err);
          return [] as CivicLessonItem[];
        }),
      ]);

      setData({
        presidents: presidentsData,
        nationalEmblems: emblemsData,
        banknotes: banknotesData,
        provinces: provincesData,
        natureEmblems: natureData,
        historyDates: datesData,
        lessons: lessonsData,
      });
    } catch (err) {
      console.error('[histoire] Erreur chargement global:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return { data, isLoading, loadAll };
}
