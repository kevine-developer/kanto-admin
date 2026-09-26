'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { useToast } from '@/lib/hooks/useToast';
import {
  marketingBannersService,
  MarketingBanner,
  CreateMarketingBannerInput,
} from '@/services/marketing-banners.service';
import { DEFAULT_DEEP_LINK_OPTIONS } from '@/constants/deep-links.constant';
import {
  Plus,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  MoveUp,
  MoveDown,
  Loader2,
  X,
  Eye,
  Link as LinkIcon,
  Palette,
  Image as ImageIcon,
  Layers,
  Search,
  PanelBottomOpen,
  MessageSquare,
} from 'lucide-react';

const PRESET_COLORS = [
  { label: 'Or Royal', value: '#F59E0B' },
  { label: 'Émeraude Kanto', value: '#10B981' },
  { label: 'Ambre Végétal', value: '#F97316' },
  { label: 'Indigo Céleste', value: '#818CF8' },
  { label: 'Rubis Intense', value: '#EF4444' },
  { label: 'Bleu Saphir', value: '#3B82F6' },
];

export default function MarketingBannersAdminPage() {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPreviewBanner, setSelectedPreviewBanner] = useState<MarketingBanner | null>(null);
  const { toast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [titleFr, setTitleFr] = useState('');
  const [titleMg, setTitleMg] = useState('');
  const [badgeFr, setBadgeFr] = useState('');
  const [badgeMg, setBadgeMg] = useState('');
  const [descriptionFr, setDescriptionFr] = useState('');
  const [descriptionMg, setDescriptionMg] = useState('');
  const [ctaFr, setCtaFr] = useState('Découvrir');
  const [ctaMg, setCtaMg] = useState('Hizaha');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('/(screens)/subscription');
  const [selectedDeepLinkPreset, setSelectedDeepLinkPreset] = useState('/(screens)/subscription');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [isActive, setIsActive] = useState(true);

  // Nouveaux types d'action & modales d'information
  const [actionType, setActionType] = useState<'DEEP_LINK' | 'BOTTOM_SHEET' | 'CENTER_MODAL'>('DEEP_LINK');
  const [modalBodyFr, setModalBodyFr] = useState('');
  const [modalBodyMg, setModalBodyMg] = useState('');
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalCtaLabelFr, setModalCtaLabelFr] = useState('');
  const [modalCtaLabelMg, setModalCtaLabelMg] = useState('');
  const [modalCtaLink, setModalCtaLink] = useState('');
  const [deepLinkSearch, setDeepLinkSearch] = useState('');

  const loadBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await marketingBannersService.getBanners();
      setBanners(data);
      if (data.length > 0 && !selectedPreviewBanner) {
        setSelectedPreviewBanner(data[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des bannières.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPreviewBanner, toast]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const resetForm = () => {
    setEditingId(null);
    setTitleFr('');
    setTitleMg('');
    setBadgeFr('');
    setBadgeMg('');
    setDescriptionFr('');
    setDescriptionMg('');
    setCtaFr('Découvrir');
    setCtaMg('Hizaha');
    setImageUrl('');
    setDeepLink('/(screens)/subscription');
    setSelectedDeepLinkPreset('/(screens)/subscription');
    setAccentColor('#F59E0B');
    setIsActive(true);
    setActionType('DEEP_LINK');
    setModalBodyFr('');
    setModalBodyMg('');
    setModalImageUrl('');
    setModalCtaLabelFr('');
    setModalCtaLabelMg('');
    setModalCtaLink('');
    setDeepLinkSearch('');
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (banner: MarketingBanner) => {
    setEditingId(banner.id);
    setTitleFr(banner.titleFr);
    setTitleMg(banner.titleMg);
    setBadgeFr(banner.badgeFr);
    setBadgeMg(banner.badgeMg);
    setDescriptionFr(banner.descriptionFr);
    setDescriptionMg(banner.descriptionMg);
    setCtaFr(banner.ctaFr);
    setCtaMg(banner.ctaMg);
    setImageUrl(banner.imageUrl);
    setDeepLink(banner.deepLink);
    
    const presetFound = DEFAULT_DEEP_LINK_OPTIONS.find((opt) => opt.value === banner.deepLink);
    setSelectedDeepLinkPreset(presetFound ? presetFound.value : 'custom');
    
    setAccentColor(banner.accentColor || '#F59E0B');
    setIsActive(banner.isActive);
    setActionType(banner.actionType || 'DEEP_LINK');
    setModalBodyFr(banner.modalBodyFr || '');
    setModalBodyMg(banner.modalBodyMg || '');
    setModalImageUrl(banner.modalImageUrl || '');
    setModalCtaLabelFr(banner.modalCtaLabelFr || '');
    setModalCtaLabelMg(banner.modalCtaLabelMg || '');
    setModalCtaLink(banner.modalCtaLink || '');
    setDeepLinkSearch('');
    setIsModalOpen(true);
  };

  const handleDeepLinkPresetChange = (val: string) => {
    setSelectedDeepLinkPreset(val);
    if (val !== 'custom') {
      setDeepLink(val);
    }
  };

  const handleSelectDeepLinkDirect = (val: string) => {
    setDeepLink(val);
    setSelectedDeepLinkPreset(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleFr.trim() || !titleMg.trim() || !imageUrl.trim() || !deepLink.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires (titres, image, deep link).');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateMarketingBannerInput = {
        titleFr: titleFr.trim(),
        titleMg: titleMg.trim(),
        badgeFr: badgeFr.trim() || 'OFFRE SPÉCIALE',
        badgeMg: badgeMg.trim() || 'TOLOTRA MANOKANA',
        descriptionFr: descriptionFr.trim(),
        descriptionMg: descriptionMg.trim(),
        ctaFr: ctaFr.trim() || 'Découvrir',
        ctaMg: ctaMg.trim() || 'Hizaha',
        imageUrl: imageUrl.trim(),
        deepLink: deepLink.trim(),
        accentColor,
        isActive,
        actionType,
        modalBodyFr: modalBodyFr.trim() || undefined,
        modalBodyMg: modalBodyMg.trim() || undefined,
        modalImageUrl: modalImageUrl.trim() || undefined,
        modalCtaLabelFr: modalCtaLabelFr.trim() || undefined,
        modalCtaLabelMg: modalCtaLabelMg.trim() || undefined,
        modalCtaLink: modalCtaLink.trim() || undefined,
      };

      if (editingId) {
        const updated = await marketingBannersService.updateBanner(editingId, payload);
        toast.success('Bannière mise à jour avec succès.');
        setBanners((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
        if (selectedPreviewBanner?.id === editingId) setSelectedPreviewBanner(updated);
      } else {
        const created = await marketingBannersService.createBanner(payload);
        toast.success('Nouvelle bannière créée avec succès.');
        setBanners((prev) => [...prev, created]);
        setSelectedPreviewBanner(created);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (banner: MarketingBanner) => {
    try {
      const updated = await marketingBannersService.toggleActive(banner.id);
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)));
      if (selectedPreviewBanner?.id === banner.id) setSelectedPreviewBanner(updated);
      toast.success(`Bannière ${updated.isActive ? 'activée' : 'désactivée'}.`);
    } catch {
      toast.error('Erreur lors du changement de statut.');
    }
  };

  const handleDelete = async (banner: MarketingBanner) => {
    if (!confirm(`Supprimer définitivement la bannière « ${banner.titleFr} » ?`)) return;
    try {
      await marketingBannersService.deleteBanner(banner.id);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      if (selectedPreviewBanner?.id === banner.id) {
        setSelectedPreviewBanner(banners.find((b) => b.id !== banner.id) || null);
      }
      toast.success('Bannière supprimée.');
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const newBanners = [...banners];
    const [moved] = newBanners.splice(index, 1);
    newBanners.splice(targetIndex, 0, moved);

    const reordered = newBanners.map((b, idx) => ({ ...b, orderIndex: idx }));
    setBanners(reordered);

    try {
      await marketingBannersService.reorderBanners(
        reordered.map((b) => ({ id: b.id, orderIndex: b.orderIndex }))
      );
      toast.success('Ordre mis à jour.');
    } catch {
      toast.error("Erreur lors de la réorganisation de l'ordre.");
      loadBanners();
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Bannières Marketing & Culturelles
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les bannières affichées dans le carrousel d&apos;accueil de l&apos;application mobile avec fond cinématique et deep links directs.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Bannière
          </button>
        </div>

        {/* Aperçu en direct (Live Preview fidèle au mobile) */}
        {selectedPreviewBanner && (
          <div className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                Aperçu mobile (Design épuré & arrondis design system)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded font-medium border bg-muted text-foreground flex items-center gap-1">
                  {selectedPreviewBanner.actionType === 'BOTTOM_SHEET' ? (
                    <>
                      <PanelBottomOpen className="w-3 h-3 text-indigo-400" />
                      Tiroir bas (Contenu long)
                    </>
                  ) : selectedPreviewBanner.actionType === 'CENTER_MODAL' ? (
                    <>
                      <MessageSquare className="w-3 h-3 text-amber-400" />
                      Modal centré (Contenu court)
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3 h-3 text-emerald-400" />
                      Lien direct
                    </>
                  )}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded font-mono border bg-muted text-emerald-500">
                  {selectedPreviewBanner.deepLink}
                </span>
              </div>
            </div>

            {/* Carte de simulation mobile (arrondis stricts RADIUS.md = 8px) */}
            <div className="max-w-md mx-auto">
              <div
                className="relative h-40 rounded-lg overflow-hidden border border-white/15 bg-neutral-950 flex flex-col justify-between p-3.5 shadow-md select-none"
                style={{
                  backgroundImage: `url(${selectedPreviewBanner.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Dégradé cinématique identique à kanto-app */}
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/75 to-neutral-950/95 pointer-events-none" />
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    background: `radial-gradient(circle at top left, ${selectedPreviewBanner.accentColor}, transparent 70%)`,
                  }}
                />

                {/* Header : Badge sobre & compteur net (sans pilules grotesques) */}
                <div className="relative z-10 flex items-center justify-between">
                  <div
                    className="px-2 py-0.5 rounded text-[9.5px] font-bold tracking-wider uppercase backdrop-blur-md bg-white/10 border"
                    style={{
                      color: selectedPreviewBanner.accentColor,
                      borderColor: `${selectedPreviewBanner.accentColor}50`,
                    }}
                  >
                    {selectedPreviewBanner.badgeFr}
                  </div>
                  <div className="text-[10px] font-semibold text-white/75 px-1.5 py-0.5 rounded bg-white/10 border border-white/15 font-mono">
                    01 / {String(banners.length).padStart(2, '0')}
                  </div>
                </div>

                {/* Corps */}
                <div className="relative z-10 space-y-1">
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-1">
                    {selectedPreviewBanner.titleFr}
                  </h3>
                  <p className="text-white/80 text-[11.5px] leading-snug line-clamp-2">
                    {selectedPreviewBanner.descriptionFr}
                  </p>
                </div>

                {/* Footer avec CTA moderne et arrondi mesuré (rounded-md) */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-neutral-900 text-[11px] font-bold shadow-sm">
                    <span>{selectedPreviewBanner.ctaFr}</span>
                    <ArrowUpRight className="w-3 h-3 text-neutral-900" />
                  </div>
                  {selectedPreviewBanner.actionType !== 'DEEP_LINK' && (
                    <span className="text-[10px] text-white/60 font-medium">
                      Ouvre {selectedPreviewBanner.actionType === 'BOTTOM_SHEET' ? 'le tiroir bas' : 'le dialogue centré'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des bannières */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
            <p className="text-sm">Chargement des bannières marketing...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-xl bg-card">
            <p className="text-muted-foreground text-sm">
              Aucune bannière configurée. Créez-en une pour dynamiser l&apos;accueil mobile !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                onClick={() => setSelectedPreviewBanner(banner)}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedPreviewBanner?.id === banner.id
                    ? 'border-emerald-500/60 bg-emerald-500/5 shadow-sm'
                    : 'border-border bg-card hover:border-border/80'
                }`}
              >
                {/* Miniature & Infos */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-16 h-12 rounded-lg overflow-hidden border border-border/60 bg-neutral-900 flex-shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.imageUrl}
                      alt={banner.titleFr}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: banner.accentColor }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase"
                        style={{
                          color: banner.accentColor,
                          borderColor: `${banner.accentColor}40`,
                          backgroundColor: `${banner.accentColor}10`,
                        }}
                      >
                        {banner.badgeFr}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          banner.isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                        }`}
                      >
                        {banner.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                          banner.actionType === 'BOTTOM_SHEET'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : banner.actionType === 'CENTER_MODAL'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {banner.actionType === 'BOTTOM_SHEET'
                          ? 'Tiroir bas (long)'
                          : banner.actionType === 'CENTER_MODAL'
                          ? 'Modal centré (court)'
                          : 'Lien direct'}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        #{index + 1}
                      </span>
                    </div>

                    <h4 className="font-semibold text-foreground text-sm truncate mt-1">
                      {banner.titleFr}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {banner.descriptionFr}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 font-mono">
                      <LinkIcon className="w-3 h-3" />
                      <span>{banner.deepLink}</span>
                    </div>
                  </div>
                </div>

                {/* Actions de réordonnancement et modification */}
                <div
                  className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-muted-foreground"
                    title="Monter"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={index === banners.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-muted-foreground"
                    title="Descendre"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground"
                    title={banner.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {banner.isActive ? (
                      <ToggleRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(banner)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-blue-500"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-red-500"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Création / Modification */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* En-tête modal */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">
                  {editingId ? 'Modifier la bannière' : 'Nouvelle bannière marketing'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* 1. Titres FR & MG */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Titre Français *
                    </label>
                    <input
                      type="text"
                      required
                      value={titleFr}
                      onChange={(e) => setTitleFr(e.target.value)}
                      placeholder="ex: L'expérience Kanto sans aucune limite"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Titre Malgache *
                    </label>
                    <input
                      type="text"
                      required
                      value={titleMg}
                      onChange={(e) => setTitleMg(e.target.value)}
                      placeholder="ex: Iainao feno ny haren-tsain'ny Razana"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 2. Badges FR & MG (sans icône) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Badge Français (texte pur)
                    </label>
                    <input
                      type="text"
                      value={badgeFr}
                      onChange={(e) => setBadgeFr(e.target.value)}
                      placeholder="ex: OFFRE PRIVILÈGE"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Badge Malgache (texte pur)
                    </label>
                    <input
                      type="text"
                      value={badgeMg}
                      onChange={(e) => setBadgeMg(e.target.value)}
                      placeholder="ex: TOLOTRA MANOKANA"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 3. Descriptions FR & MG */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Description Français
                    </label>
                    <textarea
                      rows={2}
                      value={descriptionFr}
                      onChange={(e) => setDescriptionFr(e.target.value)}
                      placeholder="Texte court et accrocheur..."
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Description Malgache
                    </label>
                    <textarea
                      rows={2}
                      value={descriptionMg}
                      onChange={(e) => setDescriptionMg(e.target.value)}
                      placeholder="Fanasana fohy..."
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>

                {/* 4. Boutons CTA FR & MG */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Bouton CTA (FR)
                    </label>
                    <input
                      type="text"
                      value={ctaFr}
                      onChange={(e) => setCtaFr(e.target.value)}
                      placeholder="ex: Découvrir Kanto Pro"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Bouton CTA (MG)
                    </label>
                    <input
                      type="text"
                      value={ctaMg}
                      onChange={(e) => setCtaMg(e.target.value)}
                      placeholder="ex: Hizaha Kanto Pro"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 5. Comportement au clic : Redirection directe ou Modale d'information */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      Action au clic sur la bannière
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Choisissez comment réagit la bannière
                    </span>
                  </div>

                  {/* Choix des 3 modes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActionType('DEEP_LINK')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        actionType === 'DEEP_LINK'
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                          : 'border-border bg-background hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-foreground">Lien direct</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        Redirige immédiatement vers l&apos;écran ou le lien externe.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('BOTTOM_SHEET')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        actionType === 'BOTTOM_SHEET'
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                          : 'border-border bg-background hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PanelBottomOpen className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-foreground">Tiroir bas (Long)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        Modale glissant du bas avec image, texte long défilable et CTA.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('CENTER_MODAL')}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        actionType === 'CENTER_MODAL'
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                          : 'border-border bg-background hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-foreground">Modale centrée (Court)</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        Dialogue centré élégant avec image pour annonces succinctes.
                      </p>
                    </button>
                  </div>

                  {/* Champs spécifiques aux modales d'information */}
                  {actionType !== 'DEEP_LINK' && (
                    <div className="pt-3 border-t border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {actionType === 'BOTTOM_SHEET' ? (
                            <PanelBottomOpen className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          Contenu de la modale native ({actionType === 'BOTTOM_SHEET' ? 'Tiroir bas' : 'Dialogue centré'})
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {actionType === 'BOTTOM_SHEET' ? 'Pour histoires & textes longs' : 'Pour messages courts & alertes'}
                        </span>
                      </div>

                      {/* Textes de la modale FR & MG */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            Texte du modal (Français) *
                          </label>
                          <textarea
                            rows={actionType === 'BOTTOM_SHEET' ? 4 : 2}
                            value={modalBodyFr}
                            onChange={(e) => setModalBodyFr(e.target.value)}
                            placeholder={
                              actionType === 'BOTTOM_SHEET'
                                ? "Rédigez ici le contenu complet, explications détaillées, histoire ou règles du jeu..."
                                : "Texte court et percutant de l'annonce..."
                            }
                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            Texte du modal (Malgache)
                          </label>
                          <textarea
                            rows={actionType === 'BOTTOM_SHEET' ? 4 : 2}
                            value={modalBodyMg}
                            onChange={(e) => setModalBodyMg(e.target.value)}
                            placeholder={
                              actionType === 'BOTTOM_SHEET'
                                ? "Soraty eto ny tantara, fanazavana feno na fepetra..."
                                : "Hafatra fohy sy manaitra..."
                            }
                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Image spécifique au modal & CTA modal */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            Image de la modale (optionnel)
                          </label>
                          <input
                            type="url"
                            value={modalImageUrl}
                            onChange={(e) => setModalImageUrl(e.target.value)}
                            placeholder="Laisser vide = image de la bannière"
                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            Bouton d&apos;action (FR)
                          </label>
                          <input
                            type="text"
                            value={modalCtaLabelFr}
                            onChange={(e) => setModalCtaLabelFr(e.target.value)}
                            placeholder="ex: Continuer, J'ai compris"
                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">
                            Bouton d&apos;action (MG)
                          </label>
                          <input
                            type="text"
                            value={modalCtaLabelMg}
                            onChange={(e) => setModalCtaLabelMg(e.target.value)}
                            placeholder="ex: Tohizo, Azoko"
                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">
                          Lien de redirection du bouton modal (optionnel)
                        </label>
                        <input
                          type="text"
                          value={modalCtaLink}
                          onChange={(e) => setModalCtaLink(e.target.value)}
                          placeholder="ex: /(screens)/subscription (ferme la modale et ouvre le lien)"
                          className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Destination / Deep Link avec liste directe cliquable */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        {actionType === 'DEEP_LINK'
                          ? 'Destination directe (Deep Link)'
                          : 'Lien secondaire ou de secours'}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Cliquez directement sur une suggestion ci-dessous
                    </span>
                  </div>

                  {/* Barre de recherche rapide de deep link */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={deepLinkSearch}
                      onChange={(e) => setDeepLinkSearch(e.target.value)}
                      placeholder="Filtrer parmi les destinations disponibles..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Liste directe des deep links cliquables */}
                  <div className="max-h-36 overflow-y-auto pr-1 space-y-1.5 border border-border/60 rounded-lg p-2 bg-background/50">
                    {DEFAULT_DEEP_LINK_OPTIONS.filter((opt) =>
                      !deepLinkSearch
                        ? true
                        : opt.label.toLowerCase().includes(deepLinkSearch.toLowerCase()) ||
                          opt.category.toLowerCase().includes(deepLinkSearch.toLowerCase()) ||
                          opt.value.toLowerCase().includes(deepLinkSearch.toLowerCase())
                    ).map((opt) => {
                      const isSelected = deepLink === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectDeepLinkDirect(opt.value)}
                          className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors text-xs ${
                            isSelected
                              ? 'bg-emerald-500/15 border border-emerald-500/40 text-foreground font-semibold'
                              : 'hover:bg-muted text-muted-foreground border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted border font-mono">
                              {opt.category}
                            </span>
                            <span className="truncate">{opt.label}</span>
                          </div>
                          <code className="text-[10.5px] font-mono text-emerald-500 flex-shrink-0 ml-2">
                            {opt.value}
                          </code>
                        </button>
                      );
                    })}
                  </div>

                  {/* Champ de saisie manuelle */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Chemin Expo Router ou URL complète (saisie libre)
                    </label>
                    <input
                      type="text"
                      required
                      value={deepLink}
                      onChange={(e) => setDeepLink(e.target.value)}
                      placeholder="ex: /(screens)/subscription ou https://..."
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 6. Image de fond & Couleur d'accent */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      URL Image de fond *
                    </label>
                    <input
                      type="url"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {imageUrl && (
                      <div className="mt-2 h-16 rounded-lg overflow-hidden border border-border/80 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt="Prévisualisation"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      Couleur d&apos;accent
                    </label>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setAccentColor(color.value)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            accentColor === color.value ? 'scale-110 border-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* 7. Actif */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-border text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <label htmlFor="isActiveCheck" className="text-sm font-medium text-foreground cursor-pointer">
                    Bannière active et visible sur l&apos;application mobile
                  </label>
                </div>

                {/* Boutons modal */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted text-muted-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingId ? 'Enregistrer les modifications' : 'Créer la bannière'}
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
