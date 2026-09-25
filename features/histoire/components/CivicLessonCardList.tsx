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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
        >
          <div className="relative h-36 bg-stone-100 dark:bg-stone-800">
            {item.imageUrl ? (
              <img
                src={resolveMediaUrl(item.imageUrl)}
                alt={item.titleFr}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                <Layers size={32} />
              </div>
            )}
            <span
              className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-xs font-semibold rounded-md ${
                item.status ? 'bg-emerald-500 text-white' : 'bg-stone-500 text-white'
              }`}
            >
              {item.status ? 'Disponible' : 'Désactivé'}
            </span>
          </div>

          <div className="p-4 space-y-2">
            <div className="flex flex-wrap gap-1">
              {item.category?.map((c) => (
                <span
                  key={c}
                  className="text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded"
                >
                  {c}
                </span>
              ))}
            </div>
            <h4 className="font-bold text-stone-900 dark:text-white text-base">
              {item.titleFr}
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              🇲🇬 {item.titleMg}
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
              {item.descriptionFr}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 p-3 border-t border-stone-100 dark:border-stone-800">
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
