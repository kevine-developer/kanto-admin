'use client';

import React from 'react';
import { ModuleLockItem } from '@/types/lock';
import { resolveMediaUrl } from '@/lib/utils/media';
import { Gamepad2, BookOpen, Lock, Check, Loader2, Edit3, Trash2 } from 'lucide-react';

interface LocksTableProps {
  modules: ModuleLockItem[];
  isLoading: boolean;
  updatingKey: string | null;
  onToggleLock: (item: ModuleLockItem) => Promise<void>;
  onEdit: (item: ModuleLockItem) => void;
  onDelete: (item: ModuleLockItem) => void;
}

export function LocksTable({
  modules,
  isLoading,
  updatingKey,
  onToggleLock,
  onEdit,
  onDelete,
}: LocksTableProps) {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
        <span>Chargement des modules...</span>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-[var(--text-muted)]">
        Aucun module trouvé pour les critères sélectionnés.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[var(--card-border)] bg-[var(--card-hover)]/40 text-[10.5px] font-mono text-[var(--text-subtle)] uppercase tracking-wider">
            <th className="py-2.5 px-3 w-24 text-center">Visuel</th>
            <th className="py-2.5 px-3">Nom &amp; Clé</th>
            <th className="py-2.5 px-3 w-28">Type</th>
            <th className="py-2.5 px-3 w-32 text-center">Disponibilité</th>
            <th className="py-2.5 px-3">Statut / Motif</th>
            <th className="py-2.5 px-3 w-24 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-border)]">
          {modules.map((item) => {
            const isProcessing = updatingKey === item.key;

            return (
              <tr
                key={item.id || item.key}
                className={`hover:bg-[var(--card-hover)]/30 transition-colors ${
                  item.isLocked ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                }`}
              >
                {/* Photo de présentation au format vignette 16:10 */}
                <td className="py-2 px-3 text-center">
                  <div
                    onClick={() => onEdit(item)}
                    title="Cliquer pour modifier la photo et les informations"
                    className="relative inline-block mx-auto group cursor-pointer"
                  >
                    {item.imageUrl ? (
                      <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-[var(--card-border)] shadow-xs bg-[var(--input-bg)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveMediaUrl(item.imageUrl)}
                          alt={item.nameFr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {item.imageUrl.includes('cloudinary.com') && (
                          <span
                            className="absolute top-0.5 right-0.5 px-1 py-0.2 rounded bg-emerald-600 text-white font-mono text-[8px] font-bold shadow-xs"
                            title="Hébergé sur Cloudinary CDN"
                          >
                            CDN
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-medium">
                          Changer
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded-lg bg-[var(--input-bg)] border border-dashed border-[var(--card-border)] flex flex-col items-center justify-center text-[var(--text-subtle)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-colors">
                        {item.type === 'GAME' ? (
                          <Gamepad2 className="w-3.5 h-3.5" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[8px] mt-0.5 font-medium">+ Photo</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Nom & Clé */}
                <td className="py-2.5 px-3">
                  <div className="font-semibold text-[var(--foreground)] text-xs">
                    {item.nameFr}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] italic">
                    {item.nameMg}
                  </div>
                  <div className="font-mono text-[9.5px] text-[var(--text-subtle)] mt-0.5">
                    {item.key}
                  </div>
                  {item.bgImageUrl && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-1.5 py-0.2 rounded font-mono">
                        🖼️ Fond immersif actif
                      </span>
                    </div>
                  )}
                </td>

                {/* Type */}
                <td className="py-2.5 px-3">
                  {item.type === 'GAME' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                      <Gamepad2 className="w-2.5 h-2.5" />
                      LALAO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 rounded">
                      <BookOpen className="w-2.5 h-2.5" />
                      SOKAJY
                    </span>
                  )}
                </td>

                {/* Switch de verrouillage instantané */}
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => onToggleLock(item)}
                    disabled={isProcessing}
                    aria-label={`Basculer l'accès pour ${item.nameFr}`}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 mx-auto ${
                      item.isLocked
                        ? 'bg-rose-500 dark:bg-rose-600'
                        : 'bg-emerald-500 dark:bg-emerald-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        item.isLocked ? 'translate-x-0' : 'translate-x-4'
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-2.5 h-2.5 text-neutral-500 animate-spin" />
                      ) : item.isLocked ? (
                        <Lock className="w-2 h-2 text-rose-600" />
                      ) : (
                        <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                      )}
                    </span>
                  </button>
                </td>

                {/* Motif d'indisponibilité */}
                <td className="py-2.5 px-3 max-w-xs">
                  {item.lockReason ? (
                    <span className="text-[11px] text-[var(--text-muted)] italic truncate block">
                      « {item.lockReason} »
                    </span>
                  ) : (
                    <span className="text-[10.5px] text-[var(--text-subtle)]">
                      Aucun motif
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition cursor-pointer"
                      title="Modifier les détails et l'image"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="p-1 rounded text-[var(--text-subtle)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="Supprimer ce module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
