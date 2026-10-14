/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { Banknote as BanknoteIcon, RotateCcw, Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { BanknoteItem } from '@/types/history';

interface BanknoteCardListProps {
  items: BanknoteItem[];
  isSeeding?: boolean;
  onSyncDefaults?: () => void;
  onEdit: (item: BanknoteItem) => void;
  onDelete: (item: BanknoteItem) => void;
}

function BanknoteCard({
  item,
  onEdit,
  onDelete,
}: {
  item: BanknoteItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isVerso, setIsVerso] = useState(false);

  const isColonial =
    item.series === 'COLONIAL' ||
    item.id.toLowerCase().includes('colonial') ||
    item.period.includes('1925') ||
    item.period.includes('1950');

  const activeImg = isVerso ? item.imageUrlVerso || item.imageUrl : item.imageUrl;

  return (
    <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-3.5 shadow-xs flex flex-col justify-between space-y-3 hover:border-[var(--accent)] transition-colors">
      {/* Visuel du billet avec flip recto/verso interactif */}
      <div className="relative h-40 bg-[var(--input-bg)] rounded-lg overflow-hidden border border-[var(--card-border)] group">
        {activeImg ? (
          <img
            src={resolveMediaUrl(activeImg)}
            alt={`${item.titleFr} (${isVerso ? 'Verso' : 'Recto'})`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-subtle)]">
            <BanknoteIcon size={32} />
          </div>
        )}

        {/* Badge de valeur en haut à droite */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {isColonial ? (
            <>
              <span className="px-2 py-0.5 bg-amber-700/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-md shadow-xs">
                {item.valueFmg.toLocaleString()} Francs
              </span>
              <span className="px-1.5 py-0.2 bg-black/70 backdrop-blur-xs text-amber-200 text-[9px] font-semibold rounded">
                Ère coloniale
              </span>
            </>
          ) : item.series === 'SERIE_FMG' ? (
            <>
              <span className="px-2 py-0.5 bg-amber-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-md shadow-xs">
                {item.valueFmg.toLocaleString()} Fmg
              </span>
              <span className="px-1.5 py-0.2 bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-semibold rounded">
                Éq. {item.valueAriary.toLocaleString()} Ariary
              </span>
            </>
          ) : (
            <>
              <span className="px-2 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bold rounded-md shadow-xs">
                {item.valueAriary.toLocaleString()} Ariary
              </span>
              <span className="px-1.5 py-0.2 bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-semibold rounded">
                {item.valueFmg.toLocaleString()} Fmg
              </span>
            </>
          )}
        </div>

        {/* Bouton bascule Recto / Verso */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsVerso((v) => !v);
          }}
          className="absolute bottom-2 left-2 px-2 py-1 bg-black/75 hover:bg-black/90 text-white rounded-md text-[11px] font-medium flex items-center gap-1.5 shadow-md backdrop-blur-xs transition cursor-pointer"
        >
          <RotateCcw size={11} className={isVerso ? 'rotate-180 transition-transform' : 'transition-transform'} />
          <span>{isVerso ? 'Verso (Arrière)' : 'Recto (Avant)'}</span>
        </button>

        <div className="absolute top-2 left-2 flex items-center gap-1">
          {item.imageUrlVerso && (
            <span className="px-1.5 py-0.5 bg-[var(--card)]/90 text-[var(--foreground)] text-[9.5px] font-bold rounded shadow-xs backdrop-blur-xs border border-[var(--card-border)]">
              2 Faces
            </span>
          )}
          {item.isComingSoon && (
            <span className="px-1.5 py-0.5 bg-amber-500/90 text-white text-[9.5px] font-bold rounded shadow-xs backdrop-blur-xs">
              À venir
            </span>
          )}
        </div>
      </div>

      {/* Informations textuelles */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                item.series === 'SERIE_2017'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : item.series === 'SERIE_2003'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {item.series}
            </span>
            {item.isComingSoon && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Textes à venir
              </span>
            )}
          </div>
          <span className="font-mono text-[11px]">{item.period}</span>
        </div>
        <h4 className="font-bold text-[var(--foreground)] text-sm truncate">{item.titleFr}</h4>
        <p className="text-[11px] text-[var(--text-muted)] font-medium truncate">🇲🇬 {item.titleMg}</p>
        <div className="p-2 bg-[var(--input-bg)] rounded-lg border border-[var(--card-border)]">
          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            <span className="font-semibold text-[var(--foreground)]">{isVerso ? 'Verso : ' : 'Recto : '}</span>
            {isVerso
              ? item.reverseDescriptionFr || (item.isComingSoon ? 'Description verso en cours de rédaction...' : 'Aucune description verso')
              : item.obverseDescriptionFr || (item.isComingSoon ? 'Description recto en cours de rédaction...' : 'Aucune description recto')}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 pt-2 border-t border-[var(--card-border)]">
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
  );
}

export function BanknoteCardList({
  items,
  isSeeding,
  onSyncDefaults,
  onEdit,
  onDelete,
}: BanknoteCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucun billet trouvé"
        description="Ajoutez un billet de banque au musée numismatique ou synchronisez les billets historiques par défaut."
        action={
          onSyncDefaults
            ? {
                label: isSeeding ? 'Synchronisation...' : 'Synchroniser les billets par défaut',
                onClick: onSyncDefaults,
                icon: <RotateCcw size={13} className={isSeeding ? 'animate-spin' : ''} />,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <BanknoteCard key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
      ))}
    </div>
  );
}
