'use client';

import { useState, useEffect, useCallback } from 'react';
import { locksService } from '@/services/locks.service';
import { ModuleLockItem, LocksStats } from '@/types/lock';

export function useLocks() {
  const [modules, setModules] = useState<ModuleLockItem[]>([]);
  const [stats, setStats] = useState<LocksStats>({ total: 0, locked: 0, active: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await locksService.getLocks();
      setModules(res.modules || []);
      setStats(res.stats || { total: 0, locked: 0, active: 0 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement des modules';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLocks();
  }, [loadLocks]);

  // Bascule optimiste de verrouillage
  const toggleLock = async (module: ModuleLockItem) => {
    const nextLockedState = !module.isLocked;
    setUpdatingKey(module.key);

    // Mise à jour optimiste
    setModules((prev) =>
      prev.map((m) => (m.key === module.key ? { ...m, isLocked: nextLockedState } : m))
    );
    setStats((prev) => ({
      ...prev,
      locked: nextLockedState ? prev.locked + 1 : prev.locked - 1,
      active: nextLockedState ? prev.active - 1 : prev.active + 1,
    }));

    try {
      await locksService.toggleLock(module.key, nextLockedState);
    } catch (err) {
      // Rollback en cas d'erreur
      setModules((prev) =>
        prev.map((m) => (m.key === module.key ? { ...m, isLocked: module.isLocked } : m))
      );
      setStats((prev) => ({
        ...prev,
        locked: module.isLocked ? prev.locked + 1 : prev.locked - 1,
        active: module.isLocked ? prev.active - 1 : prev.active + 1,
      }));
      throw err;
    } finally {
      setUpdatingKey(null);
    }
  };

  const deleteModule = async (key: string) => {
    await locksService.deleteModule(key);
    setModules((prev) => prev.filter((m) => m.key !== key));
    await loadLocks();
  };

  return {
    modules,
    stats,
    isLoading,
    updatingKey,
    error,
    loadLocks,
    toggleLock,
    deleteModule,
  };
}
