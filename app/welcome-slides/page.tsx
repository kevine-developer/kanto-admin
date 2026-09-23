'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { welcomeSlidesService } from '@/services/welcome-slides.service';
import {
  WelcomeSlide,
  CreateWelcomeSlideInput,
  UpdateWelcomeSlideInput,
} from '@/types';
import { ImageUploadDropzone } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import {
  Images,
  Plus,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Save,
  Pencil,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';

/**
 * Page d'administration des slides du carrousel de bienvenue Kanto.
 * Permet d'administrer les 7 photos culturelles, l'ordre d'apparition, les textes et images.
 */
export default function WelcomeSlidesAdminPage() {
  const [slides, setSlides] = useState<WelcomeSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlide, setEditingSlide] = useState<WelcomeSlide | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTitleMg, setFormTitleMg] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formBadgeMg, setFormBadgeMg] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAccentColor, setFormAccentColor] = useState('#4A6741');
  const [formIsActive, setFormIsActive] = useState(true);

  const loadSlides = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await welcomeSlidesService.getSlides();
      setSlides(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des slides';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlides();
  }, [loadSlides]);

  const openCreateModal = () => {
    setEditingSlide(null);
    setFormTitle('');
    setFormTitleMg('');
    setFormBadge('');
    setFormBadgeMg('');
    setFormTag('');
    setFormImageUrl('');
    setFormAccentColor('#4A6741');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (slide: WelcomeSlide) => {
    setEditingSlide(slide);
    setFormTitle(slide.title);
    setFormTitleMg(slide.titleMg || '');
    setFormBadge(slide.badge);
    setFormBadgeMg(slide.badgeMg);
    setFormTag(slide.tag || '');
    setFormImageUrl(slide.imageUrl);
    setFormAccentColor(slide.accentColor || '#4A6741');
    setFormIsActive(slide.isActive);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (slide: WelcomeSlide) => {
    try {
      const updated = await welcomeSlidesService.updateSlide(slide.id, {
        isActive: !slide.isActive,
      });
      setSlides((prev) =>
        prev.map((s) => (s.id === slide.id ? updated : s)),
      );
      setFeedback({
        type: 'success',
        text: `Slide « ${slide.title} » ${updated.isActive ? 'activée' : 'désactivée'}.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Échec de la mise à jour.';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer définitivement la photo « ${title} » ?`)) {
      return;
    }
    try {
      await welcomeSlidesService.deleteSlide(id);
      setSlides((prev) => prev.filter((s) => s.id !== id));
      setFeedback({
        type: 'success',
        text: `Slide « ${title} » supprimée avec succès.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur lors de la suppression.';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    const reorderedPayload = newSlides.map((s, idx) => ({
      id: s.id,
      orderIndex: idx,
    }));

    setSlides(
      newSlides.map((s, idx) => ({
        ...s,
        orderIndex: idx,
      })),
    );

    try {
      const saved = await welcomeSlidesService.reorderSlides(reorderedPayload);
      setSlides(saved);
      setFeedback({
        type: 'success',
        text: 'Ordre de défilement mis à jour avec succès.',
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur de réorganisation.';
      setFeedback({ type: 'error', text: msg });
      loadSlides();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBadge.trim() || !formImageUrl.trim()) {
      setFeedback({
        type: 'error',
        text: 'Veuillez renseigner le titre, le badge et l’URL de l’image.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingSlide) {
        const payload: UpdateWelcomeSlideInput = {
          title: formTitle.trim(),
          titleMg: formTitleMg.trim() || null,
          badge: formBadge.trim(),
          badgeMg: formBadgeMg.trim() || formBadge.trim(),
          tag: formTag.trim() || null,
          imageUrl: formImageUrl.trim(),
          accentColor: formAccentColor.trim() || '#4A6741',
          isActive: formIsActive,
        };
        const updated = await welcomeSlidesService.updateSlide(
          editingSlide.id,
          payload,
        );
        setSlides((prev) =>
          prev.map((s) => (s.id === editingSlide.id ? updated : s)),
        );
        setFeedback({
          type: 'success',
          text: `Slide « ${updated.title} » mise à jour.`,
        });
      } else {
        const payload: CreateWelcomeSlideInput = {
          title: formTitle.trim(),
          titleMg: formTitleMg.trim() || null,
          badge: formBadge.trim(),
          badgeMg: formBadgeMg.trim() || formBadge.trim(),
          tag: formTag.trim() || null,
          imageUrl: formImageUrl.trim(),
          accentColor: formAccentColor.trim() || '#4A6741',
          orderIndex: slides.length,
          isActive: formIsActive,
        };
        const created = await welcomeSlidesService.createSlide(payload);
        setSlides((prev) => [...prev, created]);
        setFeedback({
          type: 'success',
          text: `Nouvelle slide « ${created.title} » ajoutée.`,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Images className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Écran d&apos;Accueil — Carrousel de Bienvenue
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Gestion des photos culturelles en arc courbé sur l&apos;application mobile Kanto ({slides.length} photos)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSlides}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <RotateCcw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Actualiser
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une photo
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium border ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Grille des Slides */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Chargement des photos du carrousel...</p>
          </div>
        ) : slides.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-2xl p-8 space-y-3">
            <Images className="w-12 h-12 mx-auto text-muted-foreground opacity-40" />
            <h3 className="text-lg font-semibold text-foreground">
              Aucune photo enregistrée
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Ajoutez des photos pour enrichir le carrousel 3D contemplatif de l&apos;écran d&apos;accueil.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Créer la première photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`group relative bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${
                  slide.isActive ? 'border-border' : 'border-border/50 opacity-60'
                }`}
              >
                {/* Aperçu Photo Card */}
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Badges en superposition */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/10">
                      #{slide.orderIndex + 1}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: slide.accentColor || '#4A6741' }}
                    >
                      {slide.badgeMg || slide.badge}
                    </span>
                  </div>

                  {/* Statut Toggle rapide */}
                  <button
                    onClick={() => handleToggleActive(slide)}
                    title={slide.isActive ? 'Désactiver' : 'Activer'}
                    className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition-colors ${
                      slide.isActive
                        ? 'bg-emerald-500/80 text-white hover:bg-emerald-600'
                        : 'bg-black/60 text-muted-foreground hover:text-white'
                    }`}
                  >
                    {slide.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>

                  {/* Titres sur l'image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="text-xs uppercase tracking-wider font-semibold opacity-80">
                      {slide.badge} {slide.tag ? `• ${slide.tag}` : ''}
                    </p>
                    <h3 className="text-base font-bold truncate">
                      {slide.title}
                    </h3>
                  </div>
                </div>

                {/* Détails & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3 bg-card">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {slide.titleMg && (
                      <p>
                        <span className="font-medium text-foreground">MG :</span>{' '}
                        {slide.titleMg}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Accent :</span>
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block border border-border"
                        style={{ backgroundColor: slide.accentColor }}
                      />
                      <span>{slide.accentColor}</span>
                    </div>
                  </div>

                  {/* Barre d'outils d'action */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-1">
                    {/* Réordonnancement */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveOrder(index, 'up')}
                        disabled={index === 0}
                        title="Monter d'une position"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(index, 'down')}
                        disabled={index === slides.length - 1}
                        title="Descendre d'une position"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Édition / Suppression */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(slide)}
                        title="Modifier la photo"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id, slide.title)}
                        title="Supprimer"
                        className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal d'Ajout / Édition */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-150">
              {/* Header Modal */}
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {editingSlide ? 'Modifier la photo' : 'Nouvelle photo carrousel'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Modal */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Titre principal *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="ex: Ikotofetsy sy Imahakà"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Titre Malagasy
                    </label>
                    <input
                      type="text"
                      value={formTitleMg}
                      onChange={(e) => setFormTitleMg(e.target.value)}
                      placeholder="ex: Ikotofetsy sy Imahakà"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Badge FR *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      placeholder="ex: Contes"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Badge Malagasy *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBadgeMg}
                      onChange={(e) => setFormBadgeMg(e.target.value)}
                      placeholder="ex: Angano"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Sous-titre / Tag
                    </label>
                    <input
                      type="text"
                      value={formTag}
                      onChange={(e) => setFormTag(e.target.value)}
                      placeholder="ex: Récits & Audio"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Couleur d&apos;accent (Hex)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formAccentColor}
                        onChange={(e) => setFormAccentColor(e.target.value)}
                        className="w-9 h-9 p-0.5 rounded-lg border border-border bg-background cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formAccentColor}
                        onChange={(e) => setFormAccentColor(e.target.value)}
                        placeholder="#4A6741"
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Photo du carrousel (Téléversement Cloudinary ou URL) *
                  </label>
                  <ImageUploadDropzone
                    value={formImageUrl}
                    onChange={(url) => setFormImageUrl(url)}
                    uploadEndpoint="/welcome-slides/upload-image"
                    subfolder="welcome"
                  />
                  <div className="mt-2">
                    <input
                      type="url"
                      required
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Ou collez directement une URL d'image (Cloudinary, Unsplash...)"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* Checkbox Actif */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                  />
                  <label
                    htmlFor="isActiveCheck"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Visible dans le carrousel mobile (Actif)
                  </label>
                </div>

                {/* Actions Modal */}
                <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingSlide ? 'Enregistrer' : 'Créer'}
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
