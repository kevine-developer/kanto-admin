'use client';

import { Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import type { HistoryDateItem } from '@/types/history';

interface HistoryDateCardListProps {
  items: HistoryDateItem[];
  onEdit: (item: HistoryDateItem) => void;
  onDelete: (item: HistoryDateItem) => void;
}

export function HistoryDateCardList({ items, onEdit, onDelete }: HistoryDateCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune date trouvée"
        description="Ajoutez une date clé de l'histoire malgache."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4"
        >
          <div className="flex gap-4 items-start">
            <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex flex-col items-center justify-center flex-shrink-0 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs">
              <span className="text-lg leading-none">{item.year}</span>
              <span className="text-xs font-normal mt-0.5">Année</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {item.exactDate}
                </span>
                <span className="text-xs text-stone-400 font-mono">#{item.orderIndex}</span>
              </div>
              <h4 className="font-bold text-stone-900 dark:text-white text-base">
                {item.titleFr}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-3xl">
                {item.summaryFr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
