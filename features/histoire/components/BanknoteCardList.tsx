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
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
      {/* Visuel du billet avec flip recto/verso interactif */}
      <div className="relative h-44 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 group">
        {activeImg ? (
          <img
            src={resolveMediaUrl(activeImg)}
            alt={`${item.titleFr} (${isVerso ? 'Verso' : 'Recto'})`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <BanknoteIcon size={36} />
          </div>
        )}

        {/* Badge de valeur en haut à droite */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
          {isColonial ? (
            <>
              <span className="px-2.5 py-1 bg-amber-700/95 backdrop-blur-xs text-white text-xs font-bold rounded-lg shadow-sm">
                {item.valueFmg.toLocaleString()} Francs
              </span>
              <span className="px-2 py-0.5 bg-black/75 backdrop-blur-xs text-amber-200 text-[9.5px] font-semibold rounded-md">
                Ère coloniale
              </span>
            </>
          ) : item.series === 'SERIE_FMG' ? (
            <>
              <span className="px-2.5 py-1 bg-amber-600/90 backdrop-blur-xs text-white text-xs font-bold rounded-lg shadow-sm">
                {item.valueFmg.toLocaleString()} Fmg
              </span>
              <span className="px-2 py-0.5 bg-black/65 backdrop-blur-xs text-stone-200 text-[10px] font-semibold rounded-md">
                Éq. {item.valueAriary.toLocaleString()} Ariary
              </span>
            </>
          ) : (
            <>
              <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-xs text-white text-xs font-bold rounded-lg shadow-sm">
                {item.valueAriary.toLocaleString()} Ariary
              </span>
              <span className="px-2 py-0.5 bg-black/65 backdrop-blur-xs text-stone-200 text-[10px] font-semibold rounded-md">
                {item.valueFmg.toLocaleString()} Fmg
              </span>
            </>
          )}
        </div>

        {/* Bouton bascule Recto / Verso */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsVerso((v) => !v); }}
          className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-black/75 hover:bg-black/90 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md backdrop-blur-xs transition-all cursor-pointer"
        >
          <RotateCcw size={12} className={isVerso ? 'rotate-180 transition-transform' : 'transition-transform'} />
          <span>{isVerso ? 'Verso (Arrière)' : 'Recto (Avant)'}</span>
        </button>

        {item.imageUrlVerso && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 text-[10px] font-bold rounded-md shadow-xs backdrop-blur-xs">
            2 Faces
          </span>
        )}
      </div>

      {/* Informations textuelles */}
      <div>
        <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              item.series === 'SERIE_2017'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : item.series === 'SERIE_2003'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {item.series}
          </span>
          <span className="font-medium text-stone-600 dark:text-stone-400">{item.period}</span>
        </div>
        <h4 className="font-bold text-stone-900 dark:text-white text-base">{item.titleFr}</h4>
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">🇲🇬 {item.titleMg}</p>
        <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-100 dark:border-stone-800">
          <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
            <span className="font-semibold text-stone-900 dark:text-white">{isVerso ? 'Verso : ' : 'Recto : '}</span>
            {isVerso ? item.reverseDescriptionFr : item.obverseDescriptionFr}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
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
                icon: <RotateCcw size={14} className={isSeeding ? 'animate-spin' : ''} />,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <BanknoteCard key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
      ))}
    </div>
  );
}
