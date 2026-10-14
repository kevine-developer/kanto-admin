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
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 shadow-xs flex items-start justify-between gap-3 hover:border-[var(--accent)] transition-colors"
        >
          <div className="flex gap-3 items-start min-w-0">
            <div className="w-14 h-14 rounded-lg bg-[var(--accent-light)] border border-[var(--accent-border)] flex flex-col items-center justify-center flex-shrink-0 text-[var(--accent-text)] font-bold shadow-xs">
              <span className="text-base font-mono leading-none">{item.year}</span>
              <span className="text-[10px] font-normal mt-0.5 opacity-80">Année</span>
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-semibold px-2 py-0.2 rounded-md bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]">
                  {item.exactDate}
                </span>
                <span className="text-[10.5px] text-[var(--text-muted)] font-mono">#{item.orderIndex}</span>
              </div>
              <h4 className="font-bold text-[var(--foreground)] text-sm truncate">
                {item.titleFr}
              </h4>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                {item.summaryFr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--input-bg)] rounded-lg transition-colors cursor-pointer"
              title="Modifier"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
