/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote as BanknoteIcon,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Languages,
  Save,
  Building2,
  Plus,
  X,
  FileText,
  Sliders,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal, Field, Input, ImageUploadDropzone } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { resolveMediaUrl, slugify } from '@/lib/utils/media';
import { historyService } from '@/services/history.service';
import type { BanknoteItem, ContentStatus } from '@/types/history';
import {
  BANKNOTE_ISSUERS,
  type BanknoteSeriesKey,
} from '../constants/banknotes';

interface BanknoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: BanknoteItem | null;
  onSuccess: () => void | Promise<void>;
}

type FormSection = 'identification' | 'images' | 'descriptions' | 'publishing';

// Suggestions prédéfinies d'éléments de sécurité officiels
const SECURITY_SUGGESTIONS = [
  'Filigrane personnalisé',
  'Fil de sécurité fenêtré',
  'Encre optiquement variable (OVI)',
  'Motif de transvision recto-verso',
  'Micro-impressions haute précision',
  'Éléments fluorescents sous UV',
  'Bande holographique sécurisée',
  'Gaufrage tactile pour malvoyants',
];

export function BanknoteModal({
  isOpen,
  onClose,
  editingItem,
  onSuccess,
}: BanknoteModalProps) {
  const { toast } = useToast();

  // Section active du formulaire
  const [activeSection, setActiveSection] = useState<FormSection>('identification');
  // Langue active pour l'édition des textes éditoriaux
  const [contentLang, setContentLang] = useState<'FR' | 'MG'>('FR');
  // Face affichée pour l'aperçu
  const [previewFace, setPreviewFace] = useState<'recto' | 'verso'>('recto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Champs du formulaire
  const [seriesKey, setSeriesKey] = useState<BanknoteSeriesKey>('SERIE_2017');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [valueAriary, setValueAriary] = useState<number>(0);
  const [valueFmg, setValueFmg] = useState<number>(0);
  const [titleFr, setTitleFr] = useState('');
  const [titleMg, setTitleMg] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUrlVerso, setImageUrlVerso] = useState<string | null>(null);
  const [colorLight, setColorLight] = useState('#2C4075');
  const [colorDark, setColorDark] = useState('#3E5AA1');
  const [period, setPeriod] = useState('2017 - Présent');
  const [seriesLabelFr, setSeriesLabelFr] = useState('Série 2017 — Madagascar & ses Richesses');
  const [seriesLabelMg, setSeriesLabelMg] = useState('Andiany 2017 — Madagasikara sy ny Harenany');
  const [obverseDescriptionFr, setObverseDescriptionFr] = useState('');
  const [obverseDescriptionMg, setObverseDescriptionMg] = useState('');
  const [reverseDescriptionFr, setReverseDescriptionFr] = useState('');
  const [reverseDescriptionMg, setReverseDescriptionMg] = useState('');
  const [symbolismFr, setSymbolismFr] = useState('');
  const [symbolismMg, setSymbolismMg] = useState('');
  const [securityFeatures, setSecurityFeatures] = useState<string[]>([]);
  const [customSecurityInput, setCustomSecurityInput] = useState('');
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [orderIndex, setOrderIndex] = useState(0);
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');

  // Configuration de l'émetteur actif
  const currentIssuer = useMemo(() => {
    return BANKNOTE_ISSUERS[seriesKey] || BANKNOTE_ISSUERS.SERIE_2017;
  }, [seriesKey]);

  // Initialisation à l'ouverture du modal
  useEffect(() => {
    if (!isOpen) return;

    setFormErrors({});

    if (editingItem) {
      // MODE ÉDITION : chargement fidèle des données réelles existantes
      const detectedKey: BanknoteSeriesKey = (() => {
        const s = editingItem.series || '';
        if (BANKNOTE_ISSUERS[s]) return s as BanknoteSeriesKey;
        if (s === 'COLONIAL' || editingItem.id?.includes('colonial')) return 'MDG100';
        if (s === 'SERIE_FMG') return 'MDG250';
        if (s === 'SERIE_2003') return 'MDG460';
        return 'SERIE_2017';
      })();

      setSeriesKey(detectedKey);
      setSlug(editingItem.id || '');
      setIsSlugManuallyEdited(true);
      setValueAriary(editingItem.valueAriary || 0);
      setValueFmg(editingItem.valueFmg || 0);
      setTitleFr(editingItem.titleFr || '');
      setTitleMg(editingItem.titleMg || '');
      setImageUrl(editingItem.imageUrl || null);
      setImageUrlVerso(editingItem.imageUrlVerso || null);
      setColorLight(editingItem.colorLight || '#2C4075');
      setColorDark(editingItem.colorDark || '#3E5AA1');
      setPeriod(editingItem.period || '');
      setSeriesLabelFr(editingItem.seriesLabelFr || '');
      setSeriesLabelMg(editingItem.seriesLabelMg || '');
      setObverseDescriptionFr(editingItem.obverseDescriptionFr || '');
      setObverseDescriptionMg(editingItem.obverseDescriptionMg || '');
      setReverseDescriptionFr(editingItem.reverseDescriptionFr || '');
      setReverseDescriptionMg(editingItem.reverseDescriptionMg || '');
      setSymbolismFr(editingItem.symbolismFr || '');
      setSymbolismMg(editingItem.symbolismMg || '');
      setSecurityFeatures(editingItem.securityFeaturesFr || []);
      setIsComingSoon(Boolean(editingItem.isComingSoon));
      setOrderIndex(editingItem.orderIndex ?? 0);
      setStatus(editingItem.status || 'PUBLISHED');
      setActiveSection('identification');
    } else {
      // MODE CRÉATION : formulaire propre SANS pré-remplissage artificiel de faux billets
      const defaultKey: BanknoteSeriesKey = 'SERIE_2017';
      const defaultIssuer = BANKNOTE_ISSUERS[defaultKey];

      setSeriesKey(defaultKey);
      setSlug('');
      setIsSlugManuallyEdited(false);
      setValueAriary(0);
      setValueFmg(0);
      setTitleFr('');
      setTitleMg('');
      setImageUrl(null);
      setImageUrlVerso(null);
      setColorLight(defaultIssuer?.colorLightDefault || '#2C4075');
      setColorDark(defaultIssuer?.colorDarkDefault || '#3E5AA1');
      setPeriod(defaultIssuer?.periodDefault || '2017 - Présent');
      setSeriesLabelFr(defaultIssuer?.seriesLabelFrDefault || 'Série 2017');
      setSeriesLabelMg(defaultIssuer?.seriesLabelMgDefault || 'Andiany 2017');
      setObverseDescriptionFr('');
      setObverseDescriptionMg('');
      setReverseDescriptionFr('');
      setReverseDescriptionMg('');
      setSymbolismFr('');
      setSymbolismMg('');
      setSecurityFeatures([]);
      setIsComingSoon(false);
      setOrderIndex(0);
      setStatus('PUBLISHED');
      setActiveSection('identification');
    }
  }, [isOpen, editingItem]);

  // Changement d'institut d'émission / époque
  const handleSeriesChange = (newKey: BanknoteSeriesKey) => {
    setSeriesKey(newKey);
    const issuer = BANKNOTE_ISSUERS[newKey];
    if (issuer) {
      setPeriod(issuer.periodDefault);
      setSeriesLabelFr(issuer.seriesLabelFrDefault);
      setSeriesLabelMg(issuer.seriesLabelMgDefault);
      setColorLight(issuer.colorLightDefault);
      setColorDark(issuer.colorDarkDefault);

      if (issuer.currencyUnit === 'FRANC_COLONIAL') {
        setValueAriary(0);
      }
    }
  };

  // Synchronisation intelligente de la valeur Ariary
  const handleAriaryChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setValueAriary(safeVal);

    if (currentIssuer.currencyUnit !== 'FRANC_COLONIAL') {
      setValueFmg(safeVal * 5);
    }

    // Mise à jour automatique du titre et du slug si non personnalisés manuellement
    if (!editingItem && !isSlugManuallyEdited && safeVal > 0) {
      const prefix = seriesKey.toLowerCase().replace('_', '-');
      setSlug(`billet-${prefix}-${safeVal}`);
    }
  };

  // Synchronisation intelligente de la valeur FMG
  const handleFmgChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setValueFmg(safeVal);

    if (currentIssuer.currencyUnit === 'FRANC_COLONIAL') {
      setValueAriary(0);
      if (!editingItem && !isSlugManuallyEdited && safeVal > 0) {
        setSlug(`billet-colonial-${safeVal}f`);
      }
    } else {
      const derivedAr = Math.round(safeVal / 5);
      setValueAriary(derivedAr);
      if (!editingItem && !isSlugManuallyEdited && safeVal > 0) {
        const prefix = seriesKey.toLowerCase().replace('_', '-');
        setSlug(`billet-${prefix}-${safeVal}f`);
      }
    }
  };

  // Gestion des éléments de sécurité
  const addSecurityFeature = (feature: string) => {
    const trimmed = feature.trim();
    if (!trimmed || securityFeatures.includes(trimmed)) return;
    setSecurityFeatures((prev) => [...prev, trimmed]);
    setCustomSecurityInput('');
  };

  const removeSecurityFeature = (index: number) => {
    setSecurityFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!titleFr.trim()) {
      errors.titleFr = 'Le titre en français est requis.';
    }

    if (!isComingSoon && !imageUrl) {
      errors.imageUrl = 'La photographie Recto (Avers) est obligatoire pour publier le billet.';
    }

    if (currentIssuer.currencyUnit === 'FRANC_COLONIAL' && valueFmg <= 0) {
      errors.valueFmg = 'Veuillez renseigner la valeur en Francs coloniaux.';
    } else if (currentIssuer.currencyUnit !== 'FRANC_COLONIAL' && valueAriary <= 0 && valueFmg <= 0) {
      errors.valueAriary = 'Veuillez spécifier la valeur faciale du billet.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les champs en erreur.');
      return;
    }

    // Déduction sûre du slug si laissé vide
    const finalSlug = (() => {
      if (slug.trim()) return slugify(slug.trim());
      if (editingItem?.id) return editingItem.id;
      const prefix = seriesKey.toLowerCase().replace('_', '-');
      if (valueAriary > 0) return `billet-${prefix}-${valueAriary}`;
      if (valueFmg > 0) return `billet-${prefix}-${valueFmg}f`;
      if (titleFr.trim()) return `billet-${prefix}-${slugify(titleFr.trim())}`;
      return `billet-${prefix}-${Date.now().toString(36)}`;
    })();

    setIsSubmitting(true);
    try {
      const payload: Partial<BanknoteItem> = {
        id: finalSlug,
        valueAriary: Number(valueAriary) || 0,
        valueFmg: Number(valueFmg) || 0,
        titleFr: titleFr.trim(),
        titleMg: titleMg.trim() || (valueAriary > 0 ? `Vola ${valueAriary.toLocaleString('fr-FR')} Ariary` : titleFr.trim()),
        series: seriesKey,
        seriesLabelFr: seriesLabelFr.trim() || currentIssuer.seriesLabelFrDefault,
        seriesLabelMg: seriesLabelMg.trim() || currentIssuer.seriesLabelMgDefault,
        period: period.trim() || currentIssuer.periodDefault,
        colorLight: colorLight || '#2C4075',
        colorDark: colorDark || '#3E5AA1',
        obverseDescriptionFr: obverseDescriptionFr.trim() || null,
        obverseDescriptionMg: obverseDescriptionMg.trim() || null,
        reverseDescriptionFr: reverseDescriptionFr.trim() || null,
        reverseDescriptionMg: reverseDescriptionMg.trim() || null,
        symbolismFr: symbolismFr.trim() || null,
        symbolismMg: symbolismMg.trim() || null,
        securityFeaturesFr: securityFeatures,
        imageUrl: imageUrl || null,
        imageUrlVerso: imageUrlVerso || null,
        isComingSoon: Boolean(isComingSoon),
        orderIndex: Number(orderIndex) || 0,
        status: status || 'PUBLISHED',
      };

      if (editingItem) {
        delete payload.id;
        await historyService.updateBanknote(editingItem.id, payload);
        toast.success(`Le billet « ${payload.titleFr} » a été mis à jour.`);
      } else {
        await historyService.createBanknote(payload);
        toast.success(`Le billet « ${payload.titleFr} » a été ajouté à la collection.`);
      }

      onClose();
      await onSuccess();
    } catch (err) {
      toast.error(`Erreur : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewImage = previewFace === 'verso' ? imageUrlVerso || imageUrl : imageUrl;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="5xl"
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs transition-colors"
            style={{ backgroundColor: colorLight }}
          >
            <BanknoteIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--foreground)]">
                {editingItem ? `Modifier : ${editingItem.titleFr}` : 'Ajouter un Billet Malgache'}
              </span>
              <span
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  imageUrl
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
                    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
                }`}
              >
                {imageUrl ? <CheckCircle2 size={12} className="text-emerald-600" /> : <AlertCircle size={12} className="text-amber-600" />}
                <span>{imageUrl ? (imageUrlVerso ? 'Recto & Verso' : 'Recto seul') : 'Sans image'}</span>
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-normal">
              Collection numismatique Kanto MG • Patrimoine fiduciaire malgache
            </p>
          </div>
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:bg-[var(--card-hover)] text-xs font-medium transition cursor-pointer"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save size={14} />
              <span>{isSubmitting ? 'Enregistrement...' : editingItem ? 'Mettre à jour le billet' : 'Ajouter à la collection'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation par onglets thématiques clairs (accès libre, zéro wizard contraignant) */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--input-bg)] rounded-xl border border-[var(--input-border)] text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('identification')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'identification'
                ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Building2 size={14} />
            <span>1. Émission & Valeurs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('images')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'images'
                ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <ImageIcon size={14} />
            <span>2. Photographies (Recto / Verso)</span>
            {imageUrl && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('descriptions')}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'descriptions'
                ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <FileText size={14} />
            <span>3. Récit & Symbolisme</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('publishing')}
            className={`py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'publishing'
                ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Sliders size={14} />
            <span>4. Publication</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* SECTION 1 : ÉMISSION, IDENTIFICATION & RÉGIME MONÉTAIRE              */}
        {/* ==================================================================== */}
        {activeSection === 'identification' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Choix de l'Époque / Institut d'émission */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
              <Field
                label="Époque & Institut d'Émission officiel"
                hint="Définit le régime monétaire et le contexte historique du billet"
                required
              >
                <select
                  value={seriesKey}
                  onChange={(e) => handleSeriesChange(e.target.value as BanknoteSeriesKey)}
                  className="w-full p-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  <optgroup label="Série Contemporaine (Ariary MGA)">
                    <option value="SERIE_2017">Série 2017 — Banque Centrale de Madagascar (2017 - Présent)</option>
                  </optgroup>
                  <optgroup label="Transition & Réforme Ariary (2003 - 2015)">
                    <option value="MDG475">Banque Centrale de Madagascar (2007-2015)</option>
                    <option value="MDG470">Banque Centrale de Madagascar (2007)</option>
                    <option value="MDG465">Banque Centrale de Madagascar (2004-2006)</option>
                    <option value="MDG460">Banque Centrale de Madagascar (2003 — Réforme Ariary)</option>
                    <option value="SERIE_2003">Série 2003 — Transition FMG vers Ariary (Générique)</option>
                  </optgroup>
                  <optgroup label="Républiques en Franc Malgache (FMG 1960 - 1998)">
                    <option value="MDG450">Banque Centrale de Madagascar — 3e République (1994-1998)</option>
                    <option value="MDG400">Banque Centrale de Madagascar — 2e République (1983-1993)</option>
                    <option value="MDG300">Banque Centrale de la République Malgache (1974-1975)</option>
                    <option value="MDG250">Institut d'Émission Malgache — 1ère République (1964-1970)</option>
                    <option value="MDG200">Institut d'Émission Malgache — Indépendance (1961)</option>
                    <option value="SERIE_FMG">Série FMG Républicaine (Générique)</option>
                  </optgroup>
                  <optgroup label="Époque Coloniale (Francs coloniaux 1917 - 1960)">
                    <option value="MDG150">Banque de Madagascar et des Comores (1950-1951)</option>
                    <option value="MDG100">Banque de Madagascar (1926-1947)</option>
                    <option value="MDG105">Colonie de Madagascar — Bons de caisse (1917)</option>
                    <option value="COLONIAL">Période Coloniale Générique (1925-1960)</option>
                  </optgroup>
                </select>
              </Field>

              <div className="text-[11.5px] text-[var(--text-muted)] bg-[var(--input-bg)] p-2.5 rounded-lg border border-[var(--input-border)] flex items-start gap-2">
                <Building2 size={15} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <span>
                  {currentIssuer.description} {currentIssuer.tip && <strong className="text-[var(--foreground)]">Conseil : {currentIssuer.tip}</strong>}
                </span>
              </div>
            </div>

            {/* Titres bilingues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Titre officiel du billet (Français)"
                hint="Ex: Billet 20 000 Ariary — Toamasina & Valiha"
                required
                error={formErrors.titleFr}
              >
                <Input
                  value={titleFr}
                  onChange={(e) => {
                    setTitleFr(e.target.value);
                    if (formErrors.titleFr) {
                      setFormErrors((prev) => ({ ...prev, titleFr: '' }));
                    }
                  }}
                  placeholder="Ex: Billet 20 000 Ariary..."
                />
              </Field>

              <Field
                label="Titre en Malagasy"
                hint="Ex: Vola 20 000 Ariary — Seranan-tsambon'i Toamasina"
              >
                <Input
                  value={titleMg}
                  onChange={(e) => setTitleMg(e.target.value)}
                  placeholder="Ex: Vola 20 000 Ariary..."
                />
              </Field>
            </div>

            {/* Valeurs faciales et conversion intelligente */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
              <h4 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                Valeur faciale & Régime monétaire
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentIssuer.currencyUnit !== 'FRANC_COLONIAL' ? (
                  <>
                    <Field
                      label="Valeur faciale en Ariary (Ar)"
                      hint="Calcule automatiquement l'équivalence FMG (× 5)"
                      error={formErrors.valueAriary}
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          value={valueAriary === 0 ? '' : valueAriary}
                          onChange={(e) => handleAriaryChange(Number(e.target.value))}
                          placeholder="Ex: 20000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)] pointer-events-none">
                          Ariary
                        </span>
                      </div>
                    </Field>

                    <Field
                      label="Valeur faciale en Francs Malgaches (FMG)"
                      hint="Équivalence officielle (Ariary × 5)"
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          value={valueFmg === 0 ? '' : valueFmg}
                          onChange={(e) => handleFmgChange(Number(e.target.value))}
                          placeholder="Ex: 100000"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)] pointer-events-none">
                          Fmg
                        </span>
                      </div>
                    </Field>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <Field
                      label="Valeur faciale en Francs coloniaux"
                      hint="Monnaie de la période coloniale. À cette époque, l'Ariary n'existait pas encore."
                      required
                      error={formErrors.valueFmg}
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          value={valueFmg === 0 ? '' : valueFmg}
                          onChange={(e) => handleFmgChange(Number(e.target.value))}
                          placeholder="Ex: 500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 pointer-events-none">
                          Francs coloniaux
                        </span>
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            </div>

            {/* Période, Identifiant unique et Teintes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field
                label="Période de circulation"
                hint="Années d'émission"
              >
                <Input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ex: 2017 - Présent"
                />
              </Field>

              <Field
                label="Couleur dominante (Claire)"
                hint="Code hexadécimal"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorLight}
                    onChange={(e) => setColorLight(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[var(--input-border)] bg-transparent cursor-pointer shrink-0 p-0.5"
                  />
                  <Input
                    value={colorLight}
                    onChange={(e) => setColorLight(e.target.value)}
                    placeholder="#2C4075"
                  />
                </div>
              </Field>

              <Field
                label="Identifiant unique (Slug)"
                hint={isSlugManuallyEdited ? 'Personnalisé manuellement' : 'Auto-déduit si vide'}
              >
                <Input
                  value={slug}
                  onChange={(e) => {
                    setIsSlugManuallyEdited(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="Ex: billet-2017-20000"
                  disabled={Boolean(editingItem)}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SECTION 2 : VISUELS NUMISMATIQUES (RECTO & VERSO)                    */}
        {/* ==================================================================== */}
        {activeSection === 'images' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {formErrors.imageUrl && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{formErrors.imageUrl}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Dropzone Face Recto */}
              <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--foreground)] flex items-center gap-1.5 uppercase tracking-wide">
                    <Eye size={14} className="text-emerald-600" />
                    <span>Face Recto (Avers)</span>
                  </span>
                  <span className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Visuel principal
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Face avant du billet, montrant généralement la valeur, le titre de la banque et les motifs centraux.
                </p>
                <ImageUploadDropzone
                  value={imageUrl}
                  onChange={(url) => {
                    setImageUrl(url);
                    if (formErrors.imageUrl) {
                      setFormErrors((prev) => ({ ...prev, imageUrl: '' }));
                    }
                  }}
                  label="Déposer la photo Recto (PNG, WebP, JPG)"
                  subfolder="banknotes"
                />
              </div>

              {/* Dropzone Face Verso */}
              <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--foreground)] flex items-center gap-1.5 uppercase tracking-wide">
                    <RotateCcw size={14} className="text-purple-600" />
                    <span>Face Verso (Revers)</span>
                  </span>
                  <span className="text-[10.5px] font-semibold text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-full">
                    Facultatif recommandé
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Face arrière du billet, illustrant la biodiversité, les paysages ou l&apos;artisanat malgache.
                </p>
                <ImageUploadDropzone
                  value={imageUrlVerso}
                  onChange={(url) => setImageUrlVerso(url)}
                  label="Déposer la photo Verso (PNG, WebP, JPG)"
                  subfolder="banknotes"
                />
              </div>
            </div>

            {/* Prévisualisation comparative Recto / Verso */}
            {(imageUrl || imageUrlVerso) && (
              <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--foreground)]">Aperçu immédiat de la face active</span>
                  <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1 rounded-lg border border-[var(--input-border)]">
                    <button
                      type="button"
                      onClick={() => setPreviewFace('recto')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        previewFace === 'recto'
                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      Avers (Recto)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFace('verso')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        previewFace === 'verso'
                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                          : 'text-[var(--text-muted)]'
                      }`}
                      disabled={!imageUrlVerso}
                    >
                      Revers (Verso) {!imageUrlVerso && '(non renseigné)'}
                    </button>
                  </div>
                </div>

                <div className="h-52 rounded-xl overflow-hidden bg-stone-900 flex items-center justify-center p-3 relative group">
                  {previewImage ? (
                    <img
                      src={resolveMediaUrl(previewImage)}
                      alt="Aperçu du billet"
                      className="max-h-full max-w-full object-contain rounded shadow-lg transition-transform duration-300 group-hover:scale-102"
                    />
                  ) : (
                    <span className="text-stone-400 text-xs">Aucune image pour cette face</span>
                  )}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[10.5px] font-semibold">
                    {previewFace === 'recto' ? 'Face Recto (Avers)' : 'Face Verso (Revers)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* SECTION 3 : RÉCIT PATRIMONIAL, TEXTES & SIGNES DE SÉCURITÉ           */}
        {/* ==================================================================== */}
        {activeSection === 'descriptions' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Bascule de langue pour la rédaction éditoriale */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
              <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <Languages size={15} className="text-[var(--accent)]" />
                <span>Langue d&apos;édition des textes patrimoniaux</span>
              </span>
              <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-lg border border-[var(--input-border)] text-xs">
                <button
                  type="button"
                  onClick={() => setContentLang('FR')}
                  className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                    contentLang === 'FR'
                      ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  🇫🇷 Français
                </button>
                <button
                  type="button"
                  onClick={() => setContentLang('MG')}
                  className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                    contentLang === 'MG'
                      ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  🇲🇬 Malagasy
                </button>
              </div>
            </div>

            {contentLang === 'FR' ? (
              <div className="space-y-3">
                <Field
                  label="Description de l'Avers (Recto en Français)"
                  hint="Personnages, édifices, symboles représentés sur la face avant"
                >
                  <textarea
                    value={obverseDescriptionFr}
                    onChange={(e) => setObverseDescriptionFr(e.target.value)}
                    rows={3}
                    placeholder="Ex: Vue du grand port de Toamasina et instruments traditionnels malgaches..."
                    className="w-full p-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </Field>

                <Field
                  label="Description du Revers (Verso en Français)"
                  hint="Flore, faune, artisanat, paysages illustrés au verso"
                >
                  <textarea
                    value={reverseDescriptionFr}
                    onChange={(e) => setReverseDescriptionFr(e.target.value)}
                    rows={3}
                    placeholder="Ex: Valiha traditionnelle malgache, lémuriens et flore endémique..."
                    className="w-full p-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </Field>

                <Field
                  label="Signification culturelle & Symbolisme (Français)"
                  hint="Contexte historique et portée socioculturelle de l'émission"
                >
                  <textarea
                    value={symbolismFr}
                    onChange={(e) => setSymbolismFr(e.target.value)}
                    rows={3}
                    placeholder="Ex: Émission commémorant le développement économique et la richesse de la biodiversité insulaire..."
                    className="w-full p-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </Field>
              </div>
            ) : (
              <div className="space-y-3">
                <Field
                  label="Fanazavana ny Anoloana (Avers amin'ny teny Malagasy)"
                  hint="Sary, olona malaza, na tsangambato eo amin'ny lafiny anoloana"
                >
                  <textarea
                    value={obverseDescriptionMg}
                    onChange={(e) => setObverseDescriptionMg(e.target.value)}
                    rows={3}
                    placeholder="Ohatra: Seranan-tsambon'i Toamasina sy fitaovana nentim-paharazana..."
                    className="w-full p-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </Field>

                <Field
                  label="Fanazavana ny Vohony (Verso amin'ny teny Malagasy)"
                  hint="Zavaboary, biby, zava-kanto eo amin'ny lafiny vohony"
                >
                  <textarea
                    value={reverseDescriptionMg}
                    onChange={(e) => setReverseDescriptionMg(e.target.value)}
                    rows={3}
                    placeholder="Ohatra: Valiha malagasy, biby sy zava-maniry mampiavaka an'i Madagasikara..."
                    className="w-full p-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </Field>

                <Field
                  label="Hevitra ara-kolontsaina & Fanehoana (Malagasy)"
                  hint="Ny hevitra ambadiky ny sary sy ny tantaran'ity vola ity"
                >
                  <textarea
                    value={symbolismMg}
                    onChange={(e) => setSymbolismMg(e.target.value)}
                    rows={3}
                    placeholder="Ohatra: Mampiseho ny firoborobon'ny toekarena sy ny haren'ny tontolo iainana..."
                    className="w-full p-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </Field>
              </div>
            )}

            {/* Éléments de sécurité officiels */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[var(--foreground)] flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>Dispositifs de sécurité & Authenticité</span>
                </span>
                <span className="text-[10.5px] font-semibold text-[var(--text-muted)]">
                  {securityFeatures.length} élément(s) enregistré(s)
                </span>
              </div>

              {/* Suggestions rapides cliquables */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-[var(--text-muted)]">Suggestions officielles :</span>
                <div className="flex flex-wrap gap-1.5">
                  {SECURITY_SUGGESTIONS.map((sug) => {
                    const isAdded = securityFeatures.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => (isAdded ? null : addSecurityFeature(sug))}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1 border ${
                          isAdded
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 opacity-60 cursor-default'
                            : 'bg-[var(--input-bg)] text-[var(--foreground)] border-[var(--input-border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        {!isAdded && <Plus size={11} />}
                        <span>{sug}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saisie personnalisée d'un signe de sécurité */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={customSecurityInput}
                  onChange={(e) => setCustomSecurityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSecurityFeature(customSecurityInput);
                    }
                  }}
                  placeholder="Ajouter un autre dispositif de sécurité..."
                />
                <button
                  type="button"
                  onClick={() => addSecurityFeature(customSecurityInput)}
                  className="px-3.5 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition shrink-0 cursor-pointer"
                >
                  Ajouter
                </button>
              </div>

              {/* Liste des tags enregistrés */}
              {securityFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--card-border)]">
                  {securityFeatures.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--foreground)] font-medium flex items-center gap-1.5 shadow-2xs"
                    >
                      <ShieldCheck size={12} className="text-emerald-600" />
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => removeSecurityFeature(idx)}
                        className="text-[var(--text-muted)] hover:text-rose-500 transition cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SECTION 4 : PUBLICATION, ORDRE & OPTIONS AVANCÉES                     */}
        {/* ==================================================================== */}
        {activeSection === 'publishing' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Statut de publication */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
              <Field
                label="Statut de diffusion dans l'application"
                hint="Contrôle la visibilité immédiate pour les utilisateurs"
                required
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('PUBLISHED')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      status === 'PUBLISHED'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <span className="text-xs block">✅ Publié</span>
                    <span className="text-[10.5px] opacity-80 block font-normal">Visible par tous les utilisateurs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('DRAFT')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      status === 'DRAFT'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                        : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <span className="text-xs block">📝 Brouillon</span>
                    <span className="text-[10.5px] opacity-80 block font-normal">En cours de rédaction, masqué</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('ARCHIVED')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      status === 'ARCHIVED'
                        ? 'border-stone-500 bg-stone-500/10 text-stone-700 dark:text-stone-300 font-bold'
                        : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <span className="text-xs block">📦 Archivé</span>
                    <span className="text-[10.5px] opacity-80 block font-normal">Conservé en base, non affiché</span>
                  </button>
                </div>
              </Field>
            </div>

            {/* Option Contenu à venir */}
            <div
              onClick={() => setIsComingSoon(!isComingSoon)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isComingSoon
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isComingSoon
                      ? 'bg-amber-500 border-amber-600 text-white'
                      : 'border-[var(--input-border)] bg-[var(--input-bg)]'
                  }`}
                >
                  {isComingSoon && <span className="text-xs font-bold">✓</span>}
                </div>
                <div>
                  <span className="font-bold text-xs text-[var(--foreground)] block">
                    Mode « Contenu à venir » (Visuel seul disponible)
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block">
                    Permet d&apos;exposer un billet patrimonial rare même si ses descriptions détaillées sont en cours de rédaction.
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                {isComingSoon ? 'Activé' : 'Désactivé'}
              </span>
            </div>

            {/* Ordre de tri dans la collection */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
              <Field
                label="Ordre d'affichage (Index de tri)"
                hint="Valeur numérique (0, 1, 2...) pour ordonner manuellement les billets dans la même série"
              >
                <Input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  placeholder="0"
                />
              </Field>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
