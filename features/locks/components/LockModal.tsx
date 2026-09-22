'use client';

import React, { useState } from 'react';
import { Modal, Field, ImageUploadDropzone } from '@/components/ui';
import { PRESET_LOCK_REASONS } from '@/constants/presets';
import { ModuleLockItem, CreateModuleDto, UpdateModuleDto } from '@/types/lock';
import { Gamepad2, BookOpen } from 'lucide-react';
import { slugify } from '@/lib/utils/media';

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingModule: ModuleLockItem | null;
  onSave: (data: CreateModuleDto | UpdateModuleDto, isEditing: boolean) => Promise<void>;
}

export function LockModal({
  isOpen,
  onClose,
  editingModule,
  onSave,
}: LockModalProps) {
  const isEditing = !!editingModule;
  const [formType, setFormType] = useState<'GAME' | 'CATEGORY'>(
    editingModule?.type === 'CATEGORY' ? 'CATEGORY' : 'GAME'
  );
  const [formNameFr, setFormNameFr] = useState(editingModule?.nameFr || '');
  const [formNameMg, setFormNameMg] = useState(editingModule?.nameMg || '');
  const [formKey, setFormKey] = useState(editingModule?.key || 'game:');
  const [formImageUrl, setFormImageUrl] = useState(editingModule?.imageUrl || '');
  const [formIsLocked, setFormIsLocked] = useState(editingModule?.isLocked || false);
  const [formLockReason, setFormLockReason] = useState(editingModule?.lockReason || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleNameFrChange = (value: string) => {
    setFormNameFr(value);
    if (!isEditing) {
      const slug = slugify(value).replace(/-/g, '');
      const prefix = formType === 'GAME' ? 'game:' : 'category:';
      setFormKey(prefix + slug);
    }
  };

  const handleTypeChange = (newType: 'GAME' | 'CATEGORY') => {
    setFormType(newType);
    if (!isEditing) {
      const slug = slugify(formNameFr).replace(/-/g, '');
      const prefix = newType === 'GAME' ? 'game:' : 'category:';
      setFormKey(prefix + slug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameFr.trim() || !formNameMg.trim() || !formKey.trim()) {
      alert('Veuillez renseigner les noms français, malgache et la clé.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await onSave(
          {
            nameFr: formNameFr.trim(),
            nameMg: formNameMg.trim(),
            type: formType,
            imageUrl: formImageUrl.trim() || null,
            isLocked: formIsLocked,
            lockReason: formLockReason.trim() || null,
          },
          true
        );
      } else {
        await onSave(
          {
            key: formKey.trim(),
            type: formType,
            nameFr: formNameFr.trim(),
            nameMg: formNameMg.trim(),
            imageUrl: formImageUrl.trim() || null,
            isLocked: formIsLocked,
            lockReason: formLockReason.trim() || null,
          },
          false
        );
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      alert(`Erreur : ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Modifier : ${formNameFr || editingModule?.key}` : 'Nouveau Jeu ou Catégorie'}
      subtitle="Renseignez les informations et l'illustration du module."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Type de module */}
        <div>
          <label className="block text-[10.5px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">
            Type de module :
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('GAME')}
              className={`py-1.5 px-3 rounded-md border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition ${
                formType === 'GAME'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Jeu Malagasy</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('CATEGORY')}
              className={`py-1.5 px-3 rounded-md border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition ${
                formType === 'CATEGORY'
                  ? 'border-sky-500 bg-sky-50/50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                  : 'border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catégorie Culturelle</span>
            </button>
          </div>
        </div>

        {/* Noms */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Nom en français" required>
            <input
              type="text"
              required
              value={formNameFr}
              onChange={(e) => handleNameFrChange(e.target.value)}
              placeholder="Ex: Devinettes"
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </Field>

          <Field label="Nom en malgache" required>
            <input
              type="text"
              required
              value={formNameMg}
              onChange={(e) => setFormNameMg(e.target.value)}
              placeholder="Ex: Ankamantatra"
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </Field>
        </div>

        {/* Clé unique */}
        <Field
          label="Clé d'identification unique"
          required
          hint={isEditing ? 'Non modifiable' : 'Préfixe automatique'}
        >
          <input
            type="text"
            required
            disabled={isEditing}
            value={formKey}
            onChange={(e) => setFormKey(e.target.value)}
            className={`w-full px-2.5 py-1.5 text-xs rounded-md font-mono border ${
              isEditing
                ? 'bg-[var(--card-hover)] text-[var(--text-muted)] border-[var(--card-border)] cursor-not-allowed'
                : 'bg-[var(--input-bg)] text-[var(--foreground)] border-[var(--input-border)] focus:outline-none focus:border-[var(--accent)]'
            }`}
          />
        </Field>

        {/* Image / Illustration */}
        <div>
          <label className="block text-[10.5px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">
            Illustration du module :
          </label>
          <ImageUploadDropzone
            value={formImageUrl}
            onChange={setFormImageUrl}
            subfolder="modules"
          />
        </div>

        {/* Verrouillage initial */}
        <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formIsLocked}
              onChange={(e) => setFormIsLocked(e.target.checked)}
              className="rounded border-[var(--input-border)] text-[var(--accent)] focus:ring-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-xs font-semibold text-[var(--foreground)]">
              Verrouiller l&apos;accès dans l&apos;application
            </span>
          </label>

          {formIsLocked && (
            <Field label="Motif d'indisponibilité (affiché aux utilisateurs)">
              <input
                type="text"
                value={formLockReason}
                onChange={(e) => setFormLockReason(e.target.value)}
                placeholder="Ex: Bientôt disponible"
                className="w-full px-2.5 py-1.5 text-xs rounded-md bg-[var(--card)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
              />

              <div className="flex flex-wrap gap-1 mt-1.5">
                {PRESET_LOCK_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setFormLockReason(reason)}
                    className="px-2 py-0.5 rounded text-[10px] bg-[var(--card)] hover:bg-[var(--card-hover)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>

        {/* Boutons d'action */}
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
            disabled={isSaving}
            className="px-4 py-1.5 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le module'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
