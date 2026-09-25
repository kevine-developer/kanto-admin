'use client';

import { useState } from 'react';
import type { HistoryItem, ProvinceSymbol } from '@/types/history';
import type { GenericHistoryFormData } from '../types/forms';
import type { TabKey } from '../types/tabs';
import {
  PRESIDENT_DEFAULTS,
  PROVINCE_DEFAULTS,
  NATURE_DEFAULTS,
  BANKNOTE_DEFAULTS,
  HISTORY_DATE_DEFAULTS,
  CIVIC_LESSON_DEFAULTS,
  EMPTY_PROVINCE_SYMBOL,
} from '../constants';

/**
 * Hook gérant l'état de la modale CRUD de la feature Histoire.
 * Centralise : ouverture, fermeture, pré-remplissage et mise à jour du formulaire.
 */
export function useHistoireModal(activeTab: TabKey) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<GenericHistoryFormData>({});

  /**
   * Ouvre la modale en mode création avec les valeurs par défaut de l'onglet actif.
   */
  const openCreate = () => {
    setEditingItem(null);
    const defaults: GenericHistoryFormData = { orderIndex: 0, status: 'PUBLISHED' };

    if (activeTab === 'presidents') {
      Object.assign(defaults, PRESIDENT_DEFAULTS);
    } else if (activeTab === 'provinces') {
      Object.assign(defaults, PROVINCE_DEFAULTS);
      defaults.symbols = [{ ...EMPTY_PROVINCE_SYMBOL }];
    } else if (activeTab === 'nature') {
      Object.assign(defaults, NATURE_DEFAULTS);
    } else if (activeTab === 'banknotes') {
      Object.assign(defaults, BANKNOTE_DEFAULTS);
    } else if (activeTab === 'dates') {
      Object.assign(defaults, HISTORY_DATE_DEFAULTS);
    } else if (activeTab === 'lessons') {
      Object.assign(defaults, CIVIC_LESSON_DEFAULTS);
    }

    setFormValues(defaults);
    setIsModalOpen(true);
  };

  /**
   * Ouvre la modale en mode édition, en convertissant les listes
   * en strings multi-lignes pour les textareas.
   */
  const openEdit = (item: HistoryItem) => {
    setEditingItem(item);
    const values: GenericHistoryFormData = { ...(item as unknown as GenericHistoryFormData) };

    if ('achievementsFr' in item && Array.isArray(item.achievementsFr)) {
      values.achievementsFrRaw = item.achievementsFr.join('\n');
    }
    if ('achievementsMg' in item && Array.isArray(item.achievementsMg)) {
      values.achievementsMgRaw = item.achievementsMg.join('\n');
    }
    if ('keyFactsFr' in item && Array.isArray(item.keyFactsFr)) {
      values.keyFactsFrRaw = item.keyFactsFr.join('\n');
    }
    if ('keyFactsMg' in item && Array.isArray(item.keyFactsMg)) {
      values.keyFactsMgRaw = item.keyFactsMg.join('\n');
    }
    if ('securityFeaturesFr' in item && Array.isArray(item.securityFeaturesFr)) {
      values.securityFeaturesRaw = item.securityFeaturesFr.join('\n');
    }
    if ('category' in item && Array.isArray(item.category)) {
      values.categoryRaw = item.category.join(', ');
    }
    if ('symbols' in item && Array.isArray(item.symbols)) {
      values.symbols = item.symbols.length > 0
        ? [...item.symbols]
        : [{ ...EMPTY_PROVINCE_SYMBOL }];
    } else if (activeTab === 'provinces') {
      values.symbols = [{ ...EMPTY_PROVINCE_SYMBOL }];
    }
    if ('status' in item && typeof item.status === 'boolean') {
      values.lessonStatus = item.status;
    }

    setFormValues(values);
    setIsModalOpen(true);
  };

  const close = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // ─── Helpers symboles Province ─────────────────────────────────────────────

  const addSymbol = () => {
    setFormValues((prev) => ({
      ...prev,
      symbols: [...(prev.symbols ?? []), { ...EMPTY_PROVINCE_SYMBOL }],
    }));
  };

  const updateSymbol = (index: number, field: keyof ProvinceSymbol, value: string) => {
    setFormValues((prev) => {
      const current = Array.isArray(prev.symbols) ? [...prev.symbols] : [];
      if (!current[index]) {
        current[index] = { ...EMPTY_PROVINCE_SYMBOL };
      }
      current[index] = { ...current[index], [field]: value };
      return { ...prev, symbols: current };
    });
  };

  const removeSymbol = (index: number) => {
    setFormValues((prev) => {
      const current = Array.isArray(prev.symbols) ? [...prev.symbols] : [];
      current.splice(index, 1);
      return { ...prev, symbols: current };
    });
  };

  const applyColorPreset = (preset: { hex: string; bg: string; border: string }) => {
    setFormValues((prev) => ({
      ...prev,
      color: preset.hex,
      bgLight: preset.bg,
      borderLight: preset.border,
    }));
  };

  return {
    isModalOpen,
    editingItem,
    deletingItem,
    isSubmitting,
    formValues,
    setFormValues,
    setDeletingItem,
    setIsSubmitting,
    openCreate,
    openEdit,
    close,
    addSymbol,
    updateSymbol,
    removeSymbol,
    applyColorPreset,
  };
}
