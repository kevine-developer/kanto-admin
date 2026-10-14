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
    <div className="overflow-hidden border border-[var(--card-border)] rounded-xl bg-[var(--card)] shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[var(--input-bg)] text-[var(--text-muted)] font-semibold text-[11px] border-b border-[var(--card-border)]">
            <tr>
              <th className="py-2.5 px-3.5 w-32 font-mono">Période</th>
              <th className="py-2.5 px-3.5 w-24 text-center">Sceau / Image</th>
              <th className="py-2.5 px-3.5 w-56">Gouvernement / Régime</th>
              <th className="py-2.5 px-3.5">Description et Symbolique</th>
              <th className="py-2.5 px-3.5 text-center w-24">Statut</th>
              <th className="py-2.5 px-3.5 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--card-hover)] transition-colors">
                <td className="py-3 px-3.5 font-mono font-bold text-[var(--accent)] whitespace-nowrap">
                  {item.period}
                </td>
                <td className="py-3 px-3.5 text-center">
                  <div className="w-14 h-14 mx-auto rounded-lg overflow-hidden bg-[var(--input-bg)] border border-[var(--card-border)] shadow-xs flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={resolveMediaUrl(item.imageUrl)}
                        alt={item.government}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Shield size={20} className="text-[var(--text-subtle)]" />
                    )}
                  </div>
                </td>
                <td className="py-3 px-3.5 font-semibold text-[var(--foreground)]">
                  {item.government}
                </td>
                <td className="py-3 px-3.5 space-y-1">
                  <p className="text-[var(--foreground)] leading-relaxed">{item.descriptionFr}</p>
                  {item.descriptionMg && (
                    <p className="text-[11px] text-[var(--text-muted)] italic">
                      🇲🇬 {item.descriptionMg}
                    </p>
                  )}
                  {item.notesFr && (
                    <p className="text-[10.5px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block">
                      📌 {item.notesFr}
                    </p>
                  )}
                </td>
                <td className="py-3 px-3.5 text-center whitespace-nowrap">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                      item.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3 px-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
