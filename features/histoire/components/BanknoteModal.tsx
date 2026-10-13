/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote as BanknoteIcon,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Palette,
  ShieldCheck,
  Languages,
  ArrowRight,
  ArrowLeft,
  Save,
  HelpCircle,
  X,
  Lock,
  Building2,
} from 'lucide-react';
import { Modal, Field, Input, ImageUploadDropzone } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { resolveMediaUrl, slugify } from '@/lib/utils/media';
import { historyService } from '@/services/history.service';
import type { BanknoteItem, ContentStatus } from '@/types/history';
import {
  BANKNOTE_ISSUERS,
  BANKNOTE_PRESETS_BY_SERIES,
  BANKNOTE_COLOR_PALETTES,
  SECURITY_FEATURE_TAGS,
  type BanknoteSeriesKey,
  type BanknotePreset,
  type HistoricalEraCategory,
} from '../constants/banknotes';

interface BanknoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: BanknoteItem | null;
  onSuccess: () => void | Promise<void>;
}

type TabStep = 'value' | 'images' | 'texts' | 'advanced';

const MACRO_ERA_TABS: { key: 'ALL' | HistoricalEraCategory; label: string; icon: string }[] = [
  { key: 'ALL', label: 'Toutes les Émissions', icon: '📜' },
  { key: 'SERIE_ACTUELLE', label: 'Série 2017 Actuelle', icon: '✨' },
  { key: 'TRANSITION_ARIARY', label: 'Transition Ariary (2003-2015)', icon: '🔄' },
  { key: 'TROISIEME_REPUBLIQUE', label: '3e Rép. FMG (1994-1998)', icon: '🏛️' },
  { key: 'DEUXIEME_REPUBLIQUE', label: '2e Rép. FMG (1974-1993)', icon: '✊' },
  { key: 'PREMIERE_REPUBLIQUE', label: '1ère Rép. IEM (1960-1970)', icon: '🇲🇬' },
  { key: 'COLONIAL', label: 'Période Coloniale (1917-1960)', icon: '⌛' },
];

