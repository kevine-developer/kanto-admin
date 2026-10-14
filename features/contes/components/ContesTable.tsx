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
  onGenerateAudio: (id: string, lang: 'mg' | 'fr' | 'all', voiceId?: string) => void;
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
          <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)] text-[11px] font-semibold text-[var(--text-muted)]">
            <th className="py-2.5 px-3.5">Titre &amp; Récit</th>
            <th className="py-2.5 px-3.5 w-64">Audio Malagasy (MG)</th>
            <th className="py-2.5 px-3.5 w-64">Audio Français (FR)</th>
            <th className="py-2.5 px-3.5 w-24 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-border)]">
          {contes.map((conte) => {
            const isGenMg = generatingId === conte.id && generatingLang === 'mg';
            const isGenFr = generatingId === conte.id && generatingLang === 'fr';

            return (
              <tr
                key={conte.id}
                className="hover:bg-[var(--card-hover)] transition-colors"
              >
                <td className="py-3 px-3.5 align-top">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onSelect(conte)}
                      className="text-left font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition cursor-pointer"
                    >
                      {conte.title}
                    </button>
                    {conte.isFeatured && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        À la une
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] italic mt-0.5">
                    {conte.titleFr}
                  </div>
                  {conte.author && (
                    <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                      Par {conte.author}
                    </div>
                  )}
                </td>

                {/* Audio Malagasy */}
                <td className="py-3 px-3.5 align-top">
                  {conte.audioUrlMg ? (
                    <div className="flex items-center gap-1.5">
                      <AudioPlayerInline
                        url={conte.audioUrlMg}
                        lang="MG"
                        label="Voix MG"
                        className="py-1 px-2"
                      />
                      <button
                        onClick={() => onGenerateAudio(conte.id, 'mg', 'Charon')}
                        disabled={isGenMg}
                        className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                        title="Régénérer avec la voix Sage Malagasy (Charon - sans accent)"
                      >
                        {isGenMg ? (
                          <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                        ) : (
                          <RotateCcw size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => onGenerateAudio(conte.id, 'mg', 'Aoede')}
                        disabled={isGenMg}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                        title="Régénérer avec la voix Conteuse Renibe (Aoede - sans accent)"
                      >
                        Voix ♀
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onGenerateAudio(conte.id, 'mg', 'Charon')}
                        disabled={isGenMg}
                        className="px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                        title="Générer avec la voix de Sage Malagasy (Charon)"
                      >
                        {isGenMg ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                            <span>Synthèse TTS...</span>
                          </>
                        ) : (
                          <>
                            <Headphones size={12} className="text-emerald-500" />
                            <span>Générer Sage (♂)</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => onGenerateAudio(conte.id, 'mg', 'Aoede')}
                        disabled={isGenMg}
                        className="px-2 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] text-[10.5px] font-medium transition cursor-pointer"
                        title="Générer avec la voix de Conteuse / Renibe (Aoede)"
                      >
                        Voix ♀
                      </button>
                    </div>
                  )}
                </td>

                {/* Audio Français */}
                <td className="py-3 px-3.5 align-top">
                  {conte.audioUrlFr ? (
                    <div className="flex items-center gap-1.5">
                      <AudioPlayerInline
                        url={conte.audioUrlFr}
                        lang="FR"
                        label="Voix FR"
                        className="py-1 px-2"
                      />
                      <button
                        onClick={() => onGenerateAudio(conte.id, 'fr')}
                        disabled={isGenFr}
                        className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
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
                      className="px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      {isGenFr ? (
                        <>
                          <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                          <span>Synthèse TTS...</span>
                        </>
                      ) : (
                        <>
                          <Headphones size={12} className="text-sky-500" />
                          <span>Générer Audio FR</span>
                        </>
                      )}
                    </button>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-3.5 text-right align-top">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onSelect(conte)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--input-bg)] transition cursor-pointer"
                      title="Lire les paragraphes et la morale"
                    >
                      <FileText size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(conte)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--input-bg)] transition cursor-pointer"
                      title="Modifier ce conte"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(conte.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
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
