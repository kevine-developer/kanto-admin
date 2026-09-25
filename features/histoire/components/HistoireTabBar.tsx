'use client';

import {
  Crown,
  Shield,
  Banknote as BanknoteIcon,
  MapPin,
  TreePine,
  History,
  Layers,
} from 'lucide-react';
import type { TabKey } from '../types/tabs';
import type { HistoireAllData } from '../hooks/useHistoireData';

interface HistoireTabBarProps {
  activeTab: TabKey;
  data: HistoireAllData;
  onChange: (tab: TabKey) => void;
}

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  dataKey: keyof HistoireAllData;
}> = [
  { key: 'presidents', label: 'Présidents', icon: Crown, dataKey: 'presidents' },
  { key: 'emblems', label: 'Emblèmes & Sceaux', icon: Shield, dataKey: 'nationalEmblems' },
  { key: 'provinces', label: '6 Provinces (Blasons)', icon: MapPin, dataKey: 'provinces' },
  { key: 'banknotes', label: 'Billets Malgaches', icon: BanknoteIcon, dataKey: 'banknotes' },
  { key: 'nature', label: 'Nature & Trésors', icon: TreePine, dataKey: 'natureEmblems' },
  { key: 'dates', label: 'Grandes Dates', icon: History, dataKey: 'historyDates' },
  { key: 'lessons', label: 'Thématiques / Rubriques', icon: Layers, dataKey: 'lessons' },
];

/**
 * Barre d'onglets ergonomique pour la page Histoire & Patrimoine.
 * Affiche le compteur d'éléments par onglet.
 */
export function HistoireTabBar({ activeTab, data, onChange }: HistoireTabBarProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
      {TABS.map(({ key, label, icon: Icon, dataKey }) => {
        const isActive = activeTab === key;
        const count = data[dataKey].length;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            <Icon size={16} />
            <span>{label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-mono">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
