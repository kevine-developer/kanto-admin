'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTheme } from '@/lib/theme-context';
import { useSession, signOut } from '@/lib/auth-client';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  Sliders,
  Sun,
  Moon,
  Laptop,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  User,
  ShieldCheck,
  Server,
  Database,
  Cloud,
  Mic,
  Activity,
  LogOut,
  Trash2,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';

interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

/**
 * Page de configuration générale et paramètres de l'administration Kanto.
 * Gère le thème, le zoom d'affichage, les préférences de sidebar et le diagnostic d'API.
 */
export default function SettingsPage() {
  const { theme, resolvedTheme, setTheme, zoomLevel, setZoomLevel, resetZoom } = useTheme();
  const { data: session } = useSession();
  const { toast } = useToast();

  const user = session?.user as AuthUser | undefined;

  // État de test API
  const [isPingingApi, setIsPingingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    message?: string;
  }>({ tested: false, success: false });

  // État de la sidebar mémorisée
  const [defaultCollapsed, setDefaultCollapsed] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem('kanto-sidebar-collapsed');
    if (saved !== null) {
      setDefaultCollapsed(saved === 'true');
    }
  }, []);

  const handleToggleDefaultSidebar = () => {
    const next = !defaultCollapsed;
    setDefaultCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kanto-sidebar-collapsed', String(next));
      toast.success('Préférence de la barre latérale mise à jour');
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        toast.success('Cache de session et données temporaires purgés avec succès');
      } catch {
        toast.error('Erreur lors de la purge du cache');
      }
    }
  };

  const testApiConnection = async () => {
    setIsPingingApi(true);
    const start = performance.now();
    try {
      // Test de connectivité vers l'API
      await fetchApi('/contes?limit=1');
      const end = performance.now();
      const latency = Math.round(end - start);
      setApiStatus({
        tested: true,
        success: true,
        latencyMs: latency,
        message: `API opérationnelle (${latency}ms)`,
      });
      toast.success(`Connexion API réussie (${latency}ms)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de joindre le backend';
      setApiStatus({
        tested: true,
        success: false,
        message: msg,
      });
      toast.error(`Échec de connexion API : ${msg}`);
    } finally {
      setIsPingingApi(false);
    }
  };

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* En-tête de la page */}
        <PageHeader
          title="Paramètres & Configuration"
          description="Personnalisation de l'affichage, ergonomie visuelle, état des services et gestion de votre session."
          icon={Sliders}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={testApiConnection}
                disabled={isPingingApi}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--foreground)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                title="Vérifier la communication avec le backend NestJS"
              >
                {isPingingApi ? (
                  <Loader2 size={13} className="animate-spin text-[var(--accent)]" />
                ) : (
                  <Activity size={13} className="text-[var(--accent)]" />
                )}
                <span>Diagnostiquer l&apos;API</span>
              </button>
            </div>
          }
        />

        {/* ── 1. APPARENCE & THÈME VISUEL ─────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Sun size={14} className="text-[var(--accent)]" />
              <span>Apparence &amp; Thème Visuel</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-subtle)]">
              Actif : {resolvedTheme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Carte Clair */}
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                theme === 'light'
                  ? 'border-[var(--accent)] bg-[var(--card)] shadow-sm ring-2 ring-[var(--accent)]/20'
                  : 'border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--text-subtle)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Sun size={16} />
                </div>
                {theme === 'light' && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--foreground)]">Thème Clair</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Idéal en journée et pour une lecture nette à fort contraste.
                </div>
              </div>
            </button>

            {/* Carte Sombre */}
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                theme === 'dark'
                  ? 'border-[var(--accent)] bg-[var(--card)] shadow-sm ring-2 ring-[var(--accent)]/20'
                  : 'border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--text-subtle)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400">
                  <Moon size={16} />
                </div>
                {theme === 'dark' && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--foreground)]">Thème Sombre</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Confort visuel nocturne, repos oculaire et économie d&apos;énergie.
                </div>
              </div>
            </button>

            {/* Carte Système */}
            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden ${
                theme === 'system'
                  ? 'border-[var(--accent)] bg-[var(--card)] shadow-sm ring-2 ring-[var(--accent)]/20'
                  : 'border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--text-subtle)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)]">
                  <Laptop size={16} />
                </div>
                {theme === 'system' && (
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--foreground)]">Automatique (OS)</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  S&apos;adapte automatiquement aux réglages de votre système d&apos;exploitation.
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* ── 2. ZOOM & ERGONOMIE TYPOGRAPHIQUE ─────────────────────── */}
        <section className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--card-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <ZoomIn size={16} className="text-[var(--accent)]" />
                <span>Échelle Typographique &amp; Facteur de Zoom</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Ajustez la taille du texte et la densité des composants pour un confort de lecture personnalisé.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent-text)]">
                {zoomLevel}%
              </span>
              <button
                onClick={resetZoom}
                title="Rétablir à 100%"
                className="p-1.5 rounded-md border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Contrôles Zoom Slider & Stepper */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setZoomLevel(zoomLevel - 5)}
              disabled={zoomLevel <= 80}
              className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-30 transition cursor-pointer"
              title="Réduire"
            >
              <ZoomOut size={16} />
            </button>

            <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
              <input
                type="range"
                min="80"
                max="135"
                step="5"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseInt(e.target.value, 10))}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
            </div>

            <button
              onClick={() => setZoomLevel(zoomLevel + 5)}
              disabled={zoomLevel >= 135}
              className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-30 transition cursor-pointer"
              title="Agrandir"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          {/* Raccourcis Presets rapides */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { label: 'Compact (85%)', val: 85 },
              { label: 'Standard (100%)', val: 100 },
              { label: 'Confort (110%)', val: 110 },
              { label: 'Grand (125%)', val: 125 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setZoomLevel(p.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  zoomLevel === p.val
                    ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold'
                    : 'border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Aperçu en direct */}
          <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1">
              <Sparkles size={11} className="text-[var(--accent)]" />
              <span>Aperçu en direct du patrimoine typographique</span>
            </div>
            <div className="text-xs font-semibold text-[var(--foreground)]">
              « Ny fahaizana toy ny ketsa : kolokoloy mba haniry »
            </div>
            <div className="text-[11px] text-[var(--text-muted)] italic">
              Le savoir est comme le plant de riz : cultivez-le pour qu&apos;il grandisse et porte ses fruits.
            </div>
          </div>
        </section>

        {/* ── 3. COMPTE ADMINISTRATEUR & SESSION ───────────────────── */}
        <section className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <User size={16} className="text-[var(--accent)]" />
                <span>Session &amp; Profil Administrateur</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Informations du compte authentifié pour les actions d&apos;écriture et de modération.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck size={12} />
              <span>{user?.role || 'ADMIN'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-1">
              <div className="text-[10px] font-mono uppercase text-[var(--text-subtle)]">Nom complet</div>
              <div className="font-semibold text-[var(--foreground)]">
                {user?.name || 'Administrateur Principal'}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-1">
              <div className="text-[10px] font-mono uppercase text-[var(--text-subtle)]">Adresse courriel</div>
              <div className="font-mono font-medium text-[var(--foreground)]">
                {user?.email || 'admin@kanto.mg'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Info size={13} className="text-[var(--accent)]" />
              <span>Authentification sécurisée par Better-Auth &amp; Session HTTP Only.</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <LogOut size={13} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </section>

        {/* ── 4. INFRASTRUCTURE & SERVICES CLOUD ───────────────────── */}
        <section className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Server size={16} className="text-[var(--accent)]" />
                <span>Services Connectés &amp; Moteurs IA</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                État des composants d&apos;arrière-plan, du moteur TTS Gemini et du stockage CDN.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Backend NestJS */}
            <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-[var(--accent)] shrink-0">
                <Server size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-bold text-[var(--foreground)]">API NestJS</div>
                  {!apiStatus.tested ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[var(--text-muted)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                      Non testé
                    </span>
                  ) : apiStatus.success ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connecté
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-rose-600 dark:text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Indisponible
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-[var(--text-muted)] truncate mt-0.5">
                  http://localhost:3000
                </div>
                {apiStatus.tested && (
                  <div className="text-[10px] font-medium text-[var(--accent)] mt-1">
                    {apiStatus.message}
                  </div>
                )}
              </div>
            </div>

            {/* Google Gemini TTS */}
            <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-purple-500 shrink-0">
                <Mic size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-bold text-[var(--foreground)]">Google Gemini TTS</div>
                  <span className="text-[10px] font-mono font-medium text-purple-600 dark:text-purple-400">
                    Actif
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Synthèse vocale des contes et phonothèque Malagasy &amp; Français.
                </div>
              </div>
            </div>

            {/* Cloudinary CDN */}
            <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-sky-500 shrink-0">
                <Cloud size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-bold text-[var(--foreground)]">Cloudinary CDN</div>
                  <span className="text-[10px] font-mono font-medium text-sky-600 dark:text-sky-400">
                    Distribué
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Hébergement haute disponibilité des audios et photos d&apos;onboarding.
                </div>
              </div>
            </div>

            {/* PostgreSQL & Prisma */}
            <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-blue-500 shrink-0">
                <Database size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-bold text-[var(--foreground)]">PostgreSQL &amp; Prisma</div>
                  <span className="text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400">
                    Prisma 7
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Base relationnelle du conservatoire et registre des sagesses.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. PRÉFÉRENCES SYSTÈME & CACHE ───────────────────────── */}
        <section className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-4">
          <div className="border-b border-[var(--card-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Préférences Système &amp; Maintenance Locale
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Gérez le comportement par défaut de votre interface et la mémoire locale du navigateur.
            </p>
          </div>

          <div className="space-y-3">
            {/* Option Sidebar Collapsed */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)]">
              <div>
                <div className="text-xs font-semibold text-[var(--foreground)]">
                  Mode compact par défaut pour la barre latérale
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Conserver la barre latérale rétractée (58px) pour maximiser l&apos;espace de travail.
                </div>
              </div>
              <button
                onClick={handleToggleDefaultSidebar}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  defaultCollapsed ? 'bg-[var(--accent)]' : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    defaultCollapsed ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Option Purge du Cache */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)]">
              <div>
                <div className="text-xs font-semibold text-[var(--foreground)]">
                  Purger le cache local de l&apos;application
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Réinitialise les états temporaires en cas de désynchronisation de l&apos;interface.
                </div>
              </div>
              <button
                onClick={handleClearCache}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 size={13} />
                <span>Purger</span>
              </button>
            </div>
          </div>
        </section>

        {/* Footer info Kanto */}
        <div className="text-center text-[11px] font-mono text-[var(--text-subtle)] pt-2">
          Kanto Conservatoire Malagasy • Admin Console v1.0.0 • Architecture Next.js &amp; NestJS
        </div>
      </div>
    </AdminShell>
  );
}
