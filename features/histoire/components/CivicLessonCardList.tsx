/* eslint-disable @next/next/no-img-element */
'use client';

import { Layers, Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { CivicLessonItem } from '@/types/history';

interface CivicLessonCardListProps {
  items: CivicLessonItem[];
  onEdit: (item: CivicLessonItem) => void;
  onDelete: (item: CivicLessonItem) => void;
}

export function CivicLessonCardList({ items, onEdit, onDelete }: CivicLessonCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune thématique trouvée"
        description="Ajoutez une thématique civique ou historique."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-[var(--accent)] transition-colors"
        >
          <div className="relative h-36 bg-[var(--input-bg)]">
            {item.imageUrl ? (
              <img
                src={resolveMediaUrl(item.imageUrl)}
                alt={item.titleFr}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">
                <Layers size={28} />
              </div>
            )}
            <span
              className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                item.status
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 bg-black/60 backdrop-blur-xs'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]'
              }`}
            >
              {item.status ? 'Disponible' : 'Désactivé'}
            </span>
          </div>

          <div className="p-3.5 space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {item.category?.map((c) => (
                <span
                  key={c}
                  className="text-[10px] font-medium bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)] px-1.5 py-0.2 rounded"
                >
                  {c}
                </span>
              ))}
            </div>
            <h4 className="font-bold text-[var(--foreground)] text-sm truncate">
              {item.titleFr}
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] font-medium truncate">
              🇲🇬 {item.titleMg}
            </p>
            <p className="text-xs text-[var(--foreground)] line-clamp-2 leading-relaxed pt-0.5">
              {item.descriptionFr}
            </p>
          </div>

          <div className="flex items-center justify-end gap-1 p-2.5 border-t border-[var(--card-border)]">
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
