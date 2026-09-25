/* eslint-disable @next/next/no-img-element */
'use client';

import { Shield, Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { resolveMediaUrl } from '@/lib/utils/media';
import type { NationalEmblemItem } from '@/types/history';

interface NationalEmblemTableProps {
  items: NationalEmblemItem[];
  onEdit: (item: NationalEmblemItem) => void;
  onDelete: (item: NationalEmblemItem) => void;
}

export function NationalEmblemTable({ items, onEdit, onDelete }: NationalEmblemTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucun emblème d'État trouvé"
        description="Ajoutez un emblème ou sceau officiel républicain."
      />
    );
  }

  return (
    <div className="overflow-hidden border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
          <tr>
            <th className="py-3.5 px-4 w-36">Période</th>
            <th className="py-3.5 px-4 w-28 text-center">Sceau / Image</th>
            <th className="py-3.5 px-4 w-60">Gouvernement / Régime</th>
            <th className="py-3.5 px-4">Description et Symbolique</th>
            <th className="py-3.5 px-4 text-center w-24">Statut</th>
            <th className="py-3.5 px-4 text-right w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
              <td className="py-4 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                {item.period}
              </td>
              <td className="py-4 px-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-inner">
                  {item.imageUrl ? (
                    <img
                      src={resolveMediaUrl(item.imageUrl)}
                      alt={item.government}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <Shield size={22} />
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4 font-semibold text-stone-900 dark:text-white">
                {item.government}
              </td>
              <td className="py-4 px-4 space-y-1.5">
                <p className="text-stone-800 dark:text-stone-200 text-sm">{item.descriptionFr}</p>
                {item.descriptionMg && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                    🇲🇬 {item.descriptionMg}
                  </p>
                )}
                {item.notesFr && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-md inline-block">
                    📌 {item.notesFr}
                  </p>
                )}
              </td>
              <td className="py-4 px-4 text-center whitespace-nowrap">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-semibold uppercase ${
                    item.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="py-4 px-4 text-right whitespace-nowrap">
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors ml-1"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
