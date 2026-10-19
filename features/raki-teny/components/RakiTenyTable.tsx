'use client';

import React from 'react';
import { RakiTenyWord, WordRarity } from '@/types/raki-teny';
import { Edit2, Trash2, Eye, Heart, Sparkles, BookOpen } from 'lucide-react';

interface RakiTenyTableProps {
  words: RakiTenyWord[];
  isLoading: boolean;
  onEdit: (word: RakiTenyWord) => void;
  onDelete: (word: RakiTenyWord) => void;
  onSelect?: (word: RakiTenyWord) => void;
}

function getRarityBadge(rarity: WordRarity, _labelFr?: string) {
  switch (rarity) {
    case 'VERY_RARE':
      return {
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-500/25',
      };
    case 'ARCHAIC':
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-500/25',
      };
    case 'POETIC':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/25',
      };
    case 'PROVERBIAL':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/25',
      };
    case 'LITERAL':
    default:
      return {
        bg: 'bg-stone-500/10 dark:bg-stone-500/20',
        text: 'text-stone-700 dark:text-stone-300',
        border: 'border-stone-500/25',
      };
  }
}

export function RakiTenyTable({
  words,
  isLoading,
  onEdit,
  onDelete,
  onSelect,
}: RakiTenyTableProps) {
  if (isLoading) {
    return (
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent)] border-t-transparent" />
        <p className="mt-3 text-xs text-[var(--muted)] font-medium">
          Chargement du dictionnaire des mots rares...
        </p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-3">
          <BookOpen size={22} strokeWidth={2} />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Aucun mot rare trouvé
        </h3>
        <p className="mt-1 text-xs text-[var(--muted)] max-w-sm mx-auto">
          Aucun trésor de la langue malgache ne correspond à vos critères de recherche actuels.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--card-hover)]/40 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              <th className="py-3 px-4">Mot & Phonétique</th>
              <th className="py-3 px-4">Classe & Rareté</th>
              <th className="py-3 px-4 min-w-[280px]">Définitions (MG / FR)</th>
              <th className="py-3 px-4 min-w-[240px]">Exemple & Contexte</th>
              <th className="py-3 px-3 text-center">Stats</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-xs">
            {words.map((item) => {
              const rarityStyle = getRarityBadge(item.rarity, item.rarityLabelFr);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-[var(--card-hover)]/50 transition-colors group"
                >
                  {/* Mot et Phonétique */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[var(--foreground)] tracking-tight">
                        {item.word}
                      </span>
                      {item.isFeatured && (
                        <span title="Mis en avant">
                          <Sparkles size={13} className="text-amber-500 fill-amber-500" />
                        </span>
                      )}
                    </div>
                    {item.phonetic && (
                      <div className="text-[11px] font-mono text-[var(--accent)] mt-0.5">
                        /{item.phonetic}/
                      </div>
                    )}
                    <div className="mt-1">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--muted)] bg-[var(--bg-subtle)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                        {item.category}
                      </span>
                    </div>
                  </td>

                  {/* Classe et Rareté */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-medium text-[var(--foreground)] text-[11.5px]">
                      {item.wordClassMg}
                    </div>
                    <div className="text-[10.5px] text-[var(--muted)] italic">
                      {item.wordClassFr}
                    </div>
                    <div className="mt-1.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${rarityStyle.bg} ${rarityStyle.text} ${rarityStyle.border}`}
                      >
                        {item.rarityLabelFr || item.rarity}
                      </span>
                    </div>
                  </td>

                  {/* Définitions */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1.5">
                      <div className="text-[11.5px] leading-relaxed text-[var(--foreground)] line-clamp-2">
                        <span className="font-semibold text-[var(--accent)] mr-1">MG :</span>
                        {item.meaningMg}
                      </div>
                      <div className="text-[11px] leading-relaxed text-[var(--muted)] line-clamp-2 italic">
                        <span className="font-semibold text-stone-600 dark:text-stone-400 not-italic mr-1">FR :</span>
                        {item.meaningFr}
                      </div>
                    </div>
                  </td>

                  {/* Exemples & Contexte */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="space-y-1 text-[11px]">
                      <div className="text-[var(--foreground)] line-clamp-2">
                        <span className="text-[var(--muted)] font-serif italic mr-1">«</span>
                        {item.exampleMg}
                        <span className="text-[var(--muted)] font-serif italic ml-1">»</span>
                      </div>
                      {item.contextUsage && (
                        <div className="text-[10px] text-[var(--muted)]">
                          <span className="font-medium text-[var(--accent)]">Usage : </span>
                          {item.contextUsage}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Statistiques */}
                  <td className="py-3.5 px-3 align-top text-center">
                    <div className="inline-flex flex-col gap-1 items-center">
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-[var(--muted)]" title="Vues">
                        <Eye size={12} />
                        {item.viewCount}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-rose-500/80 font-medium" title="J'aime">
                        <Heart size={11} className="fill-rose-500/30" />
                        {item.likesCount}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 align-top text-right">
                    <div className="inline-flex items-center gap-1">
                      {onSelect && (
                        <button
                          onClick={() => onSelect(item)}
                          className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
                          title="Voir les détails complets"
                          aria-label="Aperçu"
                        >
                          <Eye size={14} strokeWidth={2.2} />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                        title="Modifier ce mot"
                        aria-label="Modifier"
                      >
                        <Edit2 size={14} strokeWidth={2.2} />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Supprimer ce mot"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
