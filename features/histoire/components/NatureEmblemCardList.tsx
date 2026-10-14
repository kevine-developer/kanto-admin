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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-[var(--accent)] transition-colors"
        >
          <div className="relative h-40 bg-[var(--input-bg)]">
            {item.imageUrl ? (
              <img
                src={resolveMediaUrl(item.imageUrl)}
                alt={item.nameFr}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">
                <TreePine size={28} />
              </div>
            )}
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
              {item.type === 'FLORA' ? '🌿 Flore' : '🐾 Faune'}
            </span>
          </div>

          <div className="p-3.5 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-bold text-[var(--foreground)] text-sm truncate">{item.nameFr}</h4>
              <span className="text-[11px] text-[var(--text-muted)] font-medium shrink-0">🇲🇬 {item.nameMg}</span>
            </div>
            <p className="text-[11px] italic font-serif text-[var(--accent)]">
              {item.scientificName}
            </p>
            <p className="text-xs text-[var(--foreground)] line-clamp-2 leading-relaxed pt-1">
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
