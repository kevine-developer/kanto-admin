'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Field } from '@/components/ui';
import { ConteFormData } from '@/types/conte';
import { Plus, Trash2 } from 'lucide-react';
import { contesService } from '@/services/contes.service';

interface ConteModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  onSave: (data: ConteFormData, id?: string | null) => Promise<void>;
}

export function ConteModal({
  isOpen,
  onClose,
  editingId,
  onSave,
}: ConteModalProps) {
  const isEditing = !!editingId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ConteFormData>({
    title: '',
    titleFr: '',
    subtitle: '',
    author: 'Angano Malagasy',
    moralMg: '',
    moralFr: '',
    paragraphs: [{ textMg: '', textFr: '' }],
  });

  useEffect(() => {
    let isMounted = true;
    if (editingId) {
      contesService
        .getConteById(editingId)
        .then((full) => {
          if (!isMounted) return;
          const paragraphs =
            full.paragraphs && full.paragraphs.length > 0
              ? full.paragraphs.map((p) => ({ textMg: p.textMg, textFr: p.textFr }))
              : [{ textMg: '', textFr: '' }];

          setFormData({
            title: full.title,
            titleFr: full.titleFr,
            subtitle: full.subtitle || '',
            author: full.author || 'Angano Malagasy',
            moralMg: full.moralMg || '',
            moralFr: full.moralFr || '',
            paragraphs,
          });
        })
        .catch(() => {});
    } else {
      setFormData({
        title: '',
        titleFr: '',
        subtitle: '',
        author: 'Angano Malagasy',
        moralMg: '',
        moralFr: '',
        paragraphs: [{ textMg: '', textFr: '' }],
      });
    }

    return () => {
      isMounted = false;
    };
  }, [editingId]);

  const handleAddParagraph = () => {
    setFormData((prev) => ({
      ...prev,
      paragraphs: [...prev.paragraphs, { textMg: '', textFr: '' }],
    }));
  };

  const handleRemoveParagraph = (index: number) => {
    if (formData.paragraphs.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      paragraphs: prev.paragraphs.filter((_, idx) => idx !== index),
    }));
  };

  const handleParagraphChange = (
    index: number,
    field: 'textMg' | 'textFr',
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.paragraphs];
      updated[index][field] = value;
      return { ...prev, paragraphs: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.titleFr.trim()) {
      alert('Veuillez renseigner le titre en malgache et en français.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(formData, editingId);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(`Erreur : ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier le conte' : 'Nouveau conte malagasy'}
      subtitle="Saisissez les récits bilingues et la morale culturelle."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Titre en malgache" required>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Ibotity sy Trimobe"
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </Field>

          <Field label="Titre en français" required>
            <input
              type="text"
              required
              value={formData.titleFr}
              onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })}
              placeholder="Ex: Ibotity et le géant Trimobe"
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Sous-titre / Thème">
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Ex: Le courage des humbles"
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </Field>

          <Field label="Auteur / Origine">
            <input
              type="text"
              value={formData.author || ''}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Ex: Tradition Betsileo"
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </Field>
        </div>

        {/* Paragraphes du conte */}
        <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
              Paragraphes du récit ({formData.paragraphs.length})
            </label>
            <button
              type="button"
              onClick={handleAddParagraph}
              className="px-2 py-1 rounded bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--card-border)] text-[11px] font-medium text-[var(--foreground)] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>Ajouter paragraphe</span>
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {formData.paragraphs.map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] space-y-2 relative group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Paragraphe #{idx + 1}</span>
                  {formData.paragraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParagraph(idx)}
                      className="p-0.5 rounded text-[var(--text-subtle)] hover:text-red-600 transition cursor-pointer"
                      title="Supprimer ce paragraphe"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    value={p.textMg}
                    onChange={(e) => handleParagraphChange(idx, 'textMg', e.target.value)}
                    placeholder="Texte en malgache..."
                    className="w-full p-2 text-xs rounded bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  />
                  <textarea
                    rows={2}
                    value={p.textFr}
                    onChange={(e) => handleParagraphChange(idx, 'textFr', e.target.value)}
                    placeholder="Traduction en français..."
                    className="w-full p-2 text-xs rounded bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Morale de l'histoire */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--card-border)]">
          <Field label="Morale (Malgache)">
            <textarea
              rows={2}
              value={formData.moralMg || ''}
              onChange={(e) => setFormData({ ...formData, moralMg: e.target.value })}
              placeholder="Hatraiza ny fahendrena..."
              className="w-full p-2 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />
          </Field>

          <Field label="Morale (Français)">
            <textarea
              rows={2}
              value={formData.moralFr || ''}
              onChange={(e) => setFormData({ ...formData, moralFr: e.target.value })}
              placeholder="Enseignement moral du conte..."
              className="w-full p-2 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] resize-none"
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--card-hover)] transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le conte'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
