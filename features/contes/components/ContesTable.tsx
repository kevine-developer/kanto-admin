'use client';

import React from 'react';
import { ConteItem } from '@/types/conte';
import { AudioPlayerInline } from '@/components/ui';
import {
  Headphones,
  RotateCcw,
  Loader2,
  FileText,
  Trash2,
  Edit,
} from 'lucide-react';

interface ContesTableProps {
  contes: ConteItem[];
  isLoading: boolean;
  generatingId: string | null;
  generatingLang: 'mg' | 'fr' | 'all' | null;
  onGenerateAudio: (id: string, lang: 'mg' | 'fr' | 'all') => void;
  onSelect: (conte: ConteItem) => void;
  onEdit: (conte: ConteItem) => void;
  onDelete: (id: string) => void;
}

export function ContesTable({
  contes,
  isLoading,
  generatingId,
  generatingLang,
  onGenerateAudio,
  onSelect,
  onEdit,
  onDelete,
}: ContesTableProps) {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
        <span>Chargement des contes...</span>
      </div>
    );
  }

  if (contes.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-[var(--text-muted)]">
        Aucun conte ne correspond à vos critères.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[var(--card-border)] bg-[var(--card-hover)]/40 text-[10.5px] font-mono text-[var(--text-subtle)] uppercase tracking-wider">
            <th className="py-2.5 px-3">Titre &amp; Récit</th>
            <th className="py-2.5 px-3 w-64">Audio Malagasy (MG)</th>
            <th className="py-2.5 px-3 w-64">Audio Français (FR)</th>
            <th className="py-2.5 px-3 w-28 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-border)]">
          {contes.map((conte) => {
            const isGenMg = generatingId === conte.id && generatingLang === 'mg';
            const isGenFr = generatingId === conte.id && generatingLang === 'fr';

            return (
              <tr
                key={conte.id}
                className="hover:bg-[var(--card-hover)]/30 transition-colors"
              >
                <td className="py-3 px-3">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => onSelect(conte)}
                      className="text-left font-semibold text-[var(--foreground)] hover:text-[var(--accent-text)] transition cursor-pointer"
                    >
                      {conte.title}
                    </button>
                    {conte.isFeatured && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        À la une
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] italic">
                    {conte.titleFr}
                  </div>
                  {conte.author && (
                    <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                      Par {conte.author}
                    </div>
                  )}
                </td>

                {/* Audio Malagasy */}
                <td className="py-3 px-3">
                  {conte.audioUrlMg ? (
                    <div className="flex items-center gap-2">
                      <AudioPlayerInline
                        url={conte.audioUrlMg}
                        lang="MG"
                        label="Voix MG"
                        className="py-1 px-2"
                      />
                      <button
                        onClick={() => onGenerateAudio(conte.id, 'mg')}
                        disabled={isGenMg}
                        className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--foreground)] transition cursor-pointer"
                        title="Régénérer l'audio MG"
                      >
                        {isGenMg ? (
                          <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                        ) : (
                          <RotateCcw size={12} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onGenerateAudio(conte.id, 'mg')}
                      disabled={isGenMg}
                      className="px-2 py-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isGenMg ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                          <span>Synthèse TTS...</span>
                        </>
                      ) : (
                        <>
                          <Headphones size={12} className="text-emerald-600" />
                          <span>Générer Audio MG</span>
                        </>
                      )}
                    </button>
                  )}
                </td>

                {/* Audio Français */}
                <td className="py-3 px-3">
                  {conte.audioUrlFr ? (
                    <div className="flex items-center gap-2">
                      <AudioPlayerInline
                        url={conte.audioUrlFr}
                        lang="FR"
                        label="Voix FR"
                        className="py-1 px-2"
                      />
                      <button
                        onClick={() => onGenerateAudio(conte.id, 'fr')}
                        disabled={isGenFr}
                        className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--foreground)] transition cursor-pointer"
                        title="Régénérer l'audio FR"
                      >
                        {isGenFr ? (
                          <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                        ) : (
                          <RotateCcw size={12} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onGenerateAudio(conte.id, 'fr')}
                      disabled={isGenFr}
                      className="px-2 py-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isGenFr ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                          <span>Synthèse TTS...</span>
                        </>
                      ) : (
                        <>
                          <Headphones size={12} className="text-sky-600" />
                          <span>Générer Audio FR</span>
                        </>
                      )}
                    </button>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onSelect(conte)}
                      className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition cursor-pointer"
                      title="Lire les paragraphes et la morale"
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(conte)}
                      className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition cursor-pointer"
                      title="Modifier ce conte"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(conte.id)}
                      className="p-1 rounded text-[var(--text-subtle)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="Supprimer ce conte"
                    >
                      <Trash2 size={14} />
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
