'use client';

import { useState, useEffect, useCallback } from 'react';
import { contesService } from '@/services/contes.service';
import { ConteItem, ConteFormData } from '@/types/conte';

export function useContes() {
  const [contes, setContes] = useState<ConteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await contesService.getContes(100);
      setContes(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des contes';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContes();
  }, [loadContes]);

  const saveConte = async (data: ConteFormData, id?: string | null) => {
    if (id) {
      await contesService.updateConte(id, data);
    } else {
      await contesService.createConte(data);
    }
    await loadContes();
  };

  const deleteConte = async (id: string) => {
    await contesService.deleteConte(id);
    setContes((prev) => prev.filter((c) => c.id !== id));
  };

  const generateAudio = async (id: string, lang: 'mg' | 'fr' | 'all', force: boolean) => {
    const res = await contesService.generateAudio(id, lang, force);
    if (res && (res.audioUrlMg !== undefined || res.audioUrlFr !== undefined)) {
      setContes((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                audioUrlMg: res.audioUrlMg ?? c.audioUrlMg,
                audioUrlFr: res.audioUrlFr ?? c.audioUrlFr,
              }
            : c
        )
      );
    } else {
      await loadContes();
    }
    return res;
  };

  return {
    contes,
    isLoading,
    error,
    loadContes,
    saveConte,
    deleteConte,
    generateAudio,
  };
}
