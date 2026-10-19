'use client';

import { useState, useEffect, useCallback } from 'react';
import { rakiTenyService, GetRakiTenyParams } from '@/services/raki-teny.service';
import { RakiTenyWord, RakiTenyFormData, RarityFilterType } from '@/types/raki-teny';

export function useRakiTeny() {
  const [words, setWords] = useState<RakiTenyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [selectedRarity, setSelectedRarity] = useState<RarityFilterType>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadWords = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: GetRakiTenyParams = {
        page,
        limit,
        search: search.trim() || undefined,
        letter: selectedLetter !== 'ALL' ? selectedLetter : undefined,
        rarity: selectedRarity !== 'ALL' ? selectedRarity : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      };

      const res = await rakiTenyService.getWords(params);
      setWords(res.data);
      setTotalCount(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des mots rares';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, selectedLetter, selectedRarity, selectedCategory]);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  const saveWord = async (data: RakiTenyFormData, id?: string | null) => {
    if (id) {
      await rakiTenyService.updateWord(id, data);
    } else {
      await rakiTenyService.createWord(data);
    }
    await loadWords();
  };

  const deleteWord = async (id: string) => {
    await rakiTenyService.deleteWord(id);
    await loadWords();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedLetter('ALL');
    setSelectedRarity('ALL');
    setSelectedCategory('all');
    setPage(1);
  };

  return {
    words,
    isLoading,
    error,
    search,
    setSearch,
    selectedLetter,
    setSelectedLetter,
    selectedRarity,
    setSelectedRarity,
    selectedCategory,
    setSelectedCategory,
    page,
    setPage,
    totalPages,
    totalCount,
    loadWords,
    saveWord,
    deleteWord,
    resetFilters,
  };
}