export function BanknoteModal({
  isOpen,
  onClose,
  editingItem,
  onSuccess,
}: BanknoteModalProps) {
  const { toast } = useToast();

  // Étape active du formulaire
  const [activeStep, setActiveStep] = useState<TabStep>('value');
  // Filtre d'époque affiché pour le sélecteur
  const [selectedMacroCategory, setSelectedMacroCategory] = useState<'ALL' | HistoricalEraCategory>('ALL');
  // Langue active pour les textes
  const [contentLang, setContentLang] = useState<'FR' | 'MG'>('FR');
  // Aperçu de la face du billet dans le Live Preview
  const [previewFace, setPreviewFace] = useState<'recto' | 'verso'>('recto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualSlug, setIsManualSlug] = useState(false);

  // État du formulaire
  const [seriesKey, setSeriesKey] = useState<BanknoteSeriesKey>('SERIE_2017');
  const [slug, setSlug] = useState('');
  const [valueAriary, setValueAriary] = useState<number>(0);
  const [valueFmg, setValueFmg] = useState<number>(0);
  const [titleFr, setTitleFr] = useState('');
  const [titleMg, setTitleMg] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUrlVerso, setImageUrlVerso] = useState<string | null>(null);
  const [colorLight, setColorLight] = useState('#1E3A8A');
  const [colorDark, setColorDark] = useState('#2563EB');
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
  const [securityInput, setSecurityInput] = useState('');
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [orderIndex, setOrderIndex] = useState(0);
  const [status, setStatus] = useState<ContentStatus>('PUBLISHED');

  // Configuration de l'émetteur actif
  const currentIssuer = useMemo(() => {
    return BANKNOTE_ISSUERS[seriesKey] || BANKNOTE_ISSUERS.SERIE_2017;
  }, [seriesKey]);

  // Déduire l'émetteur et initialiser l'état
  useEffect(() => {
    if (!isOpen) return;

    if (editingItem) {
      const detectedKey: BanknoteSeriesKey = (() => {
        const s = editingItem.series || '';
        if (BANKNOTE_ISSUERS[s]) return s as BanknoteSeriesKey;
        if (s === 'COLONIAL' || editingItem.id?.includes('colonial')) return 'MDG100';
        if (s === 'SERIE_FMG') return 'MDG250';
        if (s === 'SERIE_2003') return 'MDG460';
        return 'SERIE_2017';
      })();

      const issuerCfg = BANKNOTE_ISSUERS[detectedKey] || BANKNOTE_ISSUERS.SERIE_2017;
      setSeriesKey(detectedKey);
      setSlug(editingItem.id || '');
      setIsManualSlug(true);
      setValueAriary(editingItem.valueAriary || 0);
      setValueFmg(editingItem.valueFmg || 0);
      setTitleFr(editingItem.titleFr || '');
      setTitleMg(editingItem.titleMg || '');
      setImageUrl(editingItem.imageUrl || null);
      setImageUrlVerso(editingItem.imageUrlVerso || null);
      setColorLight(editingItem.colorLight || issuerCfg.colorLightDefault);
      setColorDark(editingItem.colorDark || issuerCfg.colorDarkDefault);
      setPeriod(editingItem.period || issuerCfg.periodDefault);
      setSeriesLabelFr(editingItem.seriesLabelFr || issuerCfg.seriesLabelFrDefault);
      setSeriesLabelMg(editingItem.seriesLabelMg || issuerCfg.seriesLabelMgDefault);
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
      setActiveStep('value');
    } else {
      // Mode création par défaut : Série 2017, coupure 20 000 Ar
      const defaultKey: BanknoteSeriesKey = 'SERIE_2017';
      const defaultIssuer = BANKNOTE_ISSUERS[defaultKey];
      const defaultPresets = BANKNOTE_PRESETS_BY_SERIES[defaultKey] || [];
      const defaultPreset = defaultPresets[0];

      setSeriesKey(defaultKey);
      setIsManualSlug(false);
      setSlug(defaultPreset ? `billet-2017-${defaultPreset.idSuffix}` : 'billet-2017-20000');
      setValueAriary(defaultPreset?.valueAriary ?? 20000);
      setValueFmg(defaultPreset?.valueFmg ?? 100000);
      setTitleFr(defaultPreset?.titleFr ?? 'Port de Toamasina & Valiha');
      setTitleMg(defaultPreset?.titleMg ?? "Seranan'i Toamasina sy Valiha");
      setImageUrl(null);
      setImageUrlVerso(null);
      setColorLight(defaultPreset?.colorLight ?? defaultIssuer.colorLightDefault);
      setColorDark(defaultPreset?.colorDark ?? defaultIssuer.colorDarkDefault);
      setPeriod(defaultIssuer.periodDefault);
      setSeriesLabelFr(defaultIssuer.seriesLabelFrDefault);
      setSeriesLabelMg(defaultIssuer.seriesLabelMgDefault);
      setObverseDescriptionFr(defaultPreset?.obverseDescriptionFr || '');
      setObverseDescriptionMg('');
      setReverseDescriptionFr(defaultPreset?.reverseDescriptionFr || '');
      setReverseDescriptionMg('');
      setSymbolismFr(defaultPreset?.symbolismFr || '');
      setSymbolismMg('');
      setSecurityFeatures(defaultPreset?.securityFeaturesFr || []);
      setIsComingSoon(false);
      setOrderIndex(0);
      setStatus('PUBLISHED');
      setActiveStep('value');
    }
  }, [isOpen, editingItem]);

  // Changer d'institut d'émission / époque
  const handleSelectIssuer = (newKey: BanknoteSeriesKey) => {
    setSeriesKey(newKey);
    const issuerCfg = BANKNOTE_ISSUERS[newKey] || BANKNOTE_ISSUERS.SERIE_2017;
    setPeriod(issuerCfg.periodDefault);
    setSeriesLabelFr(issuerCfg.seriesLabelFrDefault);
    setSeriesLabelMg(issuerCfg.seriesLabelMgDefault);
    setColorLight(issuerCfg.colorLightDefault);
    setColorDark(issuerCfg.colorDarkDefault);

    // Charger les presets de cette série
    const presets = BANKNOTE_PRESETS_BY_SERIES[newKey] || [];
    if (presets.length > 0) {
      applyPreset(presets[0], newKey);
    } else {
      // Ajuster les devises selon le type d'émission
      if (issuerCfg.currencyUnit === 'FRANC_COLONIAL') {
        setValueAriary(0);
        if (!isManualSlug && !editingItem) {
          setSlug(`billet-${newKey.toLowerCase()}-100f`);
        }
      }
    }
  };

  // Appliquer un preset de coupure
  const applyPreset = (preset: BanknotePreset, currentKey = seriesKey) => {
    setValueAriary(preset.valueAriary);
    setValueFmg(preset.valueFmg);
    setColorLight(preset.colorLight);
    setColorDark(preset.colorDark);

    if (!isManualSlug && !editingItem) {
      const prefix = currentKey.toLowerCase().replace('_', '-');
      setSlug(`billet-${prefix}-${preset.idSuffix}`);
    }

    // Auto-remplissage bienveillant des titres et descriptions
    setTitleFr(preset.titleFr);
    setTitleMg(preset.titleMg);
    if (preset.obverseDescriptionFr) setObverseDescriptionFr(preset.obverseDescriptionFr);
    if (preset.reverseDescriptionFr) setReverseDescriptionFr(preset.reverseDescriptionFr);
    if (preset.symbolismFr) setSymbolismFr(preset.symbolismFr);
    if (preset.securityFeaturesFr) setSecurityFeatures(preset.securityFeaturesFr);
  };

  // Synchronisation dynamique des valeurs monétaires
  const handleAriaryChange = (ar: number) => {
    setValueAriary(ar);
    if (currentIssuer.currencyUnit !== 'FRANC_COLONIAL') {
      setValueFmg(ar * 5);
    }
    if (!isManualSlug && !editingItem && ar > 0) {
      const prefix = seriesKey.toLowerCase().replace('_', '-');
      setSlug(`billet-${prefix}-${ar}`);
    }
  };

  const handleFmgChange = (f: number) => {
    setValueFmg(f);
    if (currentIssuer.currencyUnit === 'FRANC_COLONIAL') {
      setValueAriary(0);
      if (!isManualSlug && !editingItem && f > 0) {
        setSlug(`billet-colonial-${f}f`);
      }
    } else {
      const ar = Math.round(f / 5);
      setValueAriary(ar);
      if (!isManualSlug && !editingItem && f > 0) {
        const prefix = seriesKey.toLowerCase().replace('_', '-');
        setSlug(`billet-${prefix}-${f}`);
      }
    }
  };

  // Ajout / Suppression d'éléments de sécurité
  const addSecurityFeature = (feature: string) => {
    const trimmed = feature.trim();
    if (!trimmed || securityFeatures.includes(trimmed)) return;
    setSecurityFeatures((prev) => [...prev, trimmed]);
    setSecurityInput('');
  };

  const removeSecurityFeature = (index: number) => {
    setSecurityFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  // Score de complétion
  const completionState = useMemo(() => {
    const hasImages = Boolean(imageUrl);
    const hasBothFaces = Boolean(imageUrl && imageUrlVerso);
    const hasTexts = Boolean(titleFr.trim() && (obverseDescriptionFr.trim() || reverseDescriptionFr.trim()));

    if (hasImages && hasTexts) {
      return {
        label: hasBothFaces ? 'Fiche Complète (2 faces)' : 'Fiche Complète (Recto seul)',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
        icon: <CheckCircle2 size={13} className="text-emerald-600" />,
        ready: true,
      };
    }
    if (hasImages && isComingSoon) {
      return {
        label: 'Mode « Contenu à venir » Prêt',
        color: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
        icon: <Sparkles size={13} className="text-amber-600" />,
        ready: true,
      };
    }
    if (!hasImages) {
      return {
        label: 'Photo Recto requise',
        color: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800',
        icon: <AlertCircle size={13} className="text-rose-600" />,
        ready: false,
      };
    }
    return {
      label: 'Textes en cours de rédaction',
      color: 'text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800',
      icon: <Sparkles size={13} className="text-sky-600" />,
      ready: true,
    };
  }, [imageUrl, imageUrlVerso, titleFr, obverseDescriptionFr, reverseDescriptionFr, isComingSoon]);

  // Titre affiché calculé si vide
  const effectiveTitleFr = useMemo(() => {
    if (titleFr.trim()) return titleFr.trim();
    if (currentIssuer.currencyUnit === 'FRANC_COLONIAL') {
      return valueFmg > 0 ? `Billet ${valueFmg.toLocaleString('fr-FR')} Francs` : 'Billet Colonial';
    }
    return valueAriary > 0 ? `Billet ${valueAriary.toLocaleString('fr-FR')} Ariary` : 'Billet Malgache';
  }, [titleFr, currentIssuer, valueFmg, valueAriary]);

  // Badges de valeur nominale
  const displayValueBadge = useMemo(() => {
    if (currentIssuer.currencyUnit === 'FRANC_COLONIAL') {
      return `${valueFmg.toLocaleString('fr-FR')} Francs`;
    }
    if (currentIssuer.currencyUnit === 'FMG') {
      return `${valueFmg.toLocaleString('fr-FR')} Fmg`;
    }
    return `${valueAriary.toLocaleString('fr-FR')} Ariary`;
  }, [currentIssuer, valueFmg, valueAriary]);

  const secondaryValueBadge = useMemo(() => {
    if (currentIssuer.currencyUnit === 'FRANC_COLONIAL') return currentIssuer.badge;
    if (currentIssuer.currencyUnit === 'FMG') {
      return valueAriary > 0 ? `Éq. ${valueAriary.toLocaleString('fr-FR')} Ar` : '';
    }
    return valueFmg > 0 ? `Éq. ${valueFmg.toLocaleString('fr-FR')} Fmg` : '';
  }, [currentIssuer, valueAriary, valueFmg]);

  // Liste filtrée des émetteurs selon l'onglet d'époque
  const filteredIssuers = useMemo(() => {
    const list = Object.values(BANKNOTE_ISSUERS).filter(
      (iss) => !['COLONIAL', 'SERIE_FMG', 'SERIE_2003'].includes(iss.key)
    );
    if (selectedMacroCategory === 'ALL') return list;
    return list.filter((iss) => iss.category === selectedMacroCategory);
  }, [selectedMacroCategory]);

  // Presets pour l'émetteur actuel
  const availablePresets = useMemo(() => {
    return BANKNOTE_PRESETS_BY_SERIES[seriesKey] || BANKNOTE_PRESETS_BY_SERIES.SERIE_2017 || [];
  }, [seriesKey]);

  // Soumission finale du formulaire
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Déduction automatique infaillible du slug si non spécifié manuellement
    const autoFallbackSlug = (() => {
      const prefix = seriesKey.toLowerCase().replace('_', '-');
      if (valueAriary > 0) return `billet-${prefix}-${valueAriary}`;
      if (valueFmg > 0) return `billet-${prefix}-${valueFmg}f`;
      if (effectiveTitleFr) return `billet-${prefix}-${slugify(effectiveTitleFr)}`;
      return `billet-${prefix}-${Date.now().toString(36)}`;
    })();

    const finalSlug = slug.trim() || (editingItem?.id ?? '') || autoFallbackSlug;

    if (!isComingSoon && !imageUrl) {
      toast.error('Veuillez ajouter au moins la photo Recto du billet (ou cocher « Contenu à venir »).');
      setActiveStep('images');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<BanknoteItem> = {
        id: finalSlug,
        valueAriary: Number(valueAriary) || 0,
        valueFmg: Number(valueFmg) || 0,
        titleFr: effectiveTitleFr,
        titleMg: titleMg.trim() || (valueAriary > 0 ? `Vola ${valueAriary.toLocaleString('fr-FR')} Ariary` : 'Vola Malagasy'),
        series: seriesKey,
        seriesLabelFr: seriesLabelFr.trim() || currentIssuer.seriesLabelFrDefault,
        seriesLabelMg: seriesLabelMg.trim() || currentIssuer.seriesLabelMgDefault,
        period: period.trim() || currentIssuer.periodDefault,
        colorLight: colorLight || '#1E3A8A',
        colorDark: colorDark || '#2563EB',
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
        toast.success(`Le billet « ${payload.titleFr} » a été créé avec succès.`);
      }

      onClose();
      await onSuccess();
    } catch (err) {
      toast.error(`Erreur lors de la sauvegarde : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeImage = previewFace === 'verso' ? imageUrlVerso || imageUrl : imageUrl;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="5xl"
      title={
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
            style={{ backgroundColor: colorLight }}
          >
            <BanknoteIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-stone-900 dark:text-white">
                {editingItem ? `Modifier : ${editingItem.titleFr}` : 'Ajouter un Billet Malgache'}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${completionState.color}`}
              >
                {completionState.icon}
                <span>{completionState.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-normal">
              Catalogue numismatique officiel • 1917 à nos jours
            </p>
          </div>
        </div>
      }
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2">
            {activeStep !== 'value' && (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 'images') setActiveStep('value');
                  else if (activeStep === 'texts') setActiveStep('images');
                  else if (activeStep === 'advanced') setActiveStep('texts');
                }}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Précédent</span>
              </button>
            )}

            {activeStep !== 'advanced' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeStep === 'value') setActiveStep('images');
                  else if (activeStep === 'images') setActiveStep('texts');
                  else if (activeStep === 'texts') setActiveStep('advanced');
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Étape suivante</span>
                <ArrowRight size={13} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isSubmitting ? 'Enregistrement...' : editingItem ? 'Mettre à jour' : 'Créer le billet'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[460px]">
        {/* ==================================================================== */}
        {/* COLONNE GAUCHE (7/12) : FORMULAIRE PAR ÉTAPES ERGONOMIQUES           */}
        {/* ==================================================================== */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Navigation par onglets d'étapes */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800/70 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveStep('value')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeStep === 'value'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <span>1. Émission & Valeur</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('images')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeStep === 'images'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <span>2. Visuels</span>
              {imageUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('texts')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeStep === 'texts'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <span>3. Textes & Histoire</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep('advanced')}
              className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeStep === 'advanced'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
              title="Options avancées & Publication"
            >
              <span>⚙️</span>
            </button>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* ÉTAPE 1 : ÉMISSION HISTORIQUE & VALEUR FACIALE                     */}
          {/* ------------------------------------------------------------------ */}
          {activeStep === 'value' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Option Mode Rapide : Contenu à venir */}
              <div
                onClick={() => setIsComingSoon(!isComingSoon)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isComingSoon
                    ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isComingSoon
                        ? 'bg-amber-500 border-amber-600 text-white'
                        : 'border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800'
                    }`}
                  >
                    {isComingSoon && <span className="text-[10px] font-bold">✓</span>}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100 block">
                      Mode Express : « Contenu à venir » (Images Seules)
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                      Les descriptions historiques deviennent optionnelles. Idéal si vous numérisez des billets rares.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
                  Optionnel
                </span>
              </div>

              {/* Sélecteur d'Émission Numismatique Officielle */}
              <div className="space-y-2 p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <Building2 size={14} className="text-emerald-600" />
                    <span>1. Institut d&apos;Émission & Époque (Numizon)</span>
                  </span>
                  <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {currentIssuer.numizonId ? `Cat. ${currentIssuer.numizonId}` : ''}
                  </span>
                </div>

                {/* Filtres par macro-époque */}
                <div className="flex flex-wrap gap-1">
                  {MACRO_ERA_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedMacroCategory(tab.key)}
                      className={`px-2 py-1 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                        selectedMacroCategory === tab.key
                          ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white shadow-2xs'
                          : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Menu déroulant enrichi pour sélection précise */}
                <select
                  value={seriesKey}
                  onChange={(e) => handleSelectIssuer(e.target.value as BanknoteSeriesKey)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                >
                  {filteredIssuers.map((iss) => (
                    <option key={iss.key} value={iss.key}>
                      {iss.label} • [{iss.numizonId}] ({iss.currencyUnit === 'FRANC_COLONIAL' ? 'Francs coloniaux' : iss.currencyUnit === 'FMG' ? 'FMG & Ariary' : 'Ariary MGA'})
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-stone-500 dark:text-stone-400 italic leading-relaxed pt-0.5">
                  {currentIssuer.description}
                </p>
              </div>

              {/* Sélection rapide des coupures prédéfinies pour cette émission */}
              <div className="space-y-2 p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>2. Coupures Connues pour cette Émission</span>
                  </span>
                  <span className="text-[10.5px] text-stone-500">1 clic = pré-rempli</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {availablePresets.map((preset) => {
                    const isCurrent =
                      currentIssuer.currencyUnit === 'FRANC_COLONIAL'
                        ? valueFmg === preset.valueFmg
                        : valueAriary === preset.valueAriary;

                    return (
                      <button
                        key={preset.idSuffix}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isCurrent
                            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs scale-102'
                            : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: preset.colorLight }}
                        />
                        <span>{preset.chipLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Saisie personnalisée */}
                <div className="pt-2 border-t border-stone-200 dark:border-stone-700/60 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentIssuer.currencyUnit === 'FRANC_COLONIAL' ? (
                    <div className="md:col-span-2">
                      <Field
                        label="Valeur faciale en Francs coloniaux"
                        required
                        hint="Montant officiel imprimé sur le billet (ex: 50, 100, 500, 1000)"
                      >
                        <Input
                          type="number"
                          value={valueFmg || ''}
                          onChange={(e) => handleFmgChange(Number(e.target.value) || 0)}
                          placeholder="ex: 100"
                        />
                      </Field>
                    </div>
                  ) : currentIssuer.currencyUnit === 'FMG' ? (
                    <>
                      <Field
                        label="Valeur en Francs Malgaches (FMG)"
                        required
                        hint="Montant officiel imprimé (ex: 1000, 5000, 10000, 25000)"
                      >
                        <Input
                          type="number"
                          value={valueFmg || ''}
                          onChange={(e) => handleFmgChange(Number(e.target.value) || 0)}
                          placeholder="ex: 5000"
                        />
                      </Field>
                      <Field
                        label="Équivalence en Ariary (FMG ÷ 5)"
                        hint="Synchronisé automatiquement (1 Ar = 5 FMG)"
                      >
                        <Input
                          type="number"
                          value={valueAriary || ''}
                          onChange={(e) => handleAriaryChange(Number(e.target.value) || 0)}
                          placeholder="ex: 1000"
                        />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field
                        label="Valeur en Ariary (MGA)"
                        required
                        hint="Montant officiel (ex: 100, 500, 1000, 2000, 5000, 10000, 20000)"
                      >
                        <Input
                          type="number"
                          value={valueAriary || ''}
                          onChange={(e) => handleAriaryChange(Number(e.target.value) || 0)}
                          placeholder="ex: 20000"
                        />
                      </Field>
                      <Field
                        label="Équivalence en FMG (Ariary × 5)"
                        hint="Calculé automatiquement pour mémoire numismatique"
                      >
                        <Input
                          type="number"
                          value={valueFmg || ''}
                          onChange={(e) => handleFmgChange(Number(e.target.value) || 0)}
                          placeholder="ex: 100000"
                        />
                      </Field>
                    </>
                  )}
                </div>
              </div>

              {/* Titre descriptif */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <Field
                  label={isComingSoon ? 'Titre descriptif FR (Optionnel)' : 'Titre descriptif FR'}
                  required={!isComingSoon}
                  hint="Sujet ou monument représenté sur le billet"
                >
                  <Input
                    value={titleFr}
                    onChange={(e) => setTitleFr(e.target.value)}
                    placeholder={effectiveTitleFr}
                  />
                </Field>
                <Field
                  label="Titre descriptif MG"
                  hint="Dénomination en malagasy"
                >
                  <Input
                    value={titleMg}
                    onChange={(e) => setTitleMg(e.target.value)}
                    placeholder="Seranan'i Toamasina sy Valiha"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* ÉTAPE 2 : VISUELS & COULEURS                                       */}
          {/* ------------------------------------------------------------------ */}
          {activeStep === 'images' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>Face Recto (Avant)</span>
                      {!isComingSoon && <span className="text-rose-500">*</span>}
                    </span>
                    {imageUrl && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Téléversé</span>
                      </span>
                    )}
                  </div>
                  <ImageUploadDropzone
                    value={imageUrl}
                    onChange={(url) => {
                      setImageUrl(url);
                      setPreviewFace('recto');
                    }}
                    uploadEndpoint="/admin/history/upload-image"
                    subfolder="banknotes"
                  />
                </div>

                <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>Face Verso (Arrière)</span>
                      <span className="text-[10px] font-normal text-stone-400">(Recommandé)</span>
                    </span>
                    {imageUrlVerso && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Téléversé</span>
                      </span>
                    )}
                  </div>
                  <ImageUploadDropzone
                    value={imageUrlVerso}
                    onChange={(url) => {
                      setImageUrlVerso(url);
                      setPreviewFace('verso');
                    }}
                    uploadEndpoint="/admin/history/upload-image"
                    subfolder="banknotes"
                  />
                </div>
              </div>

              {/* Palette de couleurs de fond */}
              <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Palette size={14} className="text-emerald-600" />
                    <span>Teinte Dominante du Billet</span>
                  </span>
                  <span className="text-[11px] text-stone-500">Ambiance visuelle</span>
                </div>

                {/* Chips de palettes courantes */}
                <div className="flex flex-wrap gap-1.5">
                  {BANKNOTE_COLOR_PALETTES.map((pal) => (
                    <button
                      key={pal.name}
                      type="button"
                      onClick={() => {
                        setColorLight(pal.light);
                        setColorDark(pal.dark);
                      }}
                      className="px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 bg-white dark:bg-stone-900 hover:border-stone-400 cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.light }} />
                      <span>{pal.name.split(' (')[0]}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Field label="Couleur Principale (Fond)">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorLight}
                        onChange={(e) => setColorLight(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer"
                      />
                      <Input
                        value={colorLight}
                        onChange={(e) => setColorLight(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </Field>
                  <Field label="Couleur d'Accent">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorDark}
                        onChange={(e) => setColorDark(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer"
                      />
                      <Input
                        value={colorDark}
                        onChange={(e) => setColorDark(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* ÉTAPE 3 : TEXTES, RÉCIT & SÉCURITÉ                                 */}
          {/* ------------------------------------------------------------------ */}
          {activeStep === 'texts' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Sélecteur de langue */}
              <div className="flex items-center justify-between p-2 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Languages size={15} />
                  <span>Langue de rédaction :</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setContentLang('FR')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      contentLang === 'FR'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentLang('MG')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      contentLang === 'MG'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    🇲🇬 Malagasy
                  </button>
                </div>
              </div>

              {contentLang === 'FR' ? (
                <div className="space-y-3">
                  <Field label="Description de la Face Recto (FR)" hint="Éléments centraux, monuments ou personnages">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 text-xs focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={obverseDescriptionFr}
                      onChange={(e) => setObverseDescriptionFr(e.target.value)}
                      placeholder="ex: Vue panoramique du Rova d'Antananarivo ou scène de moisson..."
                    />
                  </Field>

                  <Field label="Description de la Face Verso (FR)" hint="Scène ou symboles représentés au dos">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 text-xs focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={reverseDescriptionFr}
                      onChange={(e) => setReverseDescriptionFr(e.target.value)}
                      placeholder="ex: Valiha traditionnelle malgache et fleurs de vanille..."
                    />
                  </Field>

                  <Field label="Portée Symbolique & Message Culturel (FR)">
                    <Input
                      value={symbolismFr}
                      onChange={(e) => setSymbolismFr(e.target.value)}
                      placeholder="ex: Souveraineté nationale et valorisation de la femme rurale"
                    />
                  </Field>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Famaritana ny Lamosina Recto (MG)" hint="Lohahevitra sy sary lehibe eo aloha">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 text-xs focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={obverseDescriptionMg}
                      onChange={(e) => setObverseDescriptionMg(e.target.value)}
                      placeholder="ex: Ny Rovan'i Manjakamiadana na ny fambolena vary..."
                    />
                  </Field>

                  <Field label="Famaritana ny Lamosina Verso (MG)" hint="Sary sy endrika ao aoriana">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 text-xs focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={reverseDescriptionMg}
                      onChange={(e) => setReverseDescriptionMg(e.target.value)}
                      placeholder="ex: Valiha malagasy nentim-paharazana sy voninkazo vanila..."
                    />
                  </Field>

                  <Field label="Hevitra sy Lanjan'ny Tandindona (MG)">
                    <Input
                      value={symbolismMg}
                      onChange={(e) => setSymbolismMg(e.target.value)}
                      placeholder="ex: Fandriampahalemana sy fiandrianam-pirenena"
                    />
                  </Field>
                </div>
              )}

              {/* Éléments de sécurité interactifs */}
              <div className="p-3 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Dispositifs de Sécurité Numismatique (Anti-contrefaçon)</span>
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {SECURITY_FEATURE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addSecurityFeature(tag)}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        securityFeatures.includes(tag)
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400'
                      }`}
                    >
                      <span>+</span>
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Ajouter un autre élément de sécurité personnalisé..."
                    value={securityInput}
                    onChange={(e) => setSecurityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSecurityFeature(securityInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addSecurityFeature(securityInput)}
                    className="px-3 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Ajouter
                  </button>
                </div>

                {securityFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {securityFeatures.map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-[11px] text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>🛡️ {feat}</span>
                        <button
                          type="button"
                          onClick={() => removeSecurityFeature(idx)}
                          className="text-stone-400 hover:text-rose-500 cursor-pointer"
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

          {/* ------------------------------------------------------------------ */}
          {/* ÉTAPE 4 : OPTIONS AVANCÉES & PUBLICATION                            */}
          {/* ------------------------------------------------------------------ */}
          {activeStep === 'advanced' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 bg-stone-50 dark:bg-stone-850 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
                  Identifiant Technique (Slug)
                </span>

                {!editingItem ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Input
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value);
                          setIsManualSlug(true);
                        }}
                        placeholder="billet-2017-20000"
                        className="font-mono text-xs"
                      />
                      {isManualSlug && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsManualSlug(false);
                            const preset = availablePresets[0];
                            if (preset) applyPreset(preset);
                          }}
                          className="px-2.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 underline cursor-pointer shrink-0"
                        >
                          Rétablir auto
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Généré automatiquement selon l&apos;émission et la valeur. Modifiable si besoin.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-mono text-stone-600 dark:text-stone-300">
                    <Lock size={13} className="text-stone-400" />
                    <span>{editingItem.id} (Identifiant immuable en édition)</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Statut de Publication">
                  <select
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                  >
                    <option value="PUBLISHED">Publié (Visible dans l&apos;app)</option>
                    <option value="DRAFT">Brouillon (Non visible)</option>
                    <option value="ARCHIVED">Archivé</option>
                  </select>
                </Field>

                <Field label="Ordre d'Affichage (Index)">
                  <Input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value) || 0)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Période de Circulation (ex: 1964 - 1970)">
                  <Input
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="1964 - 1970"
                  />
                </Field>
                <Field label="Libellé Officiel de Série (FR)">
                  <Input
                    value={seriesLabelFr}
                    onChange={(e) => setSeriesLabelFr(e.target.value)}
                    placeholder={currentIssuer.seriesLabelFrDefault}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* COLONNE DROITE (5/12) : LIVE PREVIEW DU BILLET (Temps Réel)          */}
        {/* ==================================================================== */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-stone-50 dark:bg-stone-950/60 rounded-2xl border border-stone-200 dark:border-stone-800/80 space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Eye size={14} className="text-emerald-600" />
                <span>Aperçu en Direct</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewFace((f) => (f === 'recto' ? 'verso' : 'recto'))}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1 shadow-2xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} className={previewFace === 'verso' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                <span>{previewFace === 'recto' ? 'Voir Verso' : 'Voir Recto'}</span>
              </button>
            </div>

            {/* Carte Mockup réaliste du Billet */}
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-md bg-stone-900 aspect-16/10 flex flex-col justify-between group">
              {/* Image ou Placeholder */}
              {activeImage ? (
                <img
                  src={resolveMediaUrl(activeImage)}
                  alt={effectiveTitleFr}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                />
              ) : (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
                  style={{
                    background: `linear-gradient(135deg, ${colorLight}33 0%, ${colorDark}66 100%)`,
                  }}
                >
                  <BanknoteIcon size={44} className="text-white/40 mb-2" />
                  <span className="text-xs text-white/80 font-bold">
                    {previewFace === 'recto' ? 'Photo Face Recto en attente' : 'Photo Face Verso en attente'}
                  </span>
                  <span className="text-[10px] text-white/50 mt-0.5">
                    Téléversez le visuel à l&apos;étape 2
                  </span>
                </div>
              )}

              {/* Voile protecteur */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/60 pointer-events-none" />

              {/* Header du Mockup */}
              <div className="relative z-10 p-3 flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold">
                    {previewFace === 'recto' ? 'Face Recto (Avant)' : 'Face Verso (Dos)'}
                  </span>
                  {isComingSoon && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-white text-[9.5px] font-bold shadow-xs">
                      À venir
                    </span>
                  )}
                </div>

                {/* Badge de Valeur */}
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className="px-2.5 py-1 rounded-lg text-white font-bold text-xs shadow-sm"
                    style={{ backgroundColor: colorLight }}
                  >
                    {displayValueBadge}
                  </span>
                  {secondaryValueBadge && (
                    <span className="px-1.5 py-0.2 rounded bg-black/75 text-stone-300 text-[9.5px] font-semibold">
                      {secondaryValueBadge}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer du Mockup */}
              <div className="relative z-10 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-semibold">
                  <span>{currentIssuer.shortLabel}</span>
                  <span>•</span>
                  <span>{period}</span>
                </div>
                <h4 className="text-white font-bold text-sm line-clamp-1 leading-snug">
                  {effectiveTitleFr}
                </h4>
                {titleMg && (
                  <p className="text-stone-300 text-[11px] font-medium line-clamp-1">
                    🇲🇬 {titleMg}
                  </p>
                )}
              </div>
            </div>

            {/* Fiche récapitulative sous le billet */}
            <div className="mt-3 p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-500">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {currentIssuer.institutionFr || currentIssuer.label}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {currentIssuer.numizonId ? `Cat. ${currentIssuer.numizonId}` : 'Officiel'}
                </span>
              </div>
              <p className="text-[11.5px] text-stone-600 dark:text-stone-400 line-clamp-2 italic">
                {previewFace === 'recto'
                  ? obverseDescriptionFr || 'Aucune description recto saisie.'
                  : reverseDescriptionFr || 'Aucune description verso saisie.'}
              </p>

              {securityFeatures.length > 0 && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">Sécurité :</span>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {securityFeatures.length} dispositif{securityFeatures.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Encart Astuce UX */}
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <HelpCircle size={15} className="text-emerald-600 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Numismatique :</strong> {currentIssuer.tip}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
