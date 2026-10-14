'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTheme } from '@/lib/theme-context';
import { useSession, signOut, authClient } from '@/lib/auth-client';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import { systemService } from '@/services/system.service';
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
  Mail,
  Send,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Check,
  X,
  Smartphone,
} from 'lucide-react';

interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
}

const EMAIL_TEMPLATES = [
  {
    id: 'beta_invitation',
    label: 'Google Play — Invitation Bêta (2 étapes distinctes)',
    desc: 'Lien 1 Web obligatoire + Lien 2 Play Store direct, avec le badge exclusif Google Play',
  },
  {
    id: 'beta_registration',
    label: 'Google Play — Confirmation de candidature',
    desc: 'Récapitulatif compte, modèle appareil et prochaines étapes de validation',
  },
  {
    id: 'password_reset',
    label: 'Sécurité — Réinitialisation de mot de passe',
    desc: 'Bouton terracotta sécurisé, délai 1 heure et lien de secours',
  },
  {
    id: 'welcome',
    label: 'Bienvenue — Accueil nouvel utilisateur',
    desc: 'Présentation des piliers patrimoniaux (Angano, Kabary, Tantara, Lalao)',
  },
  {
    id: 'verification',
    label: 'Activation — Confirmation d’adresse email',
    desc: 'Lien d’activation de compte valable 24h avec bouton vert Tanimbary',
  },
  {
    id: 'feedback',
    label: 'Support — Signalement / Avis utilisateur',
    desc: 'Format de transmission du feedback utilisateur vers la boîte administrateur',
  },
  {
    id: 'system',
    label: 'Supervision — Test de configuration Resend',
    desc: 'Vérification de la délivrabilité et des métadonnées du serveur',
  },
];

type SettingsTab = 'general' | 'security' | 'system';

/**
 * Page de configuration générale et paramètres de l'administration Kanto.
 * Interface restructurée en onglets épurés : Général, Sécurité & Système.
 */
