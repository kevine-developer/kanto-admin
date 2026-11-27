'use client';

import React from 'react';
import {
  AiDeliverable,
  AiDraftStatus,
  AiMarketingDraft,
  AiUsageSummary,
  kantoAiService,
} from '@/services/kanto-ai.service';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { BarChart3, Copy, FileEdit, Trash2 } from 'lucide-react';

interface Props {
  drafts: AiMarketingDraft[];
  usage: AiUsageSummary | null;
  onRefresh: () => Promise<void>;
  onOpenInEditor: (deliverable: AiDeliverable, draftId: string) => void;
}

export function DraftsAndUsagePanel({
  drafts,
  usage,
  onRefresh,
  onOpenInEditor,
}: Props) {
  const { toast } = useToast();

  async function handleStatusChange(id: string, status: AiDraftStatus) {
    try {
      await kantoAiService.updateDraft(id, { status });
      toast.success('Statut du brouillon mis à jour.');
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de mise à jour.');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer définitivement ce brouillon marketing ?')) return;
    try {
      await kantoAiService.deleteDraft(id);
      toast.success('Brouillon supprimé.');
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur suppression.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Bloc consommation & coûts IA réels */}
      <section
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm font-semibold">
              Consommation, Tokens & Coûts IA (30 derniers jours)
            </h2>
          </div>
          {usage && (
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Fournisseur : {usage.provider} • Modèle : {usage.defaultModel} •{' '}
              {usage.isConfigured ? 'Clé active' : 'Clé manquante'}
            </span>
          )}
        </div>

        {usage ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg p-3" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Requêtes aujourd&apos;hui
              </div>
              <div className="text-lg font-bold mt-1">
                {usage.quota.dailyUsed} / {usage.quota.dailyLimit}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Appels enregistrés (30j)
              </div>
              <div className="text-lg font-bold mt-1">{usage.totals.requests}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Tokens (entrée / sortie)
              </div>
              <div className="text-sm font-bold mt-1.5 font-mono">
                {usage.totals.inputTokens.toLocaleString('fr-FR')} /{' '}
                {usage.totals.outputTokens.toLocaleString('fr-FR')}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Coût estimé / Budget
              </div>
              <div className="text-lg font-bold mt-1 font-mono">
                {usage.totals.estimatedCostUsd.toFixed(4)} $ / {usage.quota.monthlyBudgetUsd} $
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Chargement des statistiques de consommation...
          </p>
        )}
      </section>

      {/* Liste des brouillons enregistrés */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Brouillons éditoriaux enregistrés ({drafts.length})
          </h2>
        </div>

        {drafts.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center text-xs"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text-muted)' }}
          >
            Aucun brouillon sauvegardé pour l&apos;instant. Générez un contenu dans Kanto AI Studio puis cliquez sur « Sauvegarder en brouillon ».
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {drafts.map((draft) => (
              <article
                key={draft.id}
                className="rounded-xl p-4 flex flex-col justify-between gap-3"
                style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                      {draft.platform} • {draft.language}
                    </span>
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        void handleStatusChange(draft.id, e.target.value as AiDraftStatus)
                      }
                      className="rounded px-2 py-1 text-[11px]"
                      style={{
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--input-text)',
                      }}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="READY">READY</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                  <h3 className="text-sm font-semibold mt-1">{draft.title}</h3>
                  <p className="text-xs mt-1.5 whitespace-pre-wrap line-clamp-4" style={{ color: 'var(--text-muted)' }}>
                    {draft.body}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
                  <span className="text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                    Màj {new Date(draft.updatedAt).toLocaleString('fr-FR')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<FileEdit size={13} />}
                      onClick={() =>
                        onOpenInEditor(
                          {
                            title: draft.title,
                            platform: draft.platform,
                            language: draft.language,
                            tone: draft.tone || 'EDITORIAL',
                            body: draft.body,
                            hashtags: draft.hashtags || [],
                            cta: draft.cta || '',
                            visualConcept: draft.visualConcept || '',
                            visualAspectRatio: draft.visualAspectRatio || '4:5',
                            imagePrompt: draft.imagePrompt || '',
                          },
                          draft.id,
                        )
                      }
                    >
                      Éditer
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(draft.body);
                        toast.success('Texte copié.');
                      }}
                      className="p-1.5 rounded-lg border cursor-pointer"
                      style={{ borderColor: 'var(--card-border)' }}
                      title="Copier le texte"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(draft.id)}
                      className="p-1.5 rounded-lg border text-red-500 cursor-pointer"
                      style={{ borderColor: 'var(--card-border)' }}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
