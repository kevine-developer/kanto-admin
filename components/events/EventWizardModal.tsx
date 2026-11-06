'use client';

/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  Users,
  Gift,
  Globe,
  MapPin,
  Clock,
  Upload,
  Image as ImageIcon,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  DollarSign,
  Sliders,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  EventAdminItem,
  CreateEventInput,
  EventCategory,
  EventParticipationType,
  EventRewardType,
  EventLanguageMode,
  EventSectionsConfig,
  eventsAdminService,
} from '@/services/events.service';
import { useToast } from '@/lib/hooks/useToast';

interface EventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent: EventAdminItem | null;
  onSaved: () => void;
}

const CATEGORIES_CONFIG: {
  key: EventCategory;
  labelFr: string;
  labelMg: string;
  desc: string;
  icon: string;
}[] = [
  {
    key: 'CULTURE',
    labelFr: 'Culture & Patrimoine',
    labelMg: 'Kolontsaina & Rihitra',
    desc: 'Conférences, histoire, traditions malgaches et patrimoine',
    icon: '🏛️',
  },
  {
    key: 'CHALLENGE',
    labelFr: 'Défis & Compétitions',
    labelMg: 'Fanamby & Fifaninanana',
    desc: 'Tournois de quiz, devinettes, jeux de vocabulaire',
    icon: '🏆',
  },
  {
    key: 'REWARD',
    labelFr: 'Concours & Lots',
    labelMg: 'Loka & Valisoa',
    desc: 'Tirages au sort, récompenses exclusives, goodies',
    icon: '🎁',
  },
  {
    key: 'SEASONAL',
    labelFr: 'Fêtes & Saisons',
    labelMg: 'Asaramanitra & Fotoana',
    desc: 'Asaramanitra, Fête de l’Indépendance, nouvel an',
    icon: '🌿',
  },
  {
    key: 'COMMUNITY',
    labelFr: 'Communauté',
    labelMg: 'Fiarahamonina',
    desc: 'Objectifs collectifs de contributions et partage',
    icon: '🤝',
  },
  {
    key: 'SPECIAL',
    labelFr: 'Spécial & VIP',
    labelMg: 'Manokana & VIP',
    desc: 'Événements réservés, avant-premières et VIP',
    icon: '⭐',
  },
];

