'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  FileText,
  ShieldCheck,
  RotateCcw,
  Save,
  ExternalLink,
  Code,
  Smartphone,
  Laptop,
  Users,
  CheckCircle2,
  AlertTriangle,
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

  // État du formulaire
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [summary, setSummary] = useState('');
  const [contentHtml, setContentHtml] = useState('');

  // Mode d'affichage
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
      toast.error('Le numéro de version est requis (ex: 1.0).');
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
        toast.success(`"${title}" publié avec succès !`);
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

  const insertSnippet = (snippet: string) => {
    setContentHtml((prev) => prev + '\n\n' + snippet);
    toast.info('Bloc inséré à la fin du document.');
  };

  const currentDoc = documents.find((d) => d.slug === selectedSlug);

  return (
    <AdminShell>
      <div className="space-y-5 max-w-5xl mx-auto pb-12">
        {/* En-tête épuré */}
        <PageHeader
          title="CGU & Textes Juridiques"
          description="Gestion des conditions d'utilisation, politique de confidentialité et conformité utilisateur."
          icon={FileText}
          actions={
            <div className="flex items-center gap-2">
              <a
                href={`/api-proxy/pages/${selectedSlug}?embed=true`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition-colors shadow-xs"
                title="Consulter la vue WebView telle qu'affichée sur l'application mobile"
              >
                <ExternalLink size={13} className="text-[var(--accent)]" />
                <span>Page publique</span>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                leftIcon={<RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />}
              >
                Actualiser
              </Button>
            </div>
          }
        />

        {/* Barre de métriques compacte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Version active</span>
              <ShieldCheck size={13} className="text-[var(--accent)]" />
            </div>
            <div className="text-base font-bold font-mono text-[var(--foreground)]">
              {stats ? `v${stats.activeVersion}` : 'v1.0'}
            </div>
            <div className="text-[10px] text-[var(--text-subtle)] truncate">
              {effectiveDate || 'En vigueur'}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Couverture légale</span>
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {stats ? `${stats.acceptanceRate}%` : '100%'}
            </div>
            <div className="text-[10px] text-[var(--text-subtle)]">Conforme RGPD</div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Comptes à jour</span>
              <Users size={13} className="text-sky-500" />
            </div>
            <div className="text-base font-bold font-mono text-[var(--foreground)]">
              {stats?.acceptedCurrentVersion ?? 0}
            </div>
            <div className="text-[10px] text-[var(--text-subtle)]">
              sur {stats?.totalUsers ?? 0} utilisateurs
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>À renouveler</span>
              <AlertTriangle size={13} className="text-amber-500" />
            </div>
            <div className="text-base font-bold font-mono text-[var(--foreground)]">
              {(stats?.acceptedOlderVersion ?? 0) + (stats?.unacceptedOrUnknown ?? 0)}
            </div>
            <div className="text-[10px] text-[var(--text-subtle)]">Versions antérieures</div>
          </div>
        </div>

        {/* Sélecteur de document (Pills épurées) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] w-fit">
          <button
            type="button"
            onClick={() => handleSelectSlug('terms')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedSlug === 'terms'
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <FileText size={14} className={selectedSlug === 'terms' ? 'text-[var(--accent)]' : ''} />
            <span>Conditions d&apos;Utilisation (CGU)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSlug('privacy')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedSlug === 'privacy'
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <ShieldCheck size={14} className={selectedSlug === 'privacy' ? 'text-[var(--accent)]' : ''} />
            <span>Politique de Confidentialité</span>
          </button>
        </div>

        {/* Zone Principale : Édition & Prévisualisation */}
        <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-5">
          {/* En-tête de section avec sélecteur de vue */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  {title || (selectedSlug === 'terms' ? 'CGU Kanto' : 'Politique de confidentialité')}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                  v{version || '1.0'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Mis à jour le {currentDoc?.updatedAt ? new Date(currentDoc.updatedAt).toLocaleDateString('fr-FR') : 'Inconnue'}
                {currentDoc?.updatedBy ? ` par ${currentDoc.updatedBy}` : ''}
              </p>
            </div>

            {/* Commutateur de vue en pilules */}
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Code size={13} />
                <span>Édition HTML</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview-mobile')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  viewMode === 'preview-mobile'
                    ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Smartphone size={13} />
                <span>Mobile (375px)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview-desktop')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                  viewMode === 'preview-desktop'
                    ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Laptop size={13} />
                <span>Web Plein écran</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Métadonnées du document */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--foreground)]">
                  Titre officiel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Conditions Générales d'Utilisation"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--foreground)]">
                  Numéro de version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--foreground)]">
                  Date d&apos;entrée en vigueur
                </label>
                <input
                  type="text"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  placeholder="ex: 1er Octobre 2026"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--foreground)]">
                Résumé des modifications (Changelog public)
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="ex: Clarification des règles de signalement et protection des utilisateurs"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Corps selon le mode actif */}
            {viewMode === 'edit' ? (
              <div className="space-y-2 pt-1">
                {/* Outils d'insertion rapide */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[var(--text-muted)] mr-1">Raccourcis :</span>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<h2>Titre de section</h2>\n<p>Texte explicatif...</p>')}
                    className="px-2 py-0.5 rounded text-[11px] border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-mono transition cursor-pointer"
                  >
                    + Titre H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<div class="callout">\n  <p>Avis important pour les utilisateurs.</p>\n</div>')}
                    className="px-2 py-0.5 rounded text-[11px] border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-mono transition cursor-pointer"
                  >
                    + Encadré Callout
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<ul>\n  <li>Règle 1</li>\n  <li>Règle 2</li>\n</ul>')}
                    className="px-2 py-0.5 rounded text-[11px] border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-mono transition cursor-pointer"
                  >
                    + Liste à puces
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<div class="contact-card">\n  <div class="body">\n    <div class="label">Contact</div>\n    <div class="value"><a href="mailto:contact@kanto.mg">contact@kanto.mg</a></div>\n  </div>\n</div>')}
                    className="px-2 py-0.5 rounded text-[11px] border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] font-mono transition cursor-pointer"
                  >
                    + Contact
                  </button>
                </div>

                <textarea
                  rows={18}
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] text-xs font-mono leading-relaxed outline-none focus:border-[var(--accent)]"
                  placeholder="Saisissez le contenu HTML des conditions..."
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] px-1">
                  <span>HTML sémantique standard compatible iOS &amp; Android</span>
                  <span>{contentHtml.length} caractères</span>
                </div>
              </div>
            ) : viewMode === 'preview-mobile' ? (
              <div className="flex flex-col items-center py-6 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)]">
                <div className="w-full max-w-[375px] min-h-[550px] bg-white dark:bg-[#121215] text-[#111827] dark:text-[#F4F4F5] rounded-[32px] shadow-xl border-4 border-neutral-300 dark:border-neutral-800 overflow-hidden flex flex-col">
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-900 flex items-center justify-between px-5 text-[9px] font-semibold opacity-60">
                    <span>09:41</span>
                    <span>100%</span>
                  </div>
                  <div
                    className="p-4 overflow-y-auto flex-1 text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="p-6 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] text-xs leading-relaxed max-w-3xl mx-auto"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            )}

            {/* Actions de publication */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                disabled={isResetting || isSaving}
                leftIcon={<RotateCcw size={13} className={isResetting ? 'animate-spin' : ''} />}
              >
                Réinitialiser
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                leftIcon={<Save size={14} className={isSaving ? 'animate-spin' : ''} />}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer et publier'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
