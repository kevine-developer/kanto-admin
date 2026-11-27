'use client';

import React, { useState } from 'react';
import {
  AiFeatureItem,
  AiFeatureStatus,
  kantoAiService,
} from '@/services/kanto-ai.service';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Layers, ShieldCheck } from 'lucide-react';

interface Props {
  features: AiFeatureItem[];
  onRefresh: () => Promise<void>;
}

const STATUS_OPTIONS: Array<{ value: AiFeatureStatus; label: string }> = [
  { value: 'AVAILABLE', label: 'Disponible (Production)' },
  { value: 'BETA', label: 'Bêta / Partiel' },
  { value: 'IN_DEVELOPMENT', label: 'En développement (interdit en promo)' },
  { value: 'PLANNED', label: 'Planifié (interdit en promo)' },
  { value: 'DEPRECATED', label: 'Déprécié (interdit en promo)' },
];

export function FeatureRegistryPanel({ features, onRefresh }: Props) {
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  async function handleStatusChange(item: AiFeatureItem, status: AiFeatureStatus) {
    try {
      setSavingId(item.id);
      await kantoAiService.updateFeature(item.id, { status });
      toast.success(`Statut de « ${item.nameFr} » mis à jour (${status}).`);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de mise à jour.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleSaveNotes(item: AiFeatureItem) {
    const nextNotes = notesDraft[item.id] ?? item.notes ?? '';
    try {
      setSavingId(item.id);
      await kantoAiService.updateFeature(item.id, { notes: nextNotes });
      toast.success('Consigne produit enregistrée.');
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de mise à jour.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-3.5 flex items-start gap-3" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <ShieldCheck size={17} style={{ color: 'var(--accent)' }} className="shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Ce registre est injecté comme <strong>vérité produit stricte</strong> dans le prompt système de Kanto AI. Toute fonctionnalité marquée{' '}
          <code>IN_DEVELOPMENT</code>, <code>PLANNED</code> ou <code>DEPRECATED</code> ne sera jamais promue comme disponible dans les contenus générés.
        </p>
      </div>

      <div className="space-y-2.5">
        {features.map((feat) => (
          <div
            key={feat.id}
            className="rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-border)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Layers size={14} style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-semibold">{feat.nameFr}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ({feat.nameMg})
                </span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
                >
                  {feat.platforms.join(' • ')}
                </span>
              </div>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {feat.description}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input
                  value={notesDraft[feat.id] ?? feat.notes ?? ''}
                  onChange={(e) =>
                    setNotesDraft((prev) => ({ ...prev, [feat.id]: e.target.value }))
                  }
                  placeholder="Consigne éditoriale ou restriction spécifique pour l'IA..."
                  className="flex-1 min-w-[220px] rounded-lg px-2.5 py-1.5 text-xs"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--input-text)',
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={savingId === feat.id}
                  onClick={() => void handleSaveNotes(feat)}
                >
                  Sauver consigne
                </Button>
              </div>
            </div>

            <div className="shrink-0">
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Statut réel
              </label>
              <select
                value={feat.status}
                disabled={savingId === feat.id}
                onChange={(e) =>
                  void handleStatusChange(feat, e.target.value as AiFeatureStatus)
                }
                className="rounded-lg px-3 py-2 text-xs font-medium"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
