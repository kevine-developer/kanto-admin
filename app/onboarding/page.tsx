'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { fetchApi } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/utils/media';
import {
  Plus,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Upload,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  X,
  Cloud,
  HardDrive,
} from 'lucide-react';

export interface OnboardingSlideItem {
  id: string;
  order: number;
  title: string;
  titleMg: string;
  subtitle?: string | null;
  description: string;
  imageUrl?: string | null;
  accentColor?: string | null;
  iconName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PRESET_COLORS = [
  { label: 'Olive Tanimbary', value: '#4A6741' },
  { label: 'Feuille Forêt', value: '#5C7A3E' },
  { label: 'Jade Émeraude', value: '#3E6B55' },
  { label: 'Terre Cuite', value: '#C85A32' },
  { label: 'Ambre Sacré', value: '#D97706' },
  { label: 'Végétal Profond', value: '#2D6A4F' },
];

export default function OnboardingAdminPage() {
  const [slides, setSlides] = useState<OnboardingSlideItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Formulaire
  const [formSlide, setFormSlide] = useState({
    title: '',
    titleMg: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    accentColor: '#4A6741',
    isActive: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadRef = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const resolveImageUrl = resolveMediaUrl;

  const loadSlides = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi<OnboardingSlideItem[]>('/admin/onboarding');
      setSlides(res || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des slides';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchApi<OnboardingSlideItem[]>('/admin/onboarding')
      .then((res) => {
        if (isMounted) setSlides(res || []);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des slides';
        setMessage({ type: 'error', text: msg });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormSlide({
      title: '',
      titleMg: '',
      subtitle: '',
      description: '',
      imageUrl: '',
      accentColor: '#4A6741',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (slide: OnboardingSlideItem) => {
    setEditingId(slide.id);
    setFormSlide({
      title: slide.title,
      titleMg: slide.titleMg,
      subtitle: slide.subtitle || '',
      description: slide.description,
      imageUrl: slide.imageUrl || '',
      accentColor: slide.accentColor || '#4A6741',
      isActive: slide.isActive,
    });
    setIsModalOpen(true);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSlide.title.trim() || !formSlide.titleMg.trim() || !formSlide.description.trim()) {
      setMessage({
        type: 'error',
        text: 'Veuillez renseigner le Titre Français, le Titre Malgache et la Description.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const payload = {
        title: formSlide.title.trim(),
        titleMg: formSlide.titleMg.trim(),
        subtitle: formSlide.subtitle.trim() || null,
        description: formSlide.description.trim(),
        imageUrl: formSlide.imageUrl.trim() || null,
        accentColor: formSlide.accentColor || '#4A6741',
        isActive: formSlide.isActive,
      };

      if (editingId) {
        await fetchApi(`/admin/onboarding/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage({ type: 'success', text: 'Diapositive mise à jour avec succès.' });
      } else {
        await fetchApi('/admin/onboarding', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage({ type: 'success', text: 'Nouvelle diapositive ajoutée avec succès.' });
      }

      setIsModalOpen(false);
      await loadSlides();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (slide: OnboardingSlideItem) => {
    const updatedStatus = !slide.isActive;
    // Mise à jour optimiste immédiate
    setSlides((prev) =>
      prev.map((s) => (s.id === slide.id ? { ...s, isActive: updatedStatus } : s))
    );

    try {
      const updated = await fetchApi<OnboardingSlideItem>(`/admin/onboarding/${slide.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: updatedStatus }),
      });

      if (updated && updated.id) {
        setSlides((prev) =>
          prev.map((s) => (s.id === slide.id ? { ...s, isActive: updated.isActive } : s))
        );
      }

      setMessage({
        type: 'success',
        text: `Diapositive « ${slide.title} » ${updatedStatus ? 'activée (visible)' : 'masquée'}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur statut';
      setMessage({ type: 'error', text: `Erreur statut : ${msg}` });
      await loadSlides();
    }
  };

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    // Mise à jour optimiste de l'UI
    setSlides(newSlides);

    try {
      const slideIds = newSlides.map((s) => s.id);
      const updated = await fetchApi<OnboardingSlideItem[]>('/admin/onboarding/reorder', {
        method: 'PUT',
        body: JSON.stringify({ slideIds }),
      });

      if (updated && Array.isArray(updated)) {
        setSlides(updated);
      }
      setMessage({ type: 'success', text: 'Ordre d\'onboarding réorganisé avec succès.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réorganisation';
      setMessage({ type: 'error', text: `Erreur réorganisation : ${msg}` });
      await loadSlides();
    }
  };

  const handleDeleteSlide = async (slide: OnboardingSlideItem) => {
    try {
      await fetchApi(`/admin/onboarding/${slide.id}`, {
        method: 'DELETE',
      });
      setDeletingId(null);
      setMessage({ type: 'success', text: `Diapositive « ${slide.title} » supprimée.` });
      await loadSlides();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleImageFileChange = async (
    file: File,
    slideId?: string
  ) => {
    const reader = new FileReader();
    setIsUploadingPhoto(true);

    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const uploadRes = await fetchApi<{ url: string; provider: 'cloudinary' | 'local' }>(
          '/admin/onboarding/upload-image',
          {
            method: 'POST',
            body: JSON.stringify({
              imageBase64: base64,
              fileName: file.name,
            }),
          }
        );

        if (slideId) {
          // Mise à jour directe d'un slide existant
          await fetchApi(`/admin/onboarding/${slideId}`, {
            method: 'PATCH',
            body: JSON.stringify({ imageUrl: uploadRes.url }),
          });
          setMessage({
            type: 'success',
            text: `Photo mise à jour avec succès (${uploadRes.provider === 'cloudinary' ? 'Cloudinary CDN' : 'Stockage Local'}) !`,
          });
          void loadSlides();
        } else {
          // Dans le modal de création/édition
          setFormSlide((prev) => ({ ...prev, imageUrl: uploadRes.url }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur téléversement';
        setMessage({ type: 'error', text: `Échec du téléversement de la photo : ${msg}` });
      } finally {
        setIsUploadingPhoto(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                Écrans d&apos;Onboarding &amp; Photos
              </h1>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent-text)]">
                {slides.length} diapositives
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Organisez l&apos;ordre, personnalisez les textes et changez les photos d&apos;accueil de l&apos;application mobile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-3 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Nouveau Slide</span>
            </button>

            <button
              onClick={loadSlides}
              disabled={isLoading}
              className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Rafraîchir"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{message.text}</div>
            <button
              onClick={() => setMessage(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Liste Ordonnée des Slides */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-16 text-center text-[var(--text-muted)] space-y-2">
              <Loader2 size={24} className="animate-spin text-[var(--accent)] mx-auto" />
              <div className="text-xs font-medium">Chargement des diapositives...</div>
            </div>
          ) : slides.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--card-border)] rounded-xl">
              Aucune diapositive configurée. Cliquez sur « Nouveau Slide » pour commencer.
            </div>
          ) : (
            slides.map((slide, index) => {
              const isFirst = index === 0;
              const isLast = index === slides.length - 1;
              const isCloudinary = !!(slide.imageUrl && slide.imageUrl.includes('cloudinary.com'));

              return (
                <div
                  key={slide.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    slide.isActive
                      ? 'bg-[var(--card)] border-[var(--card-border)] shadow-xs'
                      : 'bg-neutral-50/50 dark:bg-neutral-900/40 border-dashed border-neutral-300 dark:border-neutral-800 opacity-70'
                  }`}
                >
                  {/* Gauche : Numéro d'ordre & Contrôles réordonnancement */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveSlide(index, 'up')}
                        disabled={isFirst}
                        title="Déplacer vers le haut"
                        className="p-1 rounded bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] disabled:opacity-30 cursor-pointer transition"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => handleMoveSlide(index, 'down')}
                        disabled={isLast}
                        title="Déplacer vers le bas"
                        className="p-1 rounded bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] disabled:opacity-30 cursor-pointer transition"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center font-mono font-bold text-xs text-[var(--foreground)]">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Centre-Gauche : Photo / Miniature */}
                  <div className="relative group shrink-0">
                    <div
                      className="w-28 h-20 rounded-lg overflow-hidden border border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-center relative"
                      style={{
                        borderColor: slide.accentColor ? `${slide.accentColor}40` : undefined,
                      }}
                    >
                      {slide.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={resolveImageUrl(slide.imageUrl)}
                          alt={slide.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center gap-1"
                          style={{
                            backgroundColor: slide.accentColor ? `${slide.accentColor}15` : undefined,
                          }}
                        >
                          <ImageIcon
                            size={20}
                            style={{ color: slide.accentColor || 'var(--text-muted)' }}
                          />
                          <span className="text-[9px] font-mono text-[var(--text-subtle)]">
                            Icône vectorielle
                          </span>
                        </div>
                      )}

                      {/* Badge CDN vs Local */}
                      {slide.imageUrl && (
                        <div
                          className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-mono font-bold flex items-center gap-0.5 bg-black/70 text-white backdrop-blur-xs"
                          title={isCloudinary ? 'Hébergé sur Cloudinary CDN' : 'Hébergé en local'}
                        >
                          {isCloudinary ? <Cloud size={9} /> : <HardDrive size={9} />}
                          <span>{isCloudinary ? 'CDN' : 'Local'}</span>
                        </div>
                      )}
                    </div>

                    {/* Bouton rapide de remplacement de photo */}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { quickUploadRef.current[slide.id] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileChange(file, slide.id);
                      }}
                    />
                    <button
                      onClick={() => quickUploadRef.current[slide.id]?.click()}
                      disabled={isUploadingPhoto}
                      title="Changer la photo"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium gap-1 rounded-lg transition-opacity cursor-pointer"
                    >
                      <Upload size={12} />
                      <span>Modifier</span>
                    </button>
                  </div>

                  {/* Centre-Droit : Textes du Slide */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {slide.title}
                      </h3>
                      <span className="text-[11px] font-medium text-[var(--accent)] italic">
                        ({slide.titleMg})
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: slide.accentColor || '#4A6741' }}
                        title={`Couleur d'accent : ${slide.accentColor}`}
                      />
                    </div>

                    {slide.subtitle && (
                      <p className="text-xs text-[var(--foreground)] font-medium truncate">
                        {slide.subtitle}
                      </p>
                    )}

                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {slide.description}
                    </p>
                  </div>

                  {/* Droite : Actions d'activation & Gestion */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleToggleActive(slide)}
                      title={slide.isActive ? 'Désactiver ce slide' : 'Activer ce slide'}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                        slide.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {slide.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{slide.isActive ? 'Actif' : 'Masqué'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(slide)}
                      title="Modifier les textes et détails"
                      className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>

                    {deletingId === slide.id ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 p-1 rounded-md border border-red-200 dark:border-red-800">
                        <button
                          onClick={() => handleDeleteSlide(slide)}
                          className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-semibold hover:bg-red-700 transition cursor-pointer"
                        >
                          Supprimer
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-[10px] cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(slide.id)}
                        title="Supprimer la diapositive"
                        className="p-1.5 rounded-md border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Création / Édition Diapositive */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="kanto-card rounded-xl border border-[var(--card-border)] shadow-md max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    {editingId ? 'Modifier la diapositive' : 'Nouvelle diapositive d\'onboarding'}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Configurez le visuel et les textes affichés au premier démarrage de l&apos;application.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-md text-[var(--text-subtle)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
                {/* Zone Photo d'illustration */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                    Photo d&apos;illustration (Cloudinary CDN ou Local)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 rounded-lg overflow-hidden border border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-center shrink-0">
                      {formSlide.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={resolveImageUrl(formSlide.imageUrl)}
                          alt="Prévisualisation"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={20} className="text-[var(--text-subtle)]" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFileChange(file);
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          {isUploadingPhoto ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Upload size={12} />
                          )}
                          <span>{formSlide.imageUrl ? 'Changer l\'image' : 'Importer une image'}</span>
                        </button>

                        {formSlide.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setFormSlide({ ...formSlide, imageUrl: '' })}
                            className="text-[11px] text-red-500 hover:underline cursor-pointer"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-subtle)]">
                        PNG, JPG ou WebP. Si aucune image n&apos;est fournie, l&apos;application utilisera une icône stylisée.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Titres Français et Malgache */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Titre Français *
                    </label>
                    <input
                      type="text"
                      required
                      value={formSlide.title}
                      onChange={(e) => setFormSlide({ ...formSlide, title: e.target.value })}
                      placeholder="Ex: Angano"
                      className="w-full px-2.5 py-1.5 rounded-md kanto-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                      Titre Malgache *
                    </label>
                    <input
                      type="text"
                      required
                      value={formSlide.titleMg}
                      onChange={(e) => setFormSlide({ ...formSlide, titleMg: e.target.value })}
                      placeholder="Ex: Contes Traditionnels"
                      className="w-full px-2.5 py-1.5 rounded-md kanto-input text-xs"
                    />
                  </div>
                </div>

                {/* Sous-titre */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Phrase d&apos;accroche (Sous-titre)
                  </label>
                  <input
                    type="text"
                    value={formSlide.subtitle}
                    onChange={(e) => setFormSlide({ ...formSlide, subtitle: e.target.value })}
                    placeholder="Ex: Les récits ancestraux de Madagascar"
                    className="w-full px-2.5 py-1.5 rounded-md kanto-input text-xs"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Description explicative *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formSlide.description}
                    onChange={(e) => setFormSlide({ ...formSlide, description: e.target.value })}
                    placeholder="Détaillez le rôle de ce domaine dans l'expérience utilisateur..."
                    className="w-full px-2.5 py-1.5 rounded-md kanto-input text-xs leading-relaxed"
                  />
                </div>

                {/* Palette de Couleurs */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                    Couleur d&apos;accentuation
                  </label>
                  <div className="flex items-center gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormSlide({ ...formSlide, accentColor: c.value })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                          formSlide.accentColor === c.value
                            ? 'scale-115 border-white shadow-xs'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={formSlide.accentColor}
                      onChange={(e) => setFormSlide({ ...formSlide, accentColor: e.target.value })}
                      className="w-6 h-6 rounded border-0 p-0 cursor-pointer bg-transparent"
                      title="Couleur personnalisée"
                    />
                  </div>
                </div>

                {/* Statut Actif */}
                <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-[var(--foreground)]">
                      Afficher cette diapositive
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Désactivez pour masquer temporairement ce slide de l&apos;application sans le supprimer.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formSlide.isActive}
                    onChange={(e) => setFormSlide({ ...formSlide, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--card-border)] accent-[var(--accent)] cursor-pointer"
                  />
                </div>

                {/* Actions Modal */}
                <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Mettre à jour' : 'Ajouter le slide'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
