'use client';

import {
  CheckCircle2,
  Info,
  Palette,
  Shield,
  Plus,
  Trash2,
} from 'lucide-react';
import { Modal, Field, Input, ImageUploadDropzone } from '@/components/ui';
import type { ProvinceSymbol, ContentStatus, HistoryItem } from '@/types/history';
import type { GenericHistoryFormData } from '../types/forms';
import type { TabKey } from '../types/tabs';
import { PRESET_COLORS, TAB_SUBFOLDER_MAP } from '../constants';

interface HistoireModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabKey;
  editingItem: HistoryItem | null;
  formValues: GenericHistoryFormData;
  setFormValues: React.Dispatch<React.SetStateAction<GenericHistoryFormData>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  addSymbol: () => void;
  updateSymbol: (index: number, field: keyof ProvinceSymbol, value: string) => void;
  removeSymbol: (index: number) => void;
  applyColorPreset: (preset: { hex: string; bg: string; border: string }) => void;
}

export function HistoireModal({
  isOpen,
  onClose,
  activeTab,
  editingItem,
  formValues,
  setFormValues,
  isSubmitting,
  onSubmit,
  addSymbol,
  updateSymbol,
  removeSymbol,
  applyColorPreset,
}: HistoireModalProps) {
  const getModalTitle = () => {
    if (editingItem) {
      const name =
        formValues.name ||
        formValues.province ||
        formValues.titleFr ||
        formValues.government ||
        'Élément';
      return `Modifier : ${name}`;
    }

    switch (activeTab) {
      case 'presidents':
        return 'Nouveau : Président de la République';
      case 'emblems':
        return 'Nouveau : Emblème & Sceau d’État';
      case 'provinces':
        return 'Nouveau : Blason de Province';
      case 'banknotes':
        return 'Nouveau : Billet Malgache';
      case 'nature':
        return 'Nouveau : Espèce Naturelle';
      case 'dates':
        return 'Nouveau : Date Historique';
      case 'lessons':
        return 'Nouveau : Rubrique Thématique';
      default:
        return 'Nouvel élément';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()} maxWidth="2xl">
      <form onSubmit={onSubmit} className="space-y-4 max-h-[78vh] overflow-y-auto px-1">
        {/* Zone Dropzone / Illustration */}
        {activeTab === 'banknotes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800">
            <Field label="Face Recto (Avant du billet)" required>
              <ImageUploadDropzone
                value={formValues.imageUrl}
                onChange={(url) => setFormValues((prev) => ({ ...prev, imageUrl: url }))}
                uploadEndpoint="/admin/history/upload-image"
                subfolder="banknotes"
              />
            </Field>
            <Field label="Face Verso (Arrière du billet)">
              <ImageUploadDropzone
                value={formValues.imageUrlVerso}
                onChange={(url) => setFormValues((prev) => ({ ...prev, imageUrlVerso: url }))}
                uploadEndpoint="/admin/history/upload-image"
                subfolder="banknotes"
              />
            </Field>
          </div>
        ) : (
          <Field label="Illustration / Photo / Sceau officiel">
            <ImageUploadDropzone
              value={formValues.imageUrl}
              onChange={(url) => setFormValues((prev) => ({ ...prev, imageUrl: url }))}
              uploadEndpoint="/admin/history/upload-image"
              subfolder={TAB_SUBFOLDER_MAP[activeTab] || 'history'}
            />
          </Field>
        )}

        {/* Statut & Ordre d'affichage communs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800">
          <Field label="Ordre d'affichage (index)">
            <Input
              type="number"
              value={formValues.orderIndex ?? 0}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, orderIndex: Number(e.target.value) }))
              }
            />
          </Field>
          <Field label="Statut de publication">
            <select
              className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
              value={formValues.status || 'PUBLISHED'}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, status: e.target.value as ContentStatus }))
              }
            >
              <option value="PUBLISHED">Publié (Visible dans l&apos;application)</option>
              <option value="DRAFT">Brouillon (Non visible)</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
          </Field>
        </div>

        {/* 1. FORMULAIRE PRÉSIDENTS */}
        {activeTab === 'presidents' && (
          <>
            {!editingItem && (
              <Field label="Identifiant unique (slug, ex: tsiranana)" required>
                <Input
                  value={formValues.id || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="tsiranana, ramanantsoa, ratsiraka..."
                  required
                />
              </Field>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nom complet du Président" required>
                <Input
                  value={formValues.name || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Philibert Tsiranana"
                  required
                />
              </Field>
              <Field label="Mandat / Période (ex: 1959 - 1972)" required>
                <Input
                  value={formValues.period || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, period: e.target.value }))}
                  placeholder="1959 - 1972"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="République (FR)" required>
                <Input
                  value={formValues.republic || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, republic: e.target.value }))}
                  placeholder="1ère République"
                  required
                />
              </Field>
              <Field label="République (MG)" required>
                <Input
                  value={formValues.republicMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, republicMg: e.target.value }))
                  }
                  placeholder="Repoblika Voalohany"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Titre honorifique (FR)" required>
                <Input
                  value={formValues.titleFr || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                  placeholder="Père de l'Indépendance"
                  required
                />
              </Field>
              <Field label="Titre honorifique (MG)" required>
                <Input
                  value={formValues.titleMg || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                  placeholder="Rain'ny Fahaleovantena"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <Field label="Couleur Badge">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formValues.badgeColor || '#2A6B3D'}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, badgeColor: e.target.value }))
                      }
                      className="w-10 h-10 rounded-lg cursor-pointer border border-stone-200 dark:border-stone-700"
                    />
                    <Input
                      value={formValues.badgeColor || '#2A6B3D'}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, badgeColor: e.target.value }))
                      }
                      className="font-mono text-xs"
                    />
                  </div>
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Citation célèbre (FR)">
                  <Input
                    value={formValues.quoteFr || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, quoteFr: e.target.value }))}
                    placeholder="« La paix est le premier capital d'une nation. »"
                  />
                </Field>
              </div>
            </div>

            <Field label="Citation célèbre (MG)">
              <Input
                value={formValues.quoteMg || ''}
                onChange={(e) => setFormValues((prev) => ({ ...prev, quoteMg: e.target.value }))}
                placeholder="« Ny fandriampahalemana no fototry ny fampandrosoana. »"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Biographie détaillée (FR)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  value={formValues.bioFr || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, bioFr: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Biographie détaillée (MG)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  value={formValues.bioMg || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, bioMg: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Grandes Réalisations (FR - 1 ligne par réalisation)">
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  rows={3}
                  value={formValues.achievementsFrRaw ?? ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, achievementsFrRaw: e.target.value }))
                  }
                  placeholder="Proclamation de l'Indépendance (26 Juin 1960)&#10;Création des universités provinciales"
                />
              </Field>
              <Field label="Grandes Réalisations (MG - 1 ligne par réalisation)">
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  rows={3}
                  value={formValues.achievementsMgRaw ?? ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, achievementsMgRaw: e.target.value }))
                  }
                  placeholder="Fanambarana ny Fahaleovantena (26 Jona 1960)&#10;Fananganana oniversite sy sekoly"
                />
              </Field>
            </div>
          </>
        )}

        {/* 2. FORMULAIRE EMBLÈMES & SCEAUX D'ÉTAT */}
        {activeTab === 'emblems' && (
          <>
            {!editingItem && (
              <Field label="Identifiant (optionnel, slug)">
                <Input
                  value={formValues.id || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="embleme-quatrieme-republique"
                />
              </Field>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Période historique (ex: 2010 - Présent)" required>
                <Input
                  value={formValues.period || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, period: e.target.value }))}
                  placeholder="1960 - 1972 ou 2010 - Présent"
                  required
                />
              </Field>
              <Field label="Gouvernement / Régime" required>
                <Input
                  value={formValues.government || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, government: e.target.value }))
                  }
                  placeholder="Quatrième République de Madagascar"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Description du sceau (FR)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  value={formValues.descriptionFr || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, descriptionFr: e.target.value }))
                  }
                  placeholder="Sceau officiel : disque d'argent avec le Ravinala au centre..."
                  required
                />
              </Field>
              <Field label="Description du sceau (MG)">
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  value={formValues.descriptionMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, descriptionMg: e.target.value }))
                  }
                  placeholder="Tombo-kase ofisialy : diska volafotsy ahitana ny Ravinala..."
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Notes historiques & Contexte (FR)">
                <Input
                  value={formValues.notesFr || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, notesFr: e.target.value }))}
                  placeholder="Adopté lors de la Constitution de 2010"
                />
              </Field>
              <Field label="Notes historiques & Contexte (MG)">
                <Input
                  value={formValues.notesMg || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, notesMg: e.target.value }))}
                  placeholder="Nolaniana tamin'ny Lalàmpanorenana 2010"
                />
              </Field>
            </div>
          </>
        )}

        {/* 3. FORMULAIRE 6 PROVINCES & BLASONS */}
        {activeTab === 'provinces' && (
          <>
            {!editingItem && (
              <Field label="Identifiant unique (slug, ex: province-antananarivo)" required>
                <Input
                  value={formValues.id || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="province-antananarivo"
                  required
                />
              </Field>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nom de la Province" required>
                <Input
                  value={formValues.province || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, province: e.target.value }))}
                  placeholder="Antananarivo, Fianarantsoa..."
                  required
                />
              </Field>
              <Field label="Chef-lieu de Province" required>
                <Input
                  value={formValues.chefLieu || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, chefLieu: e.target.value }))}
                  placeholder="Antananarivo-Renivohitra"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Titre honorifique (FR)" required>
                <Input
                  value={formValues.titleFr || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                  placeholder="Le Cœur de l'Imerina"
                  required
                />
              </Field>
              <Field label="Titre honorifique (MG)" required>
                <Input
                  value={formValues.titleMg || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                  placeholder="Imerina Enin-toko"
                  required
                />
              </Field>
            </div>

            {/* Couleurs héraldiques et palettes */}
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette size={14} className="text-emerald-600" />
                  <span>Palette héraldique de la Province</span>
                </span>
                <span className="text-[11px] text-stone-500">Harmonie visuelle</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyColorPreset(p)}
                    className="px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 border transition-transform hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: p.bg, borderColor: p.border, color: p.hex }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <Field label="Couleur principale (Hex)" required>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formValues.color || '#2B6CB0'}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="w-10 h-10 rounded-lg cursor-pointer border"
                    />
                    <Input
                      value={formValues.color || '#2B6CB0'}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, color: e.target.value }))
                      }
                      required
                      className="font-mono text-xs"
                    />
                  </div>
                </Field>
                <Field label="Fond pastel clair" required>
                  <Input
                    value={formValues.bgLight || '#EBF8FF'}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, bgLight: e.target.value }))
                    }
                    required
                    className="font-mono text-xs"
                  />
                </Field>
                <Field label="Bordure claire" required>
                  <Input
                    value={formValues.borderLight || '#BEE3F8'}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, borderLight: e.target.value }))
                    }
                    required
                    className="font-mono text-xs"
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Description historique & culturelle (FR)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  value={formValues.descriptionFr || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, descriptionFr: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Description historique & culturelle (MG)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  value={formValues.descriptionMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, descriptionMg: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>

            {/* Constructeur dynamique de symboles héraldiques */}
            <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} className="text-emerald-600" />
                  <span>Symboles armoriaux & éléments du blason</span>
                </span>
                <button
                  type="button"
                  onClick={addSymbol}
                  className="text-xs px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Ajouter un symbole</span>
                </button>
              </div>

              {(!formValues.symbols || formValues.symbols.length === 0) && (
                <p className="text-xs text-stone-400 italic">
                  Aucun symbole défini. Cliquez sur &quot;Ajouter un symbole&quot;.
                </p>
              )}

              {Array.isArray(formValues.symbols) &&
                formValues.symbols.map((sym: ProvinceSymbol, sIdx: number) => (
                  <div
                    key={sIdx}
                    className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-stone-800">
                      <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                        Symbole #{sIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSymbol(sIdx)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Supprimer ce symbole"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Élément / Symbole (FR, ex: Le Rova)"
                        value={sym.labelFr || ''}
                        onChange={(e) => updateSymbol(sIdx, 'labelFr', e.target.value)}
                      />
                      <Input
                        placeholder="Élément / Symbole (MG, ex: Lapan'i Manjakamiadana)"
                        value={sym.labelMg || ''}
                        onChange={(e) => updateSymbol(sIdx, 'labelMg', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Signification (FR, ex: Souveraineté nationale)"
                        value={sym.meaningFr || ''}
                        onChange={(e) => updateSymbol(sIdx, 'meaningFr', e.target.value)}
                      />
                      <Input
                        placeholder="Signification (MG, ex: Fiandrianam-pirenena)"
                        value={sym.meaningMg || ''}
                        onChange={(e) => updateSymbol(sIdx, 'meaningMg', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* Faits marquants bilingues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Faits marquants (FR - 1 ligne par fait)">
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  rows={3}
                  value={formValues.keyFactsFrRaw ?? ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, keyFactsFrRaw: e.target.value }))
                  }
                  placeholder="Altitude moyenne : 1 280 m&#10;Site patrimonial : Rova d'Ambohimanga"
                />
              </Field>
              <Field label="Faits marquants (MG - 1 ligne par fait)">
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  rows={3}
                  value={formValues.keyFactsMgRaw ?? ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, keyFactsMgRaw: e.target.value }))
                  }
                  placeholder="Haavo ambonin'ny ranomasina : 1 280 m&#10;Rovan'Ambohimanga lova maneran-tany"
                />
              </Field>
            </div>
          </>
        )}

        {/* 4. FORMULAIRE BILLETS MALGACHES */}
        {activeTab === 'banknotes' && (() => {
          const currentEra = (() => {
            const s = formValues.series || '';
            if (s === 'COLONIAL' || (formValues.id && formValues.id.includes('colonial')))
              return 'COLONIAL';
            if (s === 'SERIE_FMG') return 'SERIE_FMG';
            if (s === 'SERIE_2003') return 'SERIE_2003';
            return 'SERIE_2017';
          })();

          const handleSelectEra = (era: 'SERIE_2017' | 'SERIE_2003' | 'SERIE_FMG' | 'COLONIAL') => {
            setFormValues((prev) => {
              const updated = { ...prev, series: era };
              if (era === 'COLONIAL') {
                updated.seriesLabelFr = 'Période Coloniale — Franc Malgache (1925-1960)';
                updated.seriesLabelMg = 'Vanim-potoana Zanatany — Faranka Malagasy (1925-1960)';
                updated.period =
                  prev.period && !prev.period.includes('2017') ? prev.period : '1925 - 1960';
                updated.colorLight = '#6B4A1E';
                updated.colorDark = '#8C6330';
                if (prev.valueFmg) updated.valueAriary = Math.round(Number(prev.valueFmg) / 5);
              } else if (era === 'SERIE_FMG') {
                updated.seriesLabelFr = 'Franc Malgache — Républiques (1960-2003)';
                updated.seriesLabelMg = 'Faranka Malagasy — Repoblika (1960-2003)';
                updated.period =
                  prev.period && !prev.period.includes('2017') ? prev.period : '1960 - 2003';
                updated.colorLight = '#B58900';
                updated.colorDark = '#8C6B00';
                if (prev.valueFmg) updated.valueAriary = Math.round(Number(prev.valueFmg) / 5);
              } else if (era === 'SERIE_2003') {
                updated.seriesLabelFr = 'Série 2003 — Transition FMG vers Ariary';
                updated.seriesLabelMg = 'Andiany 2003 — Fiovana FMG ho Ariary';
                updated.period =
                  prev.period && !prev.period.includes('2017') ? prev.period : '2003 - 2017';
                updated.colorLight = '#70539B';
                updated.colorDark = '#513C70';
                if (prev.valueAriary) updated.valueFmg = Number(prev.valueAriary) * 5;
              } else {
                updated.seriesLabelFr = 'Série 2017 — Madagascar & ses Richesses';
                updated.seriesLabelMg = 'Andiany 2017 — Madagasikara sy ny Harenany';
                updated.period =
                  prev.period && prev.period.includes('19')
                    ? '2017 - Présent'
                    : prev.period || '2017 - Présent';
                updated.colorLight = '#2E7D32';
                updated.colorDark = '#1B5E20';
                if (prev.valueAriary) updated.valueFmg = Number(prev.valueAriary) * 5;
              }
              return updated;
            });
          };

          return (
            <>
              {!editingItem && (
                <Field
                  label="Identifiant unique (slug, ex: billet-20000, billet-colonial-1000f)"
                  required
                >
                  <Input
                    value={formValues.id || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                    placeholder="ex: billet-5000, billet-colonial-500f"
                    required
                  />
                </Field>
              )}

              {/* Sélecteur d'Ère Monétaire */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Régime & Époque Monétaire
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {(
                    [
                      {
                        key: 'SERIE_2017',
                        label: 'Série 2017',
                        subtitle: 'Ariary (MGA)',
                        badge: 'Moderne',
                      },
                      {
                        key: 'SERIE_2003',
                        label: 'Série 2003',
                        subtitle: 'Ariary & FMG',
                        badge: 'Transition',
                      },
                      {
                        key: 'SERIE_FMG',
                        label: 'Série FMG',
                        subtitle: 'Franc Malgache',
                        badge: '1960 - 2003',
                      },
                      {
                        key: 'COLONIAL',
                        label: 'Ère Coloniale',
                        subtitle: "Francs (Pas d'Ariary)",
                        badge: 'Avant 1960',
                      },
                    ] as const
                  ).map((era) => {
                    const isSelected = currentEra === era.key;
                    return (
                      <button
                        key={era.key}
                        type="button"
                        onClick={() => handleSelectEra(era.key)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-20 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30'
                            : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-stone-900 dark:text-white">
                            {era.label}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                            }`}
                          >
                            {era.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                          {era.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Encart Pédagogique Historique */}
              {currentEra === 'COLONIAL' ? (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <Info size={17} className="mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900 dark:text-amber-100">
                      Rappel historique capital : L&apos;Ariary (MGA) n&apos;existait pas encore
                    </p>
                    <p className="text-amber-800 dark:text-amber-200/90 leading-relaxed text-[11.5px]">
                      Avant l&apos;Indépendance de 1960, les billets étaient libellés en{' '}
                      <strong>Francs coloniaux</strong> (Banque de Madagascar ou Institut d&apos;Émission).
                      Saisissez la valeur faciale réelle en Francs. L&apos;équivalence Ariary (÷ 5) est
                      calculée automatiquement.
                    </p>
                  </div>
                </div>
              ) : currentEra === 'SERIE_FMG' ? (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                  <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <p className="text-[11.5px] leading-relaxed">
                    <strong>Époque Républicaine en FMG : </strong>
                    La monnaie officielle était le Franc Malgache (FMG). L&apos;Ariary était une unité
                    de compte traditionnelle (1 Ar = 5 FMG). Saisissez la valeur en FMG,
                    l&apos;équivalence Ariary est synchronisée automatiquement.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                  <Info size={16} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[11.5px] leading-relaxed">
                    <strong>Émission en Ariary (MGA) : </strong>
                    Saisissez la valeur officielle en Ariary. L&apos;équivalence en Francs Malgaches (× 5)
                    est calculée automatiquement pour mémoire numismatique.
                  </p>
                </div>
              )}

              {/* Champs de Saisie des Montants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-700/60">
                {currentEra === 'COLONIAL' ? (
                  <>
                    <Field
                      label="Valeur faciale en Francs coloniaux (ex: 500, 1000)"
                      required
                      hint="Montant exact imprimé sur le billet historique"
                    >
                      <Input
                        type="number"
                        value={formValues.valueFmg || ''}
                        onChange={(e) => {
                          const f = Number(e.target.value) || 0;
                          setFormValues((prev) => ({
                            ...prev,
                            valueFmg: f,
                            valueAriary: Math.round(f / 5),
                          }));
                        }}
                        placeholder="ex: 1000"
                        required
                      />
                    </Field>

                    <Field
                      label="Équivalence théorique Ariary (F ÷ 5)"
                      hint="Calcul automatique pour la compatibilité base de données"
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          value={formValues.valueAriary || ''}
                          onChange={(e) => {
                            const ar = Number(e.target.value) || 0;
                            setFormValues((prev) => ({
                              ...prev,
                              valueAriary: ar,
                            }));
                          }}
                          placeholder="ex: 200"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                          Non légal à l&apos;époque
                        </span>
                      </div>
                    </Field>
                  </>
                ) : currentEra === 'SERIE_FMG' ? (
                  <>
                    <Field
                      label="Valeur faciale en Francs Malgaches (FMG)"
                      required
                      hint="Montant officiel imprimé sur le billet (ex: 5000, 10000, 25000)"
                    >
                      <Input
                        type="number"
                        value={formValues.valueFmg || ''}
                        onChange={(e) => {
                          const f = Number(e.target.value) || 0;
                          setFormValues((prev) => ({
                            ...prev,
                            valueFmg: f,
                            valueAriary: Math.round(f / 5),
                          }));
                        }}
                        placeholder="ex: 10000"
                        required
                      />
                    </Field>

                    <Field
                      label="Équivalence traditionnelle en Ariary (FMG ÷ 5)"
                      hint="Calculé automatiquement : 1 Ariary = 5 FMG"
                    >
                      <Input
                        type="number"
                        value={formValues.valueAriary || ''}
                        onChange={(e) => {
                          const ar = Number(e.target.value) || 0;
                          setFormValues((prev) => ({
                            ...prev,
                            valueAriary: ar,
                            valueFmg: ar * 5,
                          }));
                        }}
                        placeholder="ex: 2000"
                      />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field
                      label="Valeur faciale en Ariary (MGA)"
                      required
                      hint="Montant officiel du billet (ex: 500, 1000, 2000, 5000, 10000, 20000)"
                    >
                      <Input
                        type="number"
                        value={formValues.valueAriary || ''}
                        onChange={(e) => {
                          const ar = Number(e.target.value) || 0;
                          setFormValues((prev) => ({
                            ...prev,
                            valueAriary: ar,
                            valueFmg: ar * 5,
                          }));
                        }}
                        placeholder="ex: 20000"
                        required
                      />
                    </Field>

                    <Field
                      label="Équivalence en FMG (Ariary × 5)"
                      hint="Calculé automatiquement pour repère historique"
                    >
                      <Input
                        type="number"
                        value={formValues.valueFmg || ''}
                        onChange={(e) => {
                          const f = Number(e.target.value) || 0;
                          setFormValues((prev) => ({
                            ...prev,
                            valueFmg: f,
                            valueAriary: Math.round(f / 5),
                          }));
                        }}
                        placeholder="ex: 100000"
                      />
                    </Field>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Titre (FR)" required>
                  <Input
                    value={formValues.titleFr || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                    placeholder="ex: Port de Toamasina & Valiha"
                    required
                  />
                </Field>
                <Field label="Titre (MG)" required>
                  <Input
                    value={formValues.titleMg || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                    placeholder="ex: Seranan'i Toamasina sy Valiha"
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Clé Série technique (ex: SERIE_2017, SERIE_FMG, COLONIAL)" required>
                  <Input
                    value={formValues.series || 'SERIE_2017'}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, series: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Période de circulation (ex: 2017 - Présent, 1925 - 1950)" required>
                  <Input
                    value={formValues.period || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, period: e.target.value }))}
                    placeholder="ex: 2017 - Présent"
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Libellé Série affiché (FR)" required>
                  <Input
                    value={formValues.seriesLabelFr || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, seriesLabelFr: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Libellé Série affiché (MG)" required>
                  <Input
                    value={formValues.seriesLabelMg || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, seriesLabelMg: e.target.value }))
                    }
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Couleur Dominante Claire" required>
                  <Input
                    value={formValues.colorLight || '#2E7D32'}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, colorLight: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Couleur Dominante Sombre" required>
                  <Input
                    value={formValues.colorDark || '#1B5E20'}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, colorDark: e.target.value }))
                    }
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Description Recto (FR)" required>
                  <textarea
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    rows={2}
                    value={formValues.obverseDescriptionFr || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, obverseDescriptionFr: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Description Recto (MG)" required>
                  <textarea
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    rows={2}
                    value={formValues.obverseDescriptionMg || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, obverseDescriptionMg: e.target.value }))
                    }
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Description Verso (FR)" required>
                  <textarea
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    rows={2}
                    value={formValues.reverseDescriptionFr || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, reverseDescriptionFr: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Description Verso (MG)" required>
                  <textarea
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    rows={2}
                    value={formValues.reverseDescriptionMg || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, reverseDescriptionMg: e.target.value }))
                    }
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Symbolisme & Portée (FR)" required>
                  <Input
                    value={formValues.symbolismFr || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, symbolismFr: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Symbolisme & Portée (MG)" required>
                  <Input
                    value={formValues.symbolismMg || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, symbolismMg: e.target.value }))
                    }
                    required
                  />
                </Field>
              </div>

              <Field label="Éléments de sécurité (1 par ligne)">
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  rows={2}
                  value={formValues.securityFeaturesRaw ?? ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, securityFeaturesRaw: e.target.value }))
                  }
                  placeholder="Fil de sécurité à fenêtre scintillante&#10;Motif tactile pour malvoyants"
                />
              </Field>
            </>
          );
        })()}

        {/* 5. FORMULAIRE NATURE & TRÉSORS */}
        {activeTab === 'nature' && (
          <>
            {!editingItem && (
              <Field label="Identifiant (slug, ex: ravinala)" required>
                <Input
                  value={formValues.id || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                  required
                />
              </Field>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nom commun (FR)" required>
                <Input
                  value={formValues.nameFr || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, nameFr: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Nom en malgache" required>
                <Input
                  value={formValues.nameMg || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, nameMg: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nom scientifique" required>
                <Input
                  value={formValues.scientificName || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, scientificName: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Règne (Faune ou Flore)" required>
                <select
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  value={formValues.type || 'FLORA'}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="FLORA">🌿 Flore (Zavamaniry)</option>
                  <option value="FAUNA">🐾 Faune (Biby)</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Statut de conservation (FR)" required>
                <Input
                  value={formValues.statusFr || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, statusFr: e.target.value }))
                  }
                  placeholder="Endémique, Vulnérable, Symbole national..."
                  required
                />
              </Field>
              <Field label="Statut de conservation (MG)" required>
                <Input
                  value={formValues.statusMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, statusMg: e.target.value }))
                  }
                  placeholder="Harena voaaro manokana..."
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Description (FR)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={formValues.descriptionFr || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, descriptionFr: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Description (MG)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={formValues.descriptionMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, descriptionMg: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Rôle culturel & symbolique (FR)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={formValues.culturalRoleFr || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, culturalRoleFr: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Rôle culturel & symbolique (MG)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={formValues.culturalRoleMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, culturalRoleMg: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>
          </>
        )}

        {/* 6. FORMULAIRE GRANDES DATES */}
        {activeTab === 'dates' && (
          <>
            {!editingItem && (
              <Field label="Identifiant (slug, ex: date-1960-06-26)" required>
                <Input
                  value={formValues.id || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                  required
                />
              </Field>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Année (ex: 1960)" required>
                <Input
                  value={formValues.year || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, year: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Date exacte (ex: 26 Juin 1960)" required>
                <Input
                  value={formValues.exactDate || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, exactDate: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Époque / Période" required>
                <Input
                  value={formValues.era || 'Époque contemporaine'}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, era: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Titre de l'événement (FR)" required>
                <Input
                  value={formValues.titleFr || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Titre de l'événement (MG)" required>
                <Input
                  value={formValues.titleMg || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Résumé historique (FR)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  value={formValues.summaryFr || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, summaryFr: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Résumé historique (MG)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  value={formValues.summaryMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, summaryMg: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Impact & Portée historique (FR)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={formValues.impactFr || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, impactFr: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Impact & Portée historique (MG)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={formValues.impactMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, impactMg: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>
          </>
        )}

        {/* 7. FORMULAIRE RUBRIQUES & LEÇONS */}
        {activeTab === 'lessons' && (
          <>
            {!editingItem && (
              <Field label="Identifiant (slug, ex: billets-monnaies)" required>
                <Input
                  value={formValues.id || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                  required
                />
              </Field>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Titre (FR)" required>
                <Input
                  value={formValues.titleFr || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Titre (MG)" required>
                <Input
                  value={formValues.titleMg || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Description (FR)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={formValues.descriptionFr || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, descriptionFr: e.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Description (MG)" required>
                <textarea
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                  value={formValues.descriptionMg || ''}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, descriptionMg: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>
            <Field label="Catégories (séparées par virgule, ex: histoire, politique, republique)">
              <Input
                value={formValues.categoryRaw || ''}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, categoryRaw: e.target.value }))
                }
              />
            </Field>
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={formValues.lessonStatus ?? true}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, lessonStatus: e.target.checked }))
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Thématique active et disponible dans l&apos;application</span>
              </label>
            </div>
          </>
        )}

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>
              {isSubmitting
                ? 'Enregistrement en cours...'
                : editingItem
                ? 'Mettre à jour'
                : 'Enregistrer'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