export function EventWizardModal({
  isOpen,
  onClose,
  editingEvent,
  onSaved,
}: EventWizardModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // État du Wizard (1 à 5)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Configuration langues et sections
  const [formLanguageMode, setFormLanguageMode] = useState<EventLanguageMode>(
    editingEvent?.metadata?.contentConfig?.languageMode || 'both'
  );
  const [enabledSections, setEnabledSections] = useState<EventSectionsConfig>(
    editingEvent?.metadata?.contentConfig?.sections || {
      shortDescription: true,
      rules: false,
      participationConditions: true,
      practicalInfo: true,
      rewards: true,
      gameModule: false,
    }
  );

  const toggleSection = (key: keyof EventSectionsConfig) => {
    setEnabledSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Champs Étape 1 : Présentation
  const [formSlug, setFormSlug] = useState(editingEvent?.slug || '');
  const [formTitleFr, setFormTitleFr] = useState(editingEvent?.titleFr || '');
  const [formTitleMg, setFormTitleMg] = useState(editingEvent?.titleMg || '');
  const [formDescriptionFr, setFormDescriptionFr] = useState(editingEvent?.descriptionFr || '');
  const [formDescriptionMg, setFormDescriptionMg] = useState(editingEvent?.descriptionMg || '');
  const [formCategory, setFormCategory] = useState<EventCategory>(editingEvent?.category || 'CULTURE');

  // Photo de couverture 16:9
  const [formImageUrl, setFormImageUrl] = useState<string>(editingEvent?.imageUrl || '');
  const [formImageFit, setFormImageFit] = useState<'cover' | 'contain'>('cover');

  // Champs Étape 2 : Sections modulaires
  const [formShortDescFr, setFormShortDescFr] = useState(editingEvent?.shortDescFr || '');
  const [formShortDescMg, setFormShortDescMg] = useState(editingEvent?.shortDescMg || '');
  const [formRulesFr, setFormRulesFr] = useState(editingEvent?.rulesFr || '');
  const [formRulesMg, setFormRulesMg] = useState(editingEvent?.rulesMg || '');
  const formGameModuleId =
    typeof editingEvent?.metadata?.gameModuleId === 'string'
      ? editingEvent.metadata.gameModuleId
      : '';

  // Champs Étape 3 : Infos pratiques
  const [formStartDate, setFormStartDate] = useState(() =>
    editingEvent?.startDate
      ? new Date(editingEvent.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [formEndDate, setFormEndDate] = useState(() =>
    editingEvent?.endDate
      ? new Date(editingEvent.endDate).toISOString().slice(0, 16)
      : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [formLocation, setFormLocation] = useState(editingEvent?.location || 'Fampiharana Kanto MG');
  const [formExternalUrl, setFormExternalUrl] = useState(editingEvent?.externalUrl || '');

  // Champs Étape 4 : Participation & Billetterie
  const [formParticipationType, setFormParticipationType] = useState<EventParticipationType>(
    editingEvent?.participationType || 'OPEN'
  );
  const formMinTier = editingEvent?.minTier || 'FREE';
  const [formIsPaid, setFormIsPaid] = useState(Boolean(editingEvent?.isPaid));
  const [formTicketPrice, setFormTicketPrice] = useState(
    editingEvent?.ticketPrice ? String(editingEvent.ticketPrice) : ''
  );
  const [formCurrency, setFormCurrency] = useState(editingEvent?.currency || 'MGA');
  const [formMaxParticipants, setFormMaxParticipants] = useState(
    editingEvent?.maxParticipants ? String(editingEvent.maxParticipants) : ''
  );
  const [formRegistrationDeadline, setFormRegistrationDeadline] = useState(
    editingEvent?.registrationDeadline
      ? new Date(editingEvent.registrationDeadline).toISOString().slice(0, 16)
      : ''
  );
  const [formEnableWaitlist, setFormEnableWaitlist] = useState(Boolean(editingEvent?.enableWaitlist));
  const [formWaitlistCapacity, setFormWaitlistCapacity] = useState(
    editingEvent?.waitlistCapacity ? String(editingEvent.waitlistCapacity) : ''
  );
  const formIsFeatured = Boolean(editingEvent?.isFeatured);

  // Récompenses
  const [formRewards, setFormRewards] = useState<
    {
      rewardType: EventRewardType;
      titleFr: string;
      titleMg: string;
      amount?: number;
      badgeId?: string;
      lotDescription?: string;
      criteria?: string;
    }[]
  >(
    editingEvent?.rewards?.map((r) => ({
      rewardType: r.rewardType,
      titleFr: r.titleFr,
      titleMg: r.titleMg,
      amount: r.amount || undefined,
      badgeId: r.badgeId || undefined,
      lotDescription: r.lotDescription || undefined,
      criteria: r.criteria || 'completion',
    })) || [
      {
        rewardType: 'XP',
        titleFr: 'Bonus d’expérience +150 XP',
        titleMg: 'Traikefa +150 XP',
        amount: 150,
        criteria: 'completion',
      },
    ]
  );

  // ─── Upload Photo 16:9 ───────────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      toast.error('Format non supporté. Veuillez choisir un fichier JPEG, PNG ou WebP.');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
    if (file.size > MAX_SIZE) {
      toast.error('L’image est trop volumineuse (max 5 Mo).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = String(reader.result || '');
      if (!base64Data) return;

      try {
        setIsUploadingImage(true);
        const res = await eventsAdminService.uploadCover(base64Data, file.name);
        setFormImageUrl(res.url);
        toast.success('Photo de couverture 16:9 importée avec succès !');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Échec de l’upload de l’image.';
        toast.error(msg);
      } finally {
        setIsUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Photo retirée. L’image par défaut sera utilisée.');
  };

  // ─── Validation par étape ───────────────────────────────────────────────────
  const validateAndNext = () => {
    const isFr = formLanguageMode === 'fr' || formLanguageMode === 'both';
    const isMg = formLanguageMode === 'mg' || formLanguageMode === 'both';

    if (step === 1) {
      if (isFr && !formTitleFr.trim()) {
        toast.error('Le titre en français est obligatoire.');
        return;
      }
      if (isMg && !formTitleMg.trim()) {
        toast.error('Ny lohateny amin’ny teny malagasy dia tsy maintsy fenoina (Titre MG requis).');
        return;
      }
      if (isFr && !formDescriptionFr.trim()) {
        toast.error('La description en français est obligatoire.');
        return;
      }
      if (isMg && !formDescriptionMg.trim()) {
        toast.error('Ny famaritana amin’ny teny malagasy dia tsy maintsy fenoina (Description MG requise).');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!formStartDate || !formEndDate) {
        toast.error('Les dates de début et de fin sont obligatoires.');
        return;
      }
      if (new Date(formStartDate) >= new Date(formEndDate)) {
        toast.error('La date de fin doit être strictement postérieure à la date de début.');
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      if (formIsPaid && (!formTicketPrice || parseFloat(formTicketPrice) <= 0)) {
        toast.error('Veuillez renseigner un montant de participation valide en Ariary.');
        return;
      }
      setStep(5);
      return;
    }
  };

  // ─── Enregistrement (Brouillon ou Publication) ──────────────────────────────
  const handleFinalSubmit = async (publishImmediately: boolean) => {
    const isFr = formLanguageMode === 'fr' || formLanguageMode === 'both';
    const isMg = formLanguageMode === 'mg' || formLanguageMode === 'both';

    try {
      setIsSubmitting(true);

      const titleFrPayload = isFr ? formTitleFr.trim() : formTitleMg.trim();
      const titleMgPayload = isMg ? formTitleMg.trim() : formTitleFr.trim();
      const descFrPayload = isFr ? formDescriptionFr.trim() : formDescriptionMg.trim();
      const descMgPayload = isMg ? formDescriptionMg.trim() : formDescriptionFr.trim();

      const payload: CreateEventInput = {
        titleFr: titleFrPayload,
        titleMg: titleMgPayload,
        imageUrl: formImageUrl.trim() || undefined,
        shortDescFr:
          enabledSections.shortDescription && isFr
            ? formShortDescFr.trim() || undefined
            : undefined,
        shortDescMg:
          enabledSections.shortDescription && isMg
            ? formShortDescMg.trim() || undefined
            : undefined,
        descriptionFr: descFrPayload,
        descriptionMg: descMgPayload,
        category: formCategory,
        participationType: enabledSections.participationConditions
          ? formParticipationType
          : 'OPEN',
        minTier: enabledSections.participationConditions ? formMinTier : 'FREE',
        isPaid: formIsPaid,
        ticketPrice: formIsPaid && formTicketPrice ? parseFloat(formTicketPrice) : undefined,
        currency: formCurrency || 'MGA',
        enableWaitlist: formEnableWaitlist,
        waitlistCapacity:
          formEnableWaitlist && formWaitlistCapacity
            ? parseInt(formWaitlistCapacity, 10)
            : undefined,
        location: enabledSections.practicalInfo ? formLocation.trim() || undefined : undefined,
        externalUrl: enabledSections.practicalInfo ? formExternalUrl.trim() || undefined : undefined,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        registrationDeadline:
          enabledSections.participationConditions && formRegistrationDeadline
            ? new Date(formRegistrationDeadline).toISOString()
            : undefined,
        maxParticipants:
          enabledSections.participationConditions && formMaxParticipants
            ? parseInt(formMaxParticipants, 10)
            : undefined,
        isFeatured: formIsFeatured,
        rulesFr: enabledSections.rules && isFr ? formRulesFr.trim() || undefined : undefined,
        rulesMg: enabledSections.rules && isMg ? formRulesMg.trim() || undefined : undefined,
        metadata: {
          contentConfig: {
            languageMode: formLanguageMode,
            languages: formLanguageMode === 'both' ? ['mg', 'fr'] : [formLanguageMode],
            sections: enabledSections,
          },
          imageFit: formImageFit,
          ...(enabledSections.gameModule && formGameModuleId
            ? { gameModuleId: formGameModuleId }
            : {}),
        },
      };

      if (enabledSections.rewards && formRewards.length > 0) {
        payload.rewards = formRewards.map((r) => ({
          rewardType: r.rewardType,
          titleFr: isFr
            ? r.titleFr.trim() || r.titleMg.trim() || 'Récompense'
            : r.titleMg.trim() || 'Loka',
          titleMg: isMg
            ? r.titleMg.trim() || r.titleFr.trim() || 'Loka'
            : r.titleFr.trim() || 'Récompense',
          amount: r.amount,
          badgeId: r.badgeId,
          lotDescription: r.lotDescription,
          criteria: r.criteria || 'completion',
        }));
      }

      const eventDisplayName = titleFrPayload || titleMgPayload || 'Événement';

      if (editingEvent) {
        const updated = await eventsAdminService.updateEvent(editingEvent.id, payload);
        if (publishImmediately && updated.status !== 'PUBLISHED') {
          await eventsAdminService.updateStatus(updated.id, 'PUBLISHED');
          toast.success(`Événement "${eventDisplayName}" mis à jour et publié !`);
        } else {
          toast.success(`Événement "${eventDisplayName}" mis à jour avec succès.`);
        }
      } else {
        payload.slug = formSlug.trim() || undefined;
        const created = await eventsAdminService.createEvent(payload);
        if (publishImmediately) {
          await eventsAdminService.updateStatus(created.id, 'PUBLISHED');
          toast.success(`Événement "${eventDisplayName}" créé et publié avec succès !`);
        } else {
          toast.success(`Événement "${eventDisplayName}" enregistré en brouillon.`);
        }
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ─── En-tête avec Stepper ────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">
                {editingEvent
                  ? `Modifier : ${editingEvent.titleFr || editingEvent.titleMg}`
                  : 'Créer un nouvel événement'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Étape {step} sur 5 —{' '}
                {step === 1 && 'Présentation & Photo 16:9'}
                {step === 2 && 'Langues & Contenus modulaires'}
                {step === 3 && 'Informations pratiques'}
                {step === 4 && 'Participation & Billetterie'}
                {step === 5 && 'Vérification & Publication'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--card-hover)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stepper horizontal */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            {[
              { num: 1, title: 'Présentation' },
              { num: 2, title: 'Langues' },
              { num: 3, title: 'Pratique' },
              { num: 4, title: 'Participation' },
              { num: 5, title: 'Vérification' },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isPassed = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num < step) setStep(s.num as 1 | 2 | 3 | 4 | 5);
                  }}
                  disabled={s.num > step}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-left transition-all ${
                    isCurrent
                      ? 'bg-[var(--accent)] text-white shadow-xs font-bold'
                      : isPassed
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold cursor-pointer'
                      : 'bg-[var(--background)] text-[var(--text-muted)] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                      isCurrent
                        ? 'bg-white text-[var(--accent)] font-bold'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    {isPassed ? <Check size={12} /> : s.num}
                  </span>
                  <span className="text-xs hidden md:inline truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Contenu scrollable du Wizard ───────────────────────────────────── */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ÉTAPE 1 : PRÉSENTATION & PHOTO DE COUVERTURE 16:9                   */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Photo de couverture 16:9 */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-[var(--accent)]" />
                    Photo de présentation / Couverture
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Ratio recommandé : 16:9 • 1200 × 675 px • Max 5 Mo
                  </span>
                </div>

                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-zinc-900 group">
                  {formImageUrl ? (
                    <>
                      <img
                        src={formImageUrl}
                        alt="Aperçu couverture"
                        className={`w-full h-full ${
                          formImageFit === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/90 text-zinc-900 text-xs font-bold hover:bg-white flex items-center gap-1.5 shadow-md"
                        >
                          <RefreshCw size={12} />
                          <span>Remplacer</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-md"
                        >
                          <Trash2 size={12} />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#4A6741]/20 via-[#C58B38]/10 to-zinc-900">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-2">
                        <Upload size={22} />
                      </div>
                      <p className="text-xs font-bold text-white">
                        Aucune photo sélectionnée
                      </p>
                      <p className="text-[11px] text-zinc-300 max-w-sm mt-0.5 mb-3">
                        Une image culturelle d’ambiance malgache sera utilisée par défaut. Cliquez ci-dessous pour importer une affiche officielle.
                      </p>
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-[var(--accent)] hover:opacity-90 text-white transition-all shadow-sm"
                      >
                        {isUploadingImage ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Upload size={13} />
                        )}
                        <span>Choisir une photo (JPEG, PNG, WebP)</span>
                      </button>
                    </div>
                  )}

                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-2">
                      <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
                      <span className="text-xs font-semibold">Téléchargement et optimisation de l’image...</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {formImageUrl && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-[var(--text-muted)]">Mode d’ajustement :</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormImageFit('cover')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          formImageFit === 'cover'
                            ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
                            : 'border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        Remplir tout le cadre (Cover)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImageFit('contain')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          formImageFit === 'contain'
                            ? 'bg-[var(--foreground)] text-[var(--background)] border-transparent'
                            : 'border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                      >
                        Aperçu entier (Contain)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Titre de l'événement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formLanguageMode === 'fr' || formLanguageMode === 'both') && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      🇫🇷 Titre de l’événement (Français) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitleFr}
                      onChange={(e) => setFormTitleFr(e.target.value)}
                      placeholder="Ex: Soirée de Contes et Kabary 2026"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                )}

                {(formLanguageMode === 'mg' || formLanguageMode === 'both') && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      🇲🇬 Lohatenin’ny hetsika (Malgache) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitleMg}
                      onChange={(e) => setFormTitleMg(e.target.value)}
                      placeholder="Ex: Alina Fampisehoana Angano sy Kabary 2026"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                )}
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                  Catégorie & Thématique culturelle
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {CATEGORIES_CONFIG.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setFormCategory(cat.key)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formCategory === cat.key
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/30'
                          : 'border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-xs font-bold text-[var(--foreground)]">
                          {cat.labelFr}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">
                        {cat.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                {(formLanguageMode === 'fr' || formLanguageMode === 'both') && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      🇫🇷 Description complète (Français) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={formDescriptionFr}
                      onChange={(e) => setFormDescriptionFr(e.target.value)}
                      placeholder="Présentation détaillée du programme, des intervenants, du contexte culturel..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                )}

                {(formLanguageMode === 'mg' || formLanguageMode === 'both') && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      🇲🇬 Famaritana feno (Malgache) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={formDescriptionMg}
                      onChange={(e) => setFormDescriptionMg(e.target.value)}
                      placeholder="Fampahafantarana feno ny fandaharana, ny tantara, ny antony hanatanterahana ny hetsika..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ÉTAPE 2 : LANGUES ET SECTIONS MODULAIRES                             */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Choix des langues */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Globe size={14} className="text-[var(--accent)]" />
                  Langue(s) officielle(s) de communication
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormLanguageMode('both')}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                      formLanguageMode === 'both'
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)] ring-1 ring-[var(--accent)]/30'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)]'
                    }`}
                  >
                    🌍 Bilingue (Malgache + Français)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLanguageMode('mg')}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                      formLanguageMode === 'mg'
                        ? 'border-emerald-500 bg-emerald-500/15 text-[var(--foreground)] ring-1 ring-emerald-500/30'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)]'
                    }`}
                  >
                    🇲🇬 Malgache uniquement
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLanguageMode('fr')}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all ${
                      formLanguageMode === 'fr'
                        ? 'border-blue-500 bg-blue-500/15 text-[var(--foreground)] ring-1 ring-blue-500/30'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)]'
                    }`}
                  >
                    🇫🇷 Français uniquement
                  </button>
                </div>
              </div>

              {/* Sections activables */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} className="text-[var(--accent)]" />
                  Sections de contenu actives
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Activez ou désactivez les blocs d’information selon le format de votre événement. Vos données saisies sont préservées.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { key: 'shortDescription', label: 'Accroche / Description courte', icon: '📝' },
                    { key: 'rules', label: 'Règlement & Consignes', icon: '📜' },
                    { key: 'practicalInfo', label: 'Informations pratiques', icon: '📍' },
                    { key: 'participationConditions', label: 'Inscriptions & Places', icon: '👥' },
                    { key: 'rewards', label: 'Récompenses & Loka', icon: '🎁' },
                    { key: 'gameModule', label: 'Module de jeu Kanto', icon: '🎮' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSection(s.key as keyof EventSectionsConfig)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        enabledSections[s.key as keyof EventSectionsConfig]
                          ? 'border-[var(--accent)] bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                          : 'border-[var(--border)] bg-[var(--card)]/50 text-[var(--text-muted)] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{s.icon}</span>
                        <span className="text-xs font-semibold">{s.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          enabledSections[s.key as keyof EventSectionsConfig]
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--border)] text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description courte (si activée) */}
              {enabledSections.shortDescription && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  {(formLanguageMode === 'fr' || formLanguageMode === 'both') && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        🇫🇷 Description courte (carte d’aperçu)
                      </label>
                      <input
                        type="text"
                        value={formShortDescFr}
                        onChange={(e) => setFormShortDescFr(e.target.value)}
                        placeholder="Une phrase d'accroche pour la liste..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                      />
                    </div>
                  )}
                  {(formLanguageMode === 'mg' || formLanguageMode === 'both') && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        🇲🇬 Famaritana fohy (sarina hetsika)
                      </label>
                      <input
                        type="text"
                        value={formShortDescMg}
                        onChange={(e) => setFormShortDescMg(e.target.value)}
                        placeholder="Fehezanteny fohy manaitra..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Règlement / Consignes (si activé) */}
              {enabledSections.rules && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]">
                  {(formLanguageMode === 'fr' || formLanguageMode === 'both') && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        🇫🇷 Règlement officiel / Consignes
                      </label>
                      <textarea
                        rows={3}
                        value={formRulesFr}
                        onChange={(e) => setFormRulesFr(e.target.value)}
                        placeholder="Conditions d’éligibilité, critères du jury..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                      />
                    </div>
                  )}
                  {(formLanguageMode === 'mg' || formLanguageMode === 'both') && (
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        🇲🇬 Fitsipika sy torolalana
                      </label>
                      <textarea
                        rows={3}
                        value={formRulesMg}
                        onChange={(e) => setFormRulesMg(e.target.value)}
                        placeholder="Fepetra takiana, fitsipika..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ÉTAPE 3 : INFORMATIONS PRATIQUES                                     */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Dates et Horaires */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-[var(--accent)]" />
                  Dates et Horaires
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Date et heure de début <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Date et heure de fin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                    />
                  </div>
                </div>
              </div>

              {/* Lieu / Format */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-[var(--accent)]" />
                  Format et Localisation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Lieu physique ou Virtuel
                    </label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="Ex: Palais de la Reine / Antananarivo ou En ligne"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Lien externe (Billetterie, Visioconférence, Page officielle)
                    </label>
                    <input
                      type="url"
                      value={formExternalUrl}
                      onChange={(e) => setFormExternalUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                    />
                  </div>
                </div>
              </div>

              {/* Slug URL */}
              {!editingEvent && (
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2">
                  <label className="block text-xs font-semibold text-[var(--foreground)]">
                    Identifiant d’accès URL personnalisé (Slug optionnel)
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="Laissez vide pour générer automatiquement depuis le titre"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                  />
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ÉTAPE 4 : PARTICIPATION, BILLETTERIE & LISTE D'ATTENTE              */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Tarification Gratuit / Payant */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={14} className="text-[var(--accent)]" />
                  Tarification & Accès
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormIsPaid(false)}
                    className={`py-3 px-4 rounded-xl border text-center transition-all ${
                      !formIsPaid
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold ring-1 ring-emerald-500/30'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <span className="text-sm block">🎉 Gratuit</span>
                    <span className="text-[11px] font-normal">Accès 100% ouvert sans frais</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormIsPaid(true)}
                    className={`py-3 px-4 rounded-xl border text-center transition-all ${
                      formIsPaid
                        ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)] font-bold ring-1 ring-[var(--accent)]/30'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)]'
                    }`}
                  >
                    <span className="text-sm block">🎟️ Payant / Billetterie</span>
                    <span className="text-[11px] font-normal">Participation avec tarif fixé</span>
                  </button>
                </div>

                {formIsPaid && (
                  <div className="pt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        Montant du billet <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={formTicketPrice}
                        onChange={(e) => setFormTicketPrice(e.target.value)}
                        placeholder="Ex: 15000"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        Devise
                      </label>
                      <select
                        value={formCurrency}
                        onChange={(e) => setFormCurrency(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                      >
                        <option value="MGA">Ariary (MGA)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Capacité et Liste d'attente */}
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-[var(--accent)]" />
                  Jauge & Inscriptions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Type d’inscription
                    </label>
                    <select
                      value={formParticipationType}
                      onChange={(e) =>
                        setFormParticipationType(e.target.value as EventParticipationType)
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                    >
                      <option value="OPEN">Accès libre sans réservation</option>
                      <option value="REGISTRATION_REQUIRED">Inscription préalable requise</option>
                      <option value="EXCLUSIVE_TIER">Réservé VIP / Premium</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Places max (vide = illimité)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formMaxParticipants}
                      onChange={(e) => setFormMaxParticipants(e.target.value)}
                      placeholder="Ex: 100"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Clôture des inscriptions
                    </label>
                    <input
                      type="datetime-local"
                      value={formRegistrationDeadline}
                      onChange={(e) => setFormRegistrationDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                    />
                  </div>
                </div>

                {/* Option Liste d'attente automatique */}
                <div className="pt-2 border-t border-[var(--border)] space-y-2">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-[var(--foreground)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formEnableWaitlist}
                      onChange={(e) => setFormEnableWaitlist(e.target.checked)}
                      className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span>Activer la file d’attente automatique quand les places sont épuisées</span>
                  </label>
                  <p className="text-[11px] text-[var(--text-muted)] pl-6">
                    Lorsqu’un participant se désiste ou qu’un administrateur annule une place, le premier candidat en attente est automatiquement promu et notifié sans perte de temps.
                  </p>

                  {formEnableWaitlist && (
                    <div className="pl-6 pt-1 max-w-xs">
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                        Capacité max de la file d’attente (vide = illimitée)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formWaitlistCapacity}
                        onChange={(e) => setFormWaitlistCapacity(e.target.value)}
                        placeholder="Ex: 25"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--card)]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Récompenses & Loka */}
              {enabledSections.rewards && (
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                      <Gift size={14} className="text-[var(--accent)]" />
                      Récompenses & Loka attribués
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormRewards((prev) => [
                          ...prev,
                          {
                            rewardType: 'COINS',
                            titleFr: 'Pièces Kanto +50',
                            titleMg: 'Vola Kanto +50',
                            amount: 50,
                            criteria: 'completion',
                          },
                        ])
                      }
                      className="text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      + Ajouter une récompense
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formRewards.map((r, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] grid grid-cols-1 sm:grid-cols-3 gap-2 items-center"
                      >
                        <select
                          value={r.rewardType}
                          onChange={(e) => {
                            const val = e.target.value as EventRewardType;
                            setFormRewards((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, rewardType: val } : item))
                            );
                          }}
                          className="px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--background)]"
                        >
                          <option value="XP">Points XP</option>
                          <option value="COINS">Pièces Vola</option>
                          <option value="BADGE">Badge culturel officiel</option>
                          <option value="PHYSICAL_LOT">Lot physique</option>
                        </select>

                        <input
                          type="text"
                          value={r.titleFr}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormRewards((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, titleFr: val } : item))
                            );
                          }}
                          placeholder="Intitulé (ex: +150 XP)"
                          className="px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--background)]"
                        />

                        <div className="flex items-center gap-2">
                          {(r.rewardType === 'XP' || r.rewardType === 'COINS') && (
                            <input
                              type="number"
                              min={1}
                              value={r.amount || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setFormRewards((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, amount: val } : item))
                                );
                              }}
                              placeholder="Montant"
                              className="w-24 px-2 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--background)]"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setFormRewards((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* ÉTAPE 5 : VÉRIFICATION ET PUBLICATION                              */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2">
                <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} className="text-[var(--accent)]" />
                  Aperçu fidèle de la fiche événement
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Vérifiez le rendu tel qu&apos;il apparaîtra sur l’application mobile et le web avant d&apos;enregistrer.
                </p>
              </div>

              {/* Carte Aperçu Kanto MG */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden max-w-2xl mx-auto">
                {/* Image 16:9 */}
                <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                  {formImageUrl ? (
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className={`w-full h-full ${
                        formImageFit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#4A6741] to-[#C58B38]">
                      <span className="text-3xl mb-1">🇲🇬</span>
                      <span className="text-sm font-bold text-white tracking-wide">
                        Kanto MG — Événement Officiel
                      </span>
                    </div>
                  )}

                  {/* Badge Date flottant */}
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white shadow-lg text-center">
                    <div className="text-sm font-black text-amber-400">
                      {new Date(formStartDate).getDate()}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-zinc-300">
                      {new Date(formStartDate).toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>

                  {/* Badge Gratuit ou Prix */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-xs font-bold text-white shadow-md">
                    {formIsPaid ? `${formTicketPrice || 0} ${formCurrency}` : 'Gratuit'}
                  </div>
                </div>

                {/* Détails de la carte */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-[var(--accent)]/15 text-[var(--foreground)] border border-[var(--accent)]/30 text-[10px]">
                      {formCategory}
                    </span>
                    <span>
                      {formEnableWaitlist
                        ? 'Liste d’attente activée'
                        : formMaxParticipants
                        ? `${formMaxParticipants} places max`
                        : 'Accès illimité'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    {formTitleFr || formTitleMg}
                  </h3>
                  {formTitleMg && formTitleFr && (
                    <p className="text-xs text-[var(--text-muted)] italic">
                      🇲🇬 {formTitleMg}
                    </p>
                  )}

                  <p className="text-xs text-[var(--foreground)]/80 line-clamp-3">
                    {formDescriptionFr || formDescriptionMg}
                  </p>

                  <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[var(--accent)]" />
                      <span>
                        {new Date(formStartDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-[var(--accent)]" />
                      <span>{formLocation || 'En ligne'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raccourcis de modification par étape */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-xs text-left"
                >
                  <span className="text-[10px] text-[var(--text-muted)] block">Étape 1</span>
                  <span className="font-semibold text-[var(--foreground)]">Photo & Titre</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-xs text-left"
                >
                  <span className="text-[10px] text-[var(--text-muted)] block">Étape 2</span>
                  <span className="font-semibold text-[var(--foreground)]">Langues & Blocs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-xs text-left"
                >
                  <span className="text-[10px] text-[var(--text-muted)] block">Étape 3</span>
                  <span className="font-semibold text-[var(--foreground)]">Dates & Lieu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-xs text-left"
                >
                  <span className="text-[10px] text-[var(--text-muted)] block">Étape 4</span>
                  <span className="font-semibold text-[var(--foreground)]">Billets & Quotas</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Barre d'action inférieure ──────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : 1))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
              >
                <ChevronLeft size={14} />
                <span>Précédent</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <button
                type="button"
                onClick={validateAndNext}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg bg-[var(--accent)] hover:opacity-90 text-white transition-all shadow-sm"
              >
                <span>Continuer</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSubmit(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-[var(--border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin inline mr-1" />}
                  <span>Enregistrer Brouillon</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSubmit(true)}
                  className="inline-flex items-center gap-1.5 px-6 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Publier immédiatement</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
