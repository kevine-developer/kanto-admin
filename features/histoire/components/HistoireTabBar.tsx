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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  dataKey: keyof HistoireAllData;
}> = [
  { key: 'presidents', label: 'Présidents', icon: Crown, dataKey: 'presidents' },
  { key: 'emblems', label: 'Emblèmes & Sceaux', icon: Shield, dataKey: 'nationalEmblems' },
  { key: 'provinces', label: '6 Provinces (Blasons)', icon: MapPin, dataKey: 'provinces' },
  { key: 'banknotes', label: 'Billets Malgaches', icon: BanknoteIcon, dataKey: 'banknotes' },
  { key: 'nature', label: 'Nature & Trésors', icon: TreePine, dataKey: 'natureEmblems' },
  { key: 'dates', label: 'Grandes Dates', icon: History, dataKey: 'historyDates' },
  { key: 'lessons', label: 'Rubriques & Civisme', icon: Layers, dataKey: 'lessons' },
];

/**
 * Barre d'onglets ergonomique et épurée pour la page Histoire & Patrimoine.
 */
export function HistoireTabBar({ activeTab, data, onChange }: HistoireTabBarProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs overflow-x-auto pb-1 sm:pb-1">
      {TABS.map(({ key, label, icon: Icon, dataKey }) => {
        const isActive = activeTab === key;
        const count = data[dataKey]?.length || 0;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              isActive
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
            }`}
          >
            <Icon size={14} className={isActive ? 'text-white' : 'text-[var(--text-subtle)]'} />
            <span>{label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                isActive
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
