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
  const accentColor = item.color || 'var(--accent)';
  const symbolsCount = Array.isArray(item.symbols) ? item.symbols.length : 0;
  const factsCount = Array.isArray(item.keyFactsFr) ? item.keyFactsFr.length : 0;

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-[var(--accent)] transition-colors relative overflow-hidden">
      {/* Liseré supérieur coloré */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accentColor }} />

      <div className="flex gap-3 items-start pt-0.5">
        <div className="w-16 h-20 rounded-lg overflow-hidden bg-[var(--input-bg)] flex-shrink-0 border border-[var(--card-border)] shadow-xs p-1 flex items-center justify-center">
          {item.imageUrl ? (
            <img src={resolveMediaUrl(item.imageUrl)} alt={item.province} className="w-full h-full object-contain" />
          ) : (
            <div className="text-[var(--text-subtle)]">
              <MapPin size={24} style={{ color: accentColor }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md text-white shadow-xs" style={{ backgroundColor: accentColor }}>
              {item.province}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">#{item.orderIndex}</span>
          </div>
          <p className="text-xs text-[var(--foreground)]">
            Chef-lieu : <span className="font-bold">{item.chefLieu}</span>
          </p>
          <p className="text-xs font-bold mt-0.5 truncate" style={{ color: accentColor }}>{item.titleFr}</p>
          <p className="text-[11px] text-[var(--text-muted)] italic truncate">🇲🇬 {item.titleMg}</p>
        </div>
      </div>

      <p className="text-xs text-[var(--foreground)] line-clamp-2 leading-relaxed">{item.descriptionFr}</p>

      <div className="flex items-center gap-1.5 pt-0.5">
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 bg-[var(--input-bg)]"
          style={{ borderColor: 'var(--card-border)', color: accentColor }}
        >
          <Shield size={11} />
          <span>{symbolsCount} symbole{symbolsCount > 1 ? 's' : ''}</span>
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] flex items-center gap-1">
          <Bookmark size={11} />
          <span>{factsCount} fait{factsCount > 1 ? 's' : ''} clé{factsCount > 1 ? 's' : ''}</span>
        </span>
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--card-border)] text-xs">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
            item.status === 'PUBLISHED'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]'
          }`}
        >
          {item.status}
        </span>
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

export function ProvinceCardList({ items, onEdit, onDelete }: ProvinceCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune province trouvée"
        description="Ajoutez les provinces historiques et leurs armoiries."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <ProvinceCard
          key={item.id}
          item={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item)}
        />
      ))}
    </div>
  );
}
