'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient, signIn, signOut, useSession, getSession } from '@/lib/auth-client';
import {
  Lock,
  Mail,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Award,
  X,
  KeyRound,
  MailCheck,
  RotateCcw,
} from 'lucide-react';

/**
 * Composant de formulaire interne gérant l'état de connexion,
 * le basculement "Mot de passe oublié" et les paramètres d'URL.
 */
function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionLoading } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Détection du mode "Mot de passe oublié" via l'URL (?mode=forgot ou ?forgot=1)
  useEffect(() => {
    const mode = searchParams.get('mode');
    const forgot = searchParams.get('forgot');
    if (mode === 'forgot' || forgot === '1' || forgot === 'true') {
      setIsForgotMode(true);
    }
  }, [searchParams]);

  // Décompte pour le renvoi d'email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Redirection automatique si une session ADMIN est déjà active
  useEffect(() => {
    if (!isSessionLoading && session?.user) {
      const role = (session.user as { role?: string }).role?.toUpperCase();
      if (role === 'ADMIN') {
        router.replace('/');
      }
    }
  }, [session, isSessionLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await signIn.email({ email: email.trim().toLowerCase(), password });
      if (res?.error) {
        setErrorMessage(res.error.message || 'Identifiants invalides ou mot de passe incorrect.');
        setIsLoading(false);
        return;
      }

      // Vérification stricte du rôle ADMIN
      const userFromSignIn = (res?.data?.user as { role?: string } | undefined)?.role?.toUpperCase();
      let userRole = userFromSignIn;

      if (!userRole) {
        const freshSession = await getSession();
        userRole = (freshSession?.data?.user as { role?: string } | undefined)?.role?.toUpperCase();
      }

      if (userRole !== 'ADMIN') {
        await signOut();
        setErrorMessage(
          `Accès restreint. Le compte "${email.trim().toLowerCase()}" possède le rôle "${userRole || 'USER'}" et ne dispose pas des privilèges administrateur.`,
        );
        setIsLoading(false);
        return;
      }

      // Redirection vers le tableau de bord
      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur de communication est survenue.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Veuillez renseigner votre adresse email administrateur.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = origin ? `${origin}/reset-password` : '/reset-password';
      const res = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo,
      });

      if (res?.error) {
        setErrorMessage(
          res.error.message ||
            "Une erreur est survenue lors de l'envoi de l'email de réinitialisation."
        );
      } else {
        setSuccessMessage(
          'Un lien de réinitialisation sécurisé vient de vous être expédié par email.'
        );
        setResendCooldown(60);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Une erreur réseau est survenue lors de l'envoi.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative overflow-hidden transition-colors selection:bg-emerald-500/20 selection:text-emerald-300"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* ── Arrière-plan global subtil avec halo lumineux ──────────── */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20"
        style={{ background: 'radial-gradient(circle, #3FB950 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full blur-[140px] opacity-15"
        style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }}
      />

      {/* ── Panneau gauche : Brand & Présentation du Conservatoire ──── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[460px] shrink-0 relative overflow-hidden z-10"
        style={{
          borderRight: '1px solid var(--sidebar-border)',
          background: 'linear-gradient(180deg, rgba(14,18,24,0.7) 0%, rgba(8,10,13,0.95) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Motifs géométriques subtils en filigrane */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--sidebar-fg) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Partie haute : Logo & Identité */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-14">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg font-heritage shadow-lg shadow-emerald-500/20 ring-1 ring-white/10"
              style={{
                background: 'linear-gradient(135deg, #3FB950 0%, #2EA043 100%)',
                color: '#080B0F',
              }}
            >
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-heritage font-bold text-lg tracking-tight leading-none"
                  style={{ color: 'var(--sidebar-fg)' }}
                >
                  Kanto
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Admin
                </span>
              </div>
              <div
                className="text-[11px] font-mono uppercase tracking-widest mt-1"
                style={{ color: 'var(--sidebar-muted)' }}
              >
                Conservatoire National
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-white/5 border border-white/10 text-[var(--sidebar-fg)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Patrimoine Culturel Vivant Malagasy
            </div>

            <h2
              className="text-3xl xl:text-4xl font-bold font-heritage leading-[1.18] tracking-tight"
              style={{ color: 'var(--sidebar-fg)' }}
            >
              Ny teny malagasy,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                tsara fitahiana.
              </span>
            </h2>

            <p
              className="text-xs xl:text-sm leading-relaxed pt-1"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              Plateforme centralisée de gestion, de transcription et de diffusion
              des richesses culturelles et linguistiques de Madagascar.
            </p>
          </div>
        </div>

        {/* Partie médiane : Cartes piliers du conservatoire */}
        <div className="relative z-10 space-y-3.5 my-8">
          <div
            className="flex items-start gap-3.5 p-3.5 rounded-xl border transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--sidebar-border)',
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--sidebar-fg)' }}>
                Phonothèque IA Gemini TTS
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--sidebar-muted)' }}>
                Synthèse vocale native & enregistrements authentiques
              </div>
            </div>
          </div>

          <div
            className="flex items-start gap-3.5 p-3.5 rounded-xl border transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--sidebar-border)',
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BookOpen size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--sidebar-fg)' }}>
                Corpus des Ohabolana & Billets
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--sidebar-muted)' }}>
                Archives numismatiques, proverbes, contes & fady
              </div>
            </div>
          </div>

          <div
            className="flex items-start gap-3.5 p-3.5 rounded-xl border transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderColor: 'var(--sidebar-border)',
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Award size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--sidebar-fg)' }}>
                Supervision & Rangs Culturels
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--sidebar-muted)' }}>
                Gestion des apprenants, quêtes civiques & verrous
              </div>
            </div>
          </div>
        </div>

        {/* Partie basse : Badge de sécurité & Version */}
        <div
          className="relative z-10 pt-5 border-t flex items-center justify-between text-[11px]"
          style={{
            borderColor: 'var(--sidebar-border)',
            color: 'var(--sidebar-muted)',
          }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Accès sécurisé RBAC · SSL/TLS</span>
          </div>
          <span className="font-mono text-[10px]">v1.0.4</span>
        </div>
      </div>

      {/* ── Panneau droit : Formulaire d'authentification ─────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14 relative z-10">
        <div className="w-full max-w-md">

          {/* Carte principale avec effet glassmorphism élégant */}
          <div
            className="rounded-3xl p-7 sm:p-9 shadow-2xl relative overflow-hidden transition-all duration-300"
            style={{
              background: 'var(--sidebar-hover)',
              border: '1px solid var(--sidebar-border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03)',
            }}
          >
            {/* Liseré supérieur émeraude décoratif */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #3FB950 50%, transparent 100%)',
              }}
            />

            {/* Logo pour mobile */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm font-heritage shadow-md"
                style={{ background: 'var(--sidebar-accent)', color: '#080B0F' }}
              >
                K
              </div>
              <div>
                <span
                  className="font-heritage font-bold text-base block leading-none"
                  style={{ color: 'var(--sidebar-fg)' }}
                >
                  Kanto Admin
                </span>
                <span
                  className="text-[10px] font-mono uppercase tracking-wider"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  Conservatoire
                </span>
              </div>
            </div>

            {/* Alerte Erreur avec bouton fermer */}
            {errorMessage && (
              <div
                className="flex items-start gap-3 p-3.5 rounded-2xl text-xs mb-5 animate-in fade-in slide-in-from-top-2 duration-200"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#F87171',
                }}
              >
                <ShieldAlert size={16} className="shrink-0 mt-0.5 text-red-400" />
                <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 rounded-lg text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  aria-label="Fermer l'alerte"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ── Mode 1 : Mot de passe oublié — Confirmation d'envoi ─── */}
            {isForgotMode && successMessage ? (
              <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner">
                  <MailCheck size={28} />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    Instructions envoyées
                  </div>
                  <h1
                    className="text-xl font-bold font-heritage tracking-tight"
                    style={{ color: 'var(--sidebar-fg)' }}
                  >
                    Vérifiez votre boîte email
                  </h1>
                  <p
                    className="text-xs sm:text-sm leading-relaxed"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    Si l&apos;adresse <span className="font-semibold text-emerald-400">{email}</span> est
                    rattachée à un compte administrateur, un lien de réinitialisation sécurisé vous a été expédié.
                  </p>
                </div>

                <div
                  className="p-3.5 rounded-xl border text-left text-xs space-y-1.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'var(--sidebar-border)',
                  }}
                >
                  <div className="font-semibold text-[var(--sidebar-fg)] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-emerald-400" />
                    <span>Conseil de sécurité</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--sidebar-muted)' }}>
                    Le lien est valable 1 heure. Si vous ne recevez rien d&apos;ici 2 minutes, vérifiez
                    votre dossier de courriers indésirables (spams).
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isLoading || resendCooldown > 0}
                    onClick={() => handleForgotPassword()}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 border border-[var(--sidebar-border)] hover:bg-white/5"
                    style={{ color: 'var(--sidebar-fg)' }}
                  >
                    <RotateCcw size={13} />
                    <span>
                      {resendCooldown > 0
                        ? `Renvoyer un email (${resendCooldown}s)`
                        : "Renvoyer l'email de réinitialisation"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setSuccessMessage(null);
                      setErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline p-2 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    <ArrowLeft size={13} />
                    <span>Retour à la connexion</span>
                  </button>
                </div>
              </div>
            ) : isForgotMode ? (
              /* ── Mode 2 : Formulaire Mot de passe oublié ───────────── */
              <div>
                <div className="mb-7">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                    <Mail size={20} />
                  </div>

                  <h1
                    className="text-2xl font-bold font-heritage tracking-tight"
                    style={{ color: 'var(--sidebar-fg)' }}
                  >
                    Récupération de compte
                  </h1>
                  <p
                    className="text-xs sm:text-sm mt-1.5 leading-relaxed"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    Entrez l&apos;adresse email rattachée à votre profil administrateur pour recevoir
                    les instructions de réinitialisation.
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="forgot-email"
                      className="text-xs font-semibold block"
                      style={{ color: 'var(--sidebar-fg)' }}
                    >
                      Adresse Email Administrateur
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                        style={{ color: 'var(--sidebar-muted)' }}
                      />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@kanto.mg"
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        style={{
                          background: 'var(--sidebar-bg)',
                          border: '1px solid var(--sidebar-border)',
                          color: 'var(--sidebar-fg)',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-3 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 active:scale-[0.99]"
                    style={{
                      background: 'linear-gradient(135deg, #3FB950 0%, #2EA043 100%)',
                      color: '#080B0F',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Transmission en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Envoyer les instructions de réinitialisation</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(false);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline cursor-pointer transition-colors p-2 rounded-lg"
                      style={{ color: 'var(--sidebar-muted)' }}
                    >
                      <ArrowLeft size={13} />
                      <span>Retour à la page de connexion</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ── Mode 3 : Formulaire Connexion Principale ─────────── */
              <div>
                <div className="mb-7">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                    <KeyRound size={20} />
                  </div>

                  <h1
                    className="text-2xl font-bold font-heritage tracking-tight"
                    style={{ color: 'var(--sidebar-fg)' }}
                  >
                    Connexion Administrateur
                  </h1>
                  <p
                    className="text-xs sm:text-sm mt-1.5 leading-relaxed"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    Identifiez-vous pour administrer les archives et le conservatoire.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Champ Email */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login-email"
                      className="text-xs font-semibold block"
                      style={{ color: 'var(--sidebar-fg)' }}
                    >
                      Adresse Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                        style={{ color: 'var(--sidebar-muted)' }}
                      />
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@kanto.mg"
                        autoComplete="username"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        style={{
                          background: 'var(--sidebar-bg)',
                          border: '1px solid var(--sidebar-border)',
                          color: 'var(--sidebar-fg)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Champ Mot de Passe avec Toggle Afficher/Masquer */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="login-password"
                        className="text-xs font-semibold block"
                        style={{ color: 'var(--sidebar-fg)' }}
                      >
                        Mot de Passe
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotMode(true);
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-[11px] font-medium hover:underline cursor-pointer transition-opacity text-emerald-400 hover:text-emerald-300"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>

                    <div className="relative">
                      <Lock
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                        style={{ color: 'var(--sidebar-muted)' }}
                      />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="current-password"
                        className="w-full pl-10 pr-11 py-2.5 rounded-xl text-xs sm:text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        style={{
                          background: 'var(--sidebar-bg)',
                          border: '1px solid var(--sidebar-border)',
                          color: 'var(--sidebar-fg)',
                        }}
                      />
                      {/* Bouton Voir / Masquer Mot de passe */}
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        tabIndex={0}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer text-[var(--sidebar-muted)] hover:text-[var(--sidebar-fg)] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? (
                          <EyeOff size={16} className="text-emerald-400" />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bouton de Connexion */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-4 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 active:scale-[0.99]"
                    style={{
                      background: 'linear-gradient(135deg, #3FB950 0%, #2EA043 100%)',
                      color: '#080B0F',
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Vérification des privilèges...</span>
                      </>
                    ) : (
                      <>
                        <span>Accéder au Conservatoire</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Note de bas de formulaire */}
            <div
              className="mt-6 pt-5 border-t text-center text-[11px]"
              style={{
                borderColor: 'var(--sidebar-border)',
                color: 'var(--sidebar-muted)',
              }}
            >
              Portail sécurisé Kanto · Sauvegarde du patrimoine malagasy
            </div>
          </div>

          {/* Mentions légales / crédits en bas de page */}
          <div
            className="text-center text-[11px] mt-6 flex items-center justify-center gap-3"
            style={{ color: 'var(--sidebar-muted)' }}
          >
            <span>© {new Date().getFullYear()} Kanto Conservatoire</span>
            <span>•</span>
            <span>Accès Administrateurs</span>
          </div>

        </div>
      </div>
    </div>
  );
}

/**
 * Page d'authentification enveloppée dans un Suspense boundary
 * pour sécuriser l'utilisation de useSearchParams en SSR Next.js.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--sidebar-bg)' }}
        >
          <Loader2 size={28} className="animate-spin text-emerald-400" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