export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, zoomLevel, setZoomLevel, resetZoom } = useTheme();
  const { data: session } = useSession();
  const { toast } = useToast();

  const user = session?.user as AuthUser | undefined;

  // Onglet actif
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // État de test API
  const [isPingingApi, setIsPingingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
    message?: string;
  }>({ tested: false, success: false });

  // État du test d'envoi d'email & prévisualisation
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('beta_invitation');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewData, setPreviewData] = useState<{
    subject: string;
    html: string;
    text: string;
    template: string;
  } | null>(null);

  // État de modification du mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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
      toast.success('Préférence de la barre latérale enregistrée');
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        toast.success('Cache de session purgé avec succès');
      } catch {
        toast.error('Erreur lors de la purge du cache');
      }
    }
  };

  const testApiConnection = async () => {
    setIsPingingApi(true);
    const start = performance.now();
    try {
      await fetchApi('/contes?limit=1');
      const latency = Math.round(performance.now() - start);
      setApiStatus({
        tested: true,
        success: true,
        latencyMs: latency,
        message: `Opérationnelle (${latency}ms)`,
      });
      toast.success(`Connexion API réussie (${latency}ms)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de joindre le backend';
      setApiStatus({
        tested: true,
        success: false,
        message: msg,
      });
      toast.error(`Échec connexion API : ${msg}`);
    } finally {
      setIsPingingApi(false);
    }
  };

  const handleSendTestEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = testEmailAddress.trim() || user?.email || '';
    if (!email || !email.includes('@')) {
      toast.error('Veuillez saisir une adresse email valide');
      return;
    }
    try {
      setIsSendingTestEmail(true);
      const res = await systemService.sendTestEmail(email, selectedTemplate);
      toast.success(res.message || `Email envoyé à ${email} !`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec d'envoi de l'email";
      toast.error(msg);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handlePreviewEmail = async () => {
    try {
      setIsPreviewLoading(true);
      const email = testEmailAddress.trim() || user?.email || 'admin@kanto.mg';
      const data = await systemService.previewEmail(email, selectedTemplate);
      setPreviewData(data);
      setIsPreviewModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de prévisualisation';
      toast.error(msg);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Veuillez saisir votre mot de passe actuel');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le nouveau mot de passe doit comporter au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Les deux nouveaux mots de passe ne correspondent pas');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (res?.error) {
        toast.error(res.error.message || 'Échec de mise à jour du mot de passe');
        return;
      }

      toast.success('Mot de passe mis à jour avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur imprévue est survenue';
      toast.error(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const TABS = [
    { id: 'general' as const, label: 'Général & Affichage', icon: Sliders },
    { id: 'security' as const, label: 'Compte & Sécurité', icon: ShieldCheck },
    { id: 'system' as const, label: 'Système & Services', icon: Server },
  ];

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* En-tête de la page */}
        <PageHeader
          title="Paramètres & Configuration"
          description="Personnalisation de l'affichage, sécurité de session et supervision des services."
          icon={Sliders}
          actions={
            <button
              onClick={testApiConnection}
              disabled={isPingingApi}
              className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--foreground)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
              title="Vérifier la connectivité avec le backend NestJS"
            >
              {isPingingApi ? (
                <Loader2 size={13} className="animate-spin text-[var(--accent)]" />
              ) : (
                <Activity size={13} className="text-[var(--accent)]" />
              )}
              <span>Diagnostiquer l&apos;API</span>
            </button>
          }
        />

        {/* ── BARRE D'ONGLETS MINIMALISTE ────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[var(--accent)]' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── CONTENU : ONGLET 1 (GÉNÉRAL & AFFICHAGE) ───────────────── */}
        {activeTab === 'general' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 1. Thème d'affichage */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Sun size={14} className="text-[var(--accent)]" />
                  <span>Thème d&apos;affichage</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Sélectionnez le mode visuel de la console d&apos;administration.
                </div>
              </div>

              {/* Sélecteur de thème en pilules compactes */}
              <div className="flex items-center p-1 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Sun size={13} className="text-amber-500" />
                  <span>Clair</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Moon size={13} className="text-emerald-400" />
                  <span>Sombre</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    theme === 'system'
                      ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Laptop size={13} className="text-[var(--text-muted)]" />
                  <span>Système</span>
                </button>
              </div>
            </div>

            {/* 2. Facteur de Zoom & Densité */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <ZoomIn size={14} className="text-[var(--accent)]" />
                    <span>Densité de l&apos;interface &amp; Zoom</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Ajustez l&apos;échelle globale des textes et composants.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent-text)]">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={resetZoom}
                    title="Rétablir à 100%"
                    className="p-1 rounded-md border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Slider et contrôles compacts */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoomLevel(Math.max(80, zoomLevel - 5))}
                  disabled={zoomLevel <= 80}
                  className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-30 transition cursor-pointer"
                  title="Réduire"
                >
                  <ZoomOut size={14} />
                </button>

                <div className="flex-1 flex items-center px-2.5 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)]">
                  <input
                    type="range"
                    min="80"
                    max="130"
                    step="5"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseInt(e.target.value, 10))}
                    className="w-full accent-[var(--accent)] cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => setZoomLevel(Math.min(130, zoomLevel + 5))}
                  disabled={zoomLevel >= 130}
                  className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-30 transition cursor-pointer"
                  title="Agrandir"
                >
                  <ZoomIn size={14} />
                </button>

                {/* Préréglages rapides */}
                <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[var(--card-border)]">
                  {[85, 100, 115, 130].map((val) => (
                    <button
                      key={val}
                      onClick={() => setZoomLevel(val)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition cursor-pointer ${
                        zoomLevel === val
                          ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Navigation & Maintenance Locale */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] divide-y divide-[var(--card-border)]">
              {/* Sidebar compacte */}
              <div className="flex items-center justify-between pb-3">
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Barre latérale compacte par défaut
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Conserver le menu rétracté (58px) pour maximiser l&apos;espace utile.
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

              {/* Purge du cache */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">
                    Mémoire cache et données locales
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Purger les données de session temporaires en cas de désynchronisation.
                  </div>
                </div>

                <button
                  onClick={handleClearCache}
                  className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Trash2 size={13} />
                  <span>Purger le cache</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENU : ONGLET 2 (COMPTE & SÉCURITÉ) ─────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Profil connecté */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--accent-light)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent-text)] shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--foreground)]">
                      {user?.name || 'Administrateur'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {user?.role || 'ADMIN'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                    {user?.email || 'admin@kanto.mg'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
              >
                <LogOut size={13} />
                <span>Se déconnecter</span>
              </button>
            </div>

            {/* Modification du mot de passe */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-4">
              <div>
                <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <KeyRound size={14} className="text-[var(--accent)]" />
                  <span>Modifier mon mot de passe administrateur</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Définissez une clé d&apos;accès sécurisée pour votre compte Kanto.
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Mot de passe actuel */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--foreground)]">
                      Mot de passe actuel
                    </label>
                    <div className="relative">
                      <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Nouveau mot de passe */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--foreground)]">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 caractères"
                        autoComplete="new-password"
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--foreground)]">
                      Confirmation
                    </label>
                    <div className="relative">
                      <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="new-password"
                        className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
                      >
                        {showConfirmNewPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[var(--card-border)]">
                  <label className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={revokeOtherSessions}
                      onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                      className="accent-[var(--accent)] rounded"
                    />
                    <span>Révoquer les autres sessions ouvertes sur d&apos;autres appareils</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword || newPassword.length < 8 || newPassword !== confirmNewPassword}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs self-end sm:self-auto"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Mise à jour...</span>
                      </>
                    ) : (
                      <>
                        <Check size={12} />
                        <span>Enregistrer le mot de passe</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── CONTENU : ONGLET 3 (SYSTÈME & SERVICES) ────────────────── */}
        {activeTab === 'system' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Diagnostic API & Services */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                    <Server size={14} className="text-[var(--accent)]" />
                    <span>État de l&apos;Infrastructure Kanto</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Vue d&apos;ensemble des services cloud et de la base de données.
                  </div>
                </div>

                {apiStatus.tested && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      apiStatus.success
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    API {apiStatus.message}
                  </span>
                )}
              </div>

              {/* 4 cartes compactes de services */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
                  <div className="flex items-center justify-between">
                    <Server size={14} className="text-emerald-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">API NestJS</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">Port 3000 • Core</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
                  <div className="flex items-center justify-between">
                    <Mic size={14} className="text-purple-500" />
                    <span className="text-[10px] font-mono font-bold text-purple-500">IA</span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">Gemini TTS</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">Synthèse vocale</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
                  <div className="flex items-center justify-between">
                    <Cloud size={14} className="text-sky-500" />
                    <span className="text-[10px] font-mono font-bold text-sky-500">CDN</span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">Cloudinary</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">Médias &amp; Audios</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
                  <div className="flex items-center justify-between">
                    <Database size={14} className="text-blue-500" />
                    <span className="text-[10px] font-mono font-bold text-blue-500">v7</span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--foreground)]">PostgreSQL</div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">Prisma ORM</div>
                </div>
              </div>
            </div>

            {/* Console de test d'e-mails (Resend) */}
            <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-3">
              <div>
                <div className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Mail size={14} className="text-[var(--accent)]" />
                  <span>Supervision &amp; Test des Modèles d&apos;E-mails (Resend)</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Vérifiez la mise en page et la délivrabilité des notifications officielles Kanto.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Choix du modèle */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--foreground)]">
                    Modèle d&apos;e-mail
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)] cursor-pointer"
                  >
                    {EMAIL_TEMPLATES.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Adresse destinataire */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[var(--foreground)]">
                      Adresse de test
                    </label>
                    {user?.email && (
                      <button
                        type="button"
                        onClick={() => setTestEmailAddress(user.email || '')}
                        className="text-[10px] text-[var(--accent)] hover:underline cursor-pointer"
                      >
                        Mon email
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder={user?.email || 'admin@kanto.mg'}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-hidden focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Actions d'aperçu et d'envoi */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={handlePreviewEmail}
                  disabled={isPreviewLoading}
                  className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isPreviewLoading ? (
                    <Loader2 size={13} className="animate-spin text-[var(--accent)]" />
                  ) : (
                    <Eye size={13} className="text-[var(--accent)]" />
                  )}
                  <span>Aperçu HTML</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendTestEmail()}
                  disabled={isSendingTestEmail}
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSendingTestEmail ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{isSendingTestEmail ? 'Envoi...' : 'Envoyer test réel'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALE D'APERÇU D'EMAIL KANTO EN DIRECT ───────────────── */}
      {isPreviewModalOpen && previewData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[90vh] bg-[var(--card)] border border-[var(--card-border)] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Header de la modale */}
            <div className="px-5 py-3 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-[var(--foreground)] truncate">
                    Aperçu HTML — {previewData.subject}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 font-mono">
                  Modèle : {previewData.template}
                </div>
              </div>

              {/* Contrôles vue Desktop / Mobile & Fermeture */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center p-0.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer font-medium ${
                      previewDevice === 'desktop'
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Laptop size={13} />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition cursor-pointer font-medium ${
                      previewDevice === 'mobile'
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Smartphone size={13} />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition cursor-pointer"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Corps : iframe isolée et responsive */}
            <div className="flex-1 bg-[#EAE8E3] dark:bg-[#1E1E1C] overflow-y-auto p-4 flex justify-center items-start">
              <div
                className="transition-all duration-300 shadow-xl rounded-xl overflow-hidden bg-white"
                style={{
                  width: previewDevice === 'mobile' ? '375px' : '600px',
                  maxWidth: '100%',
                  minHeight: '600px',
                }}
              >
                <iframe
                  title="Prévisualisation Email"
                  srcDoc={previewData.html}
                  className="w-full h-[70vh] border-0"
                  sandbox="allow-same-origin allow-popups"
                />
              </div>
            </div>

            {/* Pied de la modale */}
            <div className="px-5 py-2.5 border-t border-[var(--card-border)] bg-[var(--card)] flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-[var(--text-muted)] hidden sm:block">
                Charte graphique officielle Kanto
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-xs font-semibold cursor-pointer"
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    handleSendTestEmail();
                  }}
                  disabled={isSendingTestEmail}
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send size={13} />
                  <span>Envoyer réel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
