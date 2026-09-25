/* eslint-disable @next/next/no-img-element */
'use client';

import { TreePine, Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { NatureEmblemItem } from '@/types/history';

interface NatureEmblemCardListProps {
  items: NatureEmblemItem[];
  onEdit: (item: NatureEmblemItem) => void;
  onDelete: (item: NatureEmblemItem) => void;
}

export function NatureEmblemCardList({ items, onEdit, onDelete }: NatureEmblemCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune espèce trouvée"
        description="Ajoutez une espèce emblématique de Madagascar."
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
          <div className="relative h-44 bg-stone-100 dark:bg-stone-800">
            {item.imageUrl ? (
              <img
                src={resolveMediaUrl(item.imageUrl)}
                alt={item.nameFr}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400">
                <TreePine size={32} />
              </div>
            )}
            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded-md">
              {item.type === 'FLORA' ? '🌿 Flore' : '🐾 Faune'}
            </span>
          </div>

          <div className="p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900 dark:text-white text-base">{item.nameFr}</h4>
              <span className="text-xs text-stone-500 font-medium">🇲🇬 {item.nameMg}</span>
            </div>
            <p className="text-xs italic font-serif text-emerald-700 dark:text-emerald-400">
              {item.scientificName}
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 mt-2">
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
