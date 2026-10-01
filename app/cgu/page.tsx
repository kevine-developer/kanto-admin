'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  ExternalLink,
  Code,
  Smartphone,
  Laptop,
  Users,
} from 'lucide-react';

interface LegalDocument {
  id: string;
  slug: string;
  title: string;
  version: string;
  effectiveDate: string | null;
  contentHtml: string;
  summary: string | null;
  requiresConsent: boolean;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LegalStats {
  totalUsers: number;
  activeVersion: string;
  acceptedCurrentVersion: number;
  acceptedOlderVersion: number;
  unacceptedOrUnknown: number;
  acceptanceRate: number;
}

interface LegalApiResponse {
  documents: LegalDocument[];
  stats: LegalStats;
}

export default function LegalManagementPage() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [stats, setStats] = useState<LegalStats | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<'terms' | 'privacy'>('terms');

  // Form State
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [summary, setSummary] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  // Mode de vue
  const [viewMode, setViewMode] = useState<'edit' | 'preview-mobile' | 'preview-desktop'>('edit');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi<LegalApiResponse>('/admin/legal');
      if (res && res.documents) {
        setDocuments(res.documents);
        setStats(res.stats);

        const currentDoc = res.documents.find((d) => d.slug === selectedSlug);
        if (currentDoc) {
          setTitle(currentDoc.title || '');
          setVersion(currentDoc.version || '1.0');
          setEffectiveDate(currentDoc.effectiveDate || '');
          setSummary(currentDoc.summary || '');
          setContentHtml(currentDoc.contentHtml || '');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des CGU';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSlug, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronisation lors du changement d'onglet
  const handleSelectSlug = (slug: 'terms' | 'privacy') => {
    setSelectedSlug(slug);
    const doc = documents.find((d) => d.slug === slug);
    if (doc) {
      setTitle(doc.title || '');
      setVersion(doc.version || '1.0');
      setEffectiveDate(doc.effectiveDate || '');
      setSummary(doc.summary || '');
      setContentHtml(doc.contentHtml || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Le titre est requis.');
      return;
    }
    if (!version.trim()) {
      toast.error('Le numéro de version est requis (ex: 1.0 ou 1.1).');
      return;
    }
    if (!contentHtml.trim()) {
      toast.error('Le contenu HTML ne peut pas être vide.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetchApi<{ success: boolean; message: string; document: LegalDocument }>(
        `/admin/legal/${selectedSlug}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: title.trim(),
            version: version.trim(),
            effectiveDate: effectiveDate.trim() || undefined,
            summary: summary.trim() || undefined,
            contentHtml,
          }),
        }
      );

      if (res && res.success) {
        toast.success(`"${title}" enregistré et publié avec succès !`);
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    const docLabel = selectedSlug === 'terms' ? 'les CGU' : 'la politique de confidentialité';
    if (!confirm(`Voulez-vous réinitialiser ${docLabel} au texte officiel par défaut de Kanto ?`)) {
      return;
    }

    try {
      setIsResetting(true);
      const res = await fetchApi<{ success: boolean; message: string; document: LegalDocument }>(
        `/admin/legal/${selectedSlug}/reset`,
        { method: 'POST' }
      );

      if (res && res.success) {
        toast.success('Document réinitialisé avec succès !');
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de réinitialisation';
      toast.error(msg);
    } finally {
      setIsResetting(false);
    }
  };

  // Insertion rapide de balises HTML dans l'éditeur
  const insertSnippet = (snippet: string) => {
    setContentHtml((prev) => prev + '\n\n' + snippet);
    toast.info('Bloc inséré à la fin du document.');
  };

  const currentDoc = documents.find((d) => d.slug === selectedSlug);

  return (
    <AdminShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title="Gestion des CGU & Documents Légaux"
          description="Contrôlez les conditions d'utilisation, la politique de confidentialité, le suivi des versions et la conformité légale des utilisateurs mobiles."
          icon={FileText}
          actions={
            <div className="flex items-center gap-2">
              <a
                href={`/api-proxy/pages/${selectedSlug}?embed=true`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground)',
                  background: 'var(--card)',
                }}
                title="Ouvrir la page publique réelle vue par le mobile"
              >
                <ExternalLink size={13} />
                <span>Tester le rendu public</span>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                leftIcon={<RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />}
              >
                Rafraîchir
              </Button>
            </div>
          }
        />

        {/* 1. Métriques et Statistiques UX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Version Active"
            value={stats ? `v${stats.activeVersion}` : 'v1.0'}
            subtitle={effectiveDate || 'En vigueur'}
            icon={ShieldCheck}
            variant="default"
            badge="Obligatoire"
          />
          <StatCard
            title="Taux de Couverture"
            value={stats ? `${stats.acceptanceRate}%` : '100%'}
            subtitle="Utilisateurs à jour"
            icon={CheckCircle2}
            variant={stats && stats.acceptanceRate >= 90 ? 'success' : 'warning'}
            badge="Conforme RGPD"
          />
          <StatCard
            title="Utilisateurs à Jour"
            value={stats?.acceptedCurrentVersion ?? 0}
            subtitle={`Sur un total de ${stats?.totalUsers ?? 0} comptes`}
            icon={Users}
            variant="info"
          />
          <StatCard
            title="À Renouveler"
            value={(stats?.acceptedOlderVersion ?? 0) + (stats?.unacceptedOrUnknown ?? 0)}
            subtitle="Comptes sur version antérieure"
            icon={AlertTriangle}
            variant={
              (stats?.acceptedOlderVersion ?? 0) + (stats?.unacceptedOrUnknown ?? 0) > 0
                ? 'warning'
                : 'success'
            }
          />
        </div>

        {/* 2. Onglets de sélection de document */}
        <div
          className="flex items-center gap-2 p-1.5 rounded-xl border w-fit"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <button
            type="button"
            onClick={() => handleSelectSlug('terms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedSlug === 'terms'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <FileText size={15} />
            <span>Conditions d&apos;Utilisation (CGU)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectSlug('privacy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedSlug === 'privacy'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <ShieldCheck size={15} />
            <span>Politique de Confidentialité</span>
          </button>
        </div>

        {/* 3. Zone Principale : Éditeur & Prévisualisation */}
        <div
          className="rounded-2xl border p-6 space-y-6"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          {/* Header de la carte d'édition */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--card-border)' }}>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-heritage" style={{ color: 'var(--foreground)' }}>
                  {title || (selectedSlug === 'terms' ? 'CGU Kanto' : 'Politique de confidentialité')}
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-bold"
                  style={{
                    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                    color: 'var(--accent)',
                  }}
                >
                  v{version || '1.0'}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Dernière modification : {currentDoc?.updatedAt ? new Date(currentDoc.updatedAt).toLocaleString('fr-FR') : 'Inconnue'}
                {currentDoc?.updatedBy ? ` par ${currentDoc.updatedBy}` : ''}
              </p>
            </div>

            {/* Sélecteur de mode d'affichage */}
            <div
              className="flex items-center gap-1 p-1 rounded-lg border text-xs"
              style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }}
            >
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-amber-600 text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Code size={13} />
                <span>Édition HTML</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview-mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === 'preview-mobile'
                    ? 'bg-amber-600 text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Smartphone size={13} />
                <span>Aperçu Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview-desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  viewMode === 'preview-desktop'
                    ? 'bg-amber-600 text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Laptop size={13} />
                <span>Aperçu Web</span>
              </button>
            </div>
          </div>

          {/* Formulaire & Champs */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Titre officiel du document
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Conditions Générales d'Utilisation"
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none transition-colors"
                  style={{
                    background: 'var(--background)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--foreground)',
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Numéro de version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="ex: 1.0 ou 1.1"
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none font-mono transition-colors"
                  style={{
                    background: 'var(--background)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--foreground)',
                  }}
                  required
                />
                <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
                  Incrémentez la version si vous souhaitez demander un nouveau consentement.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Date d&apos;entrée en vigueur
                </label>
                <input
                  type="text"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  placeholder="ex: 1er Octobre 2026"
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none transition-colors"
                  style={{
                    background: 'var(--background)',
                    borderColor: 'var(--card-border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                Résumé des modifications (Changelog public)
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="ex: Clarification des règles de signalement et protection des utilisateurs invités"
                className="w-full px-3 py-2 rounded-lg text-xs border outline-none transition-colors"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            {/* 4. Zone d'édition ou de prévisualisation */}
            {viewMode === 'edit' ? (
              <div className="space-y-3">
                {/* Outils d'insertion rapide */}
                <div className="flex flex-wrap items-center gap-1.5 pb-2">
                  <span className="text-[11px] font-medium mr-2" style={{ color: 'var(--text-muted)' }}>
                    Insérer :
                  </span>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<h2>Titre de section</h2>\n<p>Texte explicatif...</p>')}
                    className="px-2 py-1 rounded text-[11px] border font-mono transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                  >
                    + Section H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<div class="callout">\n  <p>Avis important ou point de vigilance pour les utilisateurs.</p>\n</div>')}
                    className="px-2 py-1 rounded text-[11px] border font-mono transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                  >
                    + Encadré Callout
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<ul>\n  <li>Règle 1</li>\n  <li>Règle 2</li>\n</ul>')}
                    className="px-2 py-1 rounded text-[11px] border font-mono transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                  >
                    + Liste à puces
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<div class="contact-card">\n  <div class="body">\n    <div class="label">Contact</div>\n    <div class="value"><a href="mailto:contact@kanto.mg">contact@kanto.mg</a></div>\n  </div>\n</div>')}
                    className="px-2 py-1 rounded text-[11px] border font-mono transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}
                  >
                    + Carte de contact
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={22}
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    className="w-full p-4 rounded-xl border text-xs font-mono leading-relaxed outline-none transition-colors"
                    style={{
                      background: 'var(--background)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--foreground)',
                    }}
                    placeholder="Saisissez le contenu HTML des conditions..."
                    required
                  />
                  <div className="flex items-center justify-between text-[11px] px-1 pt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>HTML sémantique standard compatible navigateur et WebViews iOS / Android</span>
                    <span>{contentHtml.length} caractères</span>
                  </div>
                </div>
              </div>
            ) : viewMode === 'preview-mobile' ? (
              /* Aperçu format smartphone */
              <div className="flex flex-col items-center py-4 bg-neutral-100 dark:bg-neutral-950/60 rounded-xl border p-6" style={{ borderColor: 'var(--card-border)' }}>
                <div className="text-center mb-3">
                  <span className="text-xs font-semibold flex items-center justify-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                    <Smartphone size={14} /> Aperçu WebView Mobile (Format iOS / Android)
                  </span>
                </div>
                <div
                  className="w-full max-w-[390px] h-[640px] bg-white dark:bg-[#121215] text-[#111827] dark:text-[#F4F4F5] rounded-[36px] shadow-2xl border-4 border-neutral-300 dark:border-neutral-800 overflow-hidden flex flex-col"
                >
                  {/* Barre d'état smartphone factice */}
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-900 flex items-center justify-between px-6 text-[10px] font-semibold opacity-70">
                    <span>09:41</span>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Contenu in-app scrollable */}
                  <div
                    className="p-5 overflow-y-auto flex-1 text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                </div>
              </div>
            ) : (
              /* Aperçu format web desktop */
              <div
                className="p-8 rounded-xl border max-w-4xl mx-auto text-sm leading-relaxed"
                style={{
                  background: 'var(--background)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--foreground)',
                }}
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}

            {/* Barre d'actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetToDefault}
                  disabled={isResetting || isSaving}
                  leftIcon={<RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />}
                >
                  Réinitialiser au texte officiel
                </Button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  leftIcon={<Save size={16} className={isSaving ? 'animate-spin' : ''} />}
                >
                  {isSaving ? 'Enregistrement en cours...' : 'Publier les modifications'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
