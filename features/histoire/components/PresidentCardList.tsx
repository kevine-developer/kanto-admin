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
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex gap-4 items-start">
        <div className="w-20 h-28 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0 border border-stone-200 dark:border-stone-700 shadow-inner">
          {item.imageUrl ? (
            <img
              src={resolveMediaUrl(item.imageUrl)}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <Crown size={28} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-md text-white shadow-xs"
              style={{ backgroundColor: item.badgeColor || '#2A6B3D' }}
            >
              {item.republic}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                item.status === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
              }`}
            >
              {item.status}
            </span>
          </div>
          <h3 className="font-bold text-stone-900 dark:text-white text-base truncate">{item.name}</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">{item.period}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{item.titleFr}</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">🇲🇬 {item.titleMg}</p>
        </div>
      </div>

      {item.quoteFr && (
        <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border-l-3 border-emerald-500 space-y-1">
          <p className="text-xs italic text-stone-700 dark:text-stone-300 font-serif">« {item.quoteFr} »</p>
          {item.quoteMg && (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic font-serif">
              🇲🇬 « {item.quoteMg} »
            </p>
          )}
        </div>
      )}

      {Array.isArray(item.achievementsFr) && item.achievementsFr.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
            <Award size={12} />
            <span>Faits majeurs ({item.achievementsFr.length})</span>
          </p>
          <ul className="text-xs text-stone-600 dark:text-stone-300 list-disc list-inside space-y-0.5 line-clamp-2">
            {item.achievementsFr.slice(0, 2).map((ach, idx) => (
              <li key={idx} className="truncate">{ach}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400">
        <span className="font-mono text-[11px]">Ordre: #{item.orderIndex}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
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
        description="Créez une nouvelle fiche président de la République."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
