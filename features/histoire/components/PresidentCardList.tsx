/* eslint-disable @next/next/no-img-element */
'use client';

import { Crown, Award, Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { PresidentItem } from '@/types/history';

interface PresidentCardListProps {
  items: PresidentItem[];
  onEdit: (item: PresidentItem) => void;
  onDelete: (item: PresidentItem) => void;
}

function PresidentCard({
  item,
  onEdit,
  onDelete,
}: {
  item: PresidentItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-[var(--accent)] transition-colors overflow-hidden">
      <div className="flex gap-3 items-start">
        <div className="w-18 h-24 rounded-lg overflow-hidden bg-[var(--input-bg)] flex-shrink-0 border border-[var(--card-border)] shadow-xs flex items-center justify-center">
          {item.imageUrl ? (
            <img
              src={resolveMediaUrl(item.imageUrl)}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-[var(--text-subtle)]">
              <Crown size={24} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md text-white shadow-xs"
              style={{ backgroundColor: item.badgeColor || '#2A6B3D' }}
            >
              {item.republic}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                item.status === 'PUBLISHED'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]'
              }`}
            >
              {item.status}
            </span>
          </div>
          <h3 className="font-bold text-[var(--foreground)] text-sm truncate">{item.name}</h3>
          <p className="text-[11px] text-[var(--text-muted)] font-mono">{item.period}</p>
          <p className="text-xs text-[var(--accent)] mt-0.5 font-semibold truncate">{item.titleFr}</p>
          <p className="text-[11px] text-[var(--text-muted)] italic truncate">🇲🇬 {item.titleMg}</p>
        </div>
      </div>

      {item.quoteFr && (
        <div className="bg-[var(--input-bg)] p-2.5 rounded-lg border-l-2 border-[var(--accent)] space-y-0.5">
          <p className="text-xs italic text-[var(--foreground)] font-serif leading-snug">« {item.quoteFr} »</p>
          {item.quoteMg && (
            <p className="text-[10.5px] text-[var(--text-muted)] italic font-serif">
              🇲🇬 « {item.quoteMg} »
            </p>
          )}
        </div>
      )}

      {Array.isArray(item.achievementsFr) && item.achievementsFr.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <Award size={12} className="text-[var(--accent)]" />
            <span>Faits majeurs ({item.achievementsFr.length})</span>
          </p>
          <ul className="text-xs text-[var(--foreground)] list-disc list-inside space-y-0.5 line-clamp-2">
            {item.achievementsFr.slice(0, 2).map((ach, idx) => (
              <li key={idx} className="truncate">{ach}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--card-border)] text-xs text-[var(--text-muted)]">
        <span className="font-mono text-[10.5px]">Ordre: #{item.orderIndex}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--input-bg)] rounded-lg transition-colors cursor-pointer"
            title="Modifier"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PresidentCardList({ items, onEdit, onDelete }: PresidentCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucun président trouvé"
        description="Ajoutez un chef d'État ou dirigeant malgache."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <PresidentCard
          key={item.id}
          item={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      ))}
    </div>
  );
}
