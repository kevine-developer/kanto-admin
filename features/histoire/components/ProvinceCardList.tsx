/* eslint-disable @next/next/no-img-element */
'use client';

import { MapPin, Shield, Bookmark, Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { ProvinceBlasonItem } from '@/types/history';

interface ProvinceCardListProps {
  items: ProvinceBlasonItem[];
  onEdit: (item: ProvinceBlasonItem) => void;
  onDelete: (item: ProvinceBlasonItem) => void;
}

function ProvinceCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ProvinceBlasonItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cardBg = item.bgLight || '#F8FAFC';
  const cardBorder = item.borderLight || '#E2E8F0';
  const accentColor = item.color || '#2B6CB0';
  const symbolsCount = Array.isArray(item.symbols) ? item.symbols.length : 0;
  const factsCount = Array.isArray(item.keyFactsFr) ? item.keyFactsFr.length : 0;

  return (
    <div
      className="rounded-2xl border p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all relative overflow-hidden"
      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
    >
      {/* Liseré supérieur coloré */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: accentColor }} />

      <div className="flex gap-4 items-start pt-1">
        <div
          className="w-20 h-24 rounded-xl overflow-hidden bg-white dark:bg-stone-900 flex-shrink-0 border shadow-xs p-1.5 flex items-center justify-center"
          style={{ borderColor: cardBorder }}
        >
          {item.imageUrl ? (
            <img src={resolveMediaUrl(item.imageUrl)} alt={item.province} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <MapPin size={28} style={{ color: accentColor }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="px-2 py-0.5 text-xs font-bold rounded-md text-white" style={{ backgroundColor: accentColor }}>
              {item.province}
            </span>
            <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">#{item.orderIndex}</span>
          </div>
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
            Chef-lieu : <span className="font-bold">{item.chefLieu}</span>
          </p>
          <p className="text-xs font-bold mt-1 truncate" style={{ color: accentColor }}>{item.titleFr}</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic truncate">🇲🇬 {item.titleMg}</p>
        </div>
      </div>

      <p className="text-xs text-stone-700 dark:text-stone-300 line-clamp-3 leading-relaxed">{item.descriptionFr}</p>

      <div className="flex items-center gap-2 pt-1">
        <span
          className="text-[11px] px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 bg-white/70 dark:bg-stone-800/70"
          style={{ borderColor: cardBorder, color: accentColor }}
        >
          <Shield size={12} />
          <span>{symbolsCount} symbole{symbolsCount > 1 ? 's' : ''}</span>
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold border border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 flex items-center gap-1">
          <Bookmark size={12} />
          <span>{factsCount} fait{factsCount > 1 ? 's' : ''} clé{factsCount > 1 ? 's' : ''}</span>
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
            item.status === 'PUBLISHED' ? 'bg-emerald-600 text-white' : 'bg-stone-400 text-white'
          }`}
        >
          {item.status}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="p-1.5 text-stone-700 hover:text-emerald-700 hover:bg-white/80 dark:hover:bg-stone-800 rounded-lg transition-colors"
            title="Modifier"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-stone-700 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProvinceCardList({ items, onEdit, onDelete }: ProvinceCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune province trouvée"
        description="Ajoutez une province de Madagascar et son blason officiel."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((item) => (
        <ProvinceCard key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
      ))}
    </div>
  );
}
