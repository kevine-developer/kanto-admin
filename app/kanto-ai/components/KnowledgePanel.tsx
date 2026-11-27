'use client';

import React, { useState } from 'react';
import {
  AiKnowledgeDocument,
  AiKnowledgeStatus,
  AiKnowledgeVisibility,
  kantoAiService,
} from '@/services/kanto-ai.service';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  CheckCircle2,
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';

interface Props {
  documents: AiKnowledgeDocument[];
  onRefresh: () => Promise<void>;
}

const CATEGORIES = ['IDENTITY', 'PRODUCT', 'BETA', 'EDITORIAL', 'CHANGELOG', 'PRICING', 'FAQ'];

export function KnowledgePanel({ documents, onRefresh }: Props) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('EDITORIAL');
  const [version, setVersion] = useState('1.0');
  const [source, setSource] = useState('Équipe Kanto MG');
  const [validationStatus, setValidationStatus] = useState<AiKnowledgeStatus>('VALIDATED');
  const [visibilityScope, setVisibilityScope] =
    useState<AiKnowledgeVisibility>('INTERNAL_TEAM');
  const [content, setContent] = useState('');

  function openCreate() {
    setEditingId(null);
    setTitle('');
    setCategory('EDITORIAL');
    setVersion('1.0');
    setSource('Équipe Kanto MG');
    setValidationStatus('VALIDATED');
    setVisibilityScope('INTERNAL_TEAM');
    setContent('');
    setIsFormOpen(true);
  }

  function openEdit(doc: AiKnowledgeDocument) {
    setEditingId(doc.id);
    setTitle(doc.title);
    setCategory(doc.category);
    setVersion(doc.version);
    setSource(doc.source);
    setValidationStatus(doc.validationStatus);
    setVisibilityScope(doc.visibilityScope);
    setContent(doc.content);
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || content.trim().length < 20) {
      toast.error('Veuillez renseigner un titre et un contenu (20 caractères min.).');
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        await kantoAiService.updateKnowledge(editingId, {
          title,
          category,
          version,
          source,
          validationStatus,
          visibilityScope,
          content,
        });
        toast.success('Document mis à jour et réindexé.');
      } else {
        await kantoAiService.createKnowledge({
          title,
          category,
          version,
          source,
          validationStatus,
          visibilityScope,
          content,
        });
        toast.success('Document créé et indexé dans la Knowledge Base.');
      }
      setIsFormOpen(false);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur d’enregistrement.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReindex(id: string) {
    try {
      const res = await kantoAiService.reindexKnowledge(id);
      toast.success(`Réindexation terminée (${res.chunksIndexed} fragments).`);
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec réindexation.');
    }
  }

  async function handleDelete(doc: AiKnowledgeDocument) {
    if (!window.confirm(`Supprimer le document « ${doc.title} » de la base RAG ?`)) {
      return;
    }
    try {
      await kantoAiService.deleteKnowledge(doc.id);
      toast.success('Document supprimé.');
      await onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Suppression impossible.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Base documentaire RAG ({documents.length})
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Seuls les documents au statut VALIDATED sont injectés dans le contexte de Kanto AI.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
          Nouveau document RAG
        </Button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-4 space-y-3"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-border)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {editingId ? 'Modifier le document' : 'Ajouter un document de référence'}
            </span>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 rounded hover:opacity-80 cursor-pointer"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Titre</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2 text-xs"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
                placeholder="Ex : Charte éditoriale Kanto MG"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-xs"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Version</label>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-xs"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Source interne</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-xs"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Statut de validation</label>
              <select
                value={validationStatus}
                onChange={(e) => setValidationStatus(e.target.value as AiKnowledgeStatus)}
                className="w-full rounded-lg px-3 py-2 text-xs"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
              >
                <option value="DRAFT">DRAFT (Brouillon — non indexé IA)</option>
                <option value="VALIDATED">VALIDATED (Actif pour Kanto AI)</option>
                <option value="ARCHIVED">ARCHIVED (Archivé)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Visibilité</label>
              <select
                value={visibilityScope}
                onChange={(e) =>
                  setVisibilityScope(e.target.value as AiKnowledgeVisibility)
                }
                className="w-full rounded-lg px-3 py-2 text-xs"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                }}
              >
                <option value="INTERNAL_TEAM">Équipe interne</option>
                <option value="ADMIN_ONLY">Administrateurs uniquement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Contenu Markdown / Structuré
            </label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-xs font-mono leading-relaxed"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--input-text)',
              }}
              placeholder="## Section&#10;Rédigez les informations vérifiées..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" isLoading={isSaving}>
              Enregistrer et indexer
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {documents.map((doc) => (
          <article
            key={doc.id}
            className="rounded-xl p-4 flex flex-col justify-between gap-3"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-border)',
            }}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen size={15} style={{ color: 'var(--accent)' }} className="shrink-0" />
                  <h3 className="text-sm font-semibold truncate">{doc.title}</h3>
                </div>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0"
                  style={{
                    background:
                      doc.validationStatus === 'VALIDATED'
                        ? 'var(--accent-light)'
                        : 'var(--input-bg)',
                    color:
                      doc.validationStatus === 'VALIDATED'
                        ? 'var(--accent-text)'
                        : 'var(--text-muted)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  {doc.validationStatus}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span>Catégorie : {doc.category}</span>
                <span>•</span>
                <span>v{doc.version}</span>
                <span>•</span>
                <span>{doc._count?.chunks ?? 0} fragment(s)</span>
                <span>•</span>
                <span>{doc.source}</span>
              </div>

              <p
                className="text-xs mt-2 line-clamp-3 leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                {doc.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                <CheckCircle2 size={12} />
                {doc.lastIndexedAt
                  ? `Indexé le ${new Date(doc.lastIndexedAt).toLocaleDateString('fr-FR')}`
                  : 'Non indexé'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openEdit(doc)}
                  className="p-1.5 rounded-lg border text-xs hover:opacity-80 cursor-pointer"
                  style={{ borderColor: 'var(--card-border)' }}
                  title="Modifier"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleReindex(doc.id)}
                  className="p-1.5 rounded-lg border text-xs hover:opacity-80 cursor-pointer"
                  style={{ borderColor: 'var(--card-border)' }}
                  title="Réindexer les fragments"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(doc)}
                  className="p-1.5 rounded-lg border text-xs text-red-500 hover:opacity-80 cursor-pointer"
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
    </div>
  );
}
