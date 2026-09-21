'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, signIn, signOut, useSession, getSession } from '@/lib/auth-client';
import { Lock, Mail, Loader2, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

/**
 * Page d'authentification des administrateurs du portail Kanto.
 * Gère la saisie des identifiants et l'accès sécurisé au panneau d'administration.
 */
export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Redirection automatique si une session ADMIN est déjà active
  useEffect(() => {
    if (!isSessionLoading && session?.user) {
      const role = (session.user as { role?: string }).role?.toUpperCase();
      if (role === 'ADMIN') {
        window.location.href = '/';
      }
    }
  }, [session, isSessionLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await signIn.email({ email: email.trim().toLowerCase(), password });
      if (res?.error) {
        setErrorMessage(res.error.message || 'Identifiants invalides');
        setIsLoading(false);
        return;
      }

      // Vérification stricte du rôle ADMIN :
      // On extrait prioritairement le rôle retourné directement dans la réponse de signIn,
      // puis en fallback la session active (pour pallier d'éventuels délais d'écriture de cookie).
      const userFromSignIn = (res?.data?.user as { role?: string } | undefined)?.role?.toUpperCase();
      let userRole = userFromSignIn;

      if (!userRole) {
        const freshSession = await getSession();
        userRole = (freshSession?.data?.user as { role?: string } | undefined)?.role?.toUpperCase();
      }

      if (userRole !== 'ADMIN') {
        await signOut();
        setErrorMessage(
          `Accès refusé. Le compte "${email.trim().toLowerCase()}" possède le rôle "${userRole || 'USER'}" et ne dispose pas des privilèges administrateur.`,
        );
        setIsLoading(false);
        return;
      }

      // Redirection immédiate vers le tableau de bord avec rechargement complet
      // pour garantir la transmission des nouveaux cookies de session HTTP à Next.js
      window.location.href = '/';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur réseau est survenue';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Veuillez renseigner votre adresse email.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: '/reset-password',
      });

      if (res?.error) {
        setErrorMessage(
          res.error.message ||
            "Une erreur est survenue lors de l'envoi de l'email de réinitialisation."
        );
      } else {
        setSuccessMessage(
          'Si cette adresse correspond à un compte administrateur, un email contenant le lien de réinitialisation vous a été envoyé.'
        );
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
      className="min-h-screen flex transition-colors"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* ── Panneau gauche : brand ────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 w-[420px] shrink-0 relative overflow-hidden"
        style={{ borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Fond décoratif */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(ellipse at 30% 60%, var(--sidebar-accent) 0%, transparent 65%)`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base font-heritage"
              style={{ background: 'var(--sidebar-accent)', color: '#080B0F' }}
            >
              K
            </div>
            <div>
              <div
                className="font-heritage font-bold text-base leading-none"
                style={{ color: 'var(--sidebar-fg)' }}
              >
                Kanto
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: 'var(--sidebar-muted)' }}
              >
                Conservatoire
              </div>
            </div>
          </div>

          <div>
            <h2
              className="text-3xl font-bold font-heritage leading-tight tracking-tight"
              style={{ color: 'var(--sidebar-fg)' }}
            >
              Ny teny malagasy
              <br />
              tsara fitahiana.
            </h2>
            <p
              className="text-sm mt-4 leading-relaxed"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              Plateforme de conservation et de valorisation du patrimoine culturel immatériel
              malagasy.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            'Phonothèque IA · Gemini TTS',
            'Corpus des Ohabolana & Fady',
            'Gamification & Rangs Culturels',
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--sidebar-accent)' }}
              />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── Panneau droit : formulaire ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-7">

          {/* Logo mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm font-heritage"
              style={{ background: 'var(--sidebar-accent)', color: '#080B0F' }}
            >
              K
            </div>
            <span
              className="font-heritage font-bold text-base"
              style={{ color: 'var(--sidebar-fg)' }}
            >
              Kanto Admin
            </span>
          </div>

          {/* Titre */}
          <div>
            <h1
              className="text-2xl font-bold font-heritage tracking-tight"
              style={{ color: 'var(--sidebar-fg)' }}
            >
              {isForgotMode ? 'Mot de passe oublié' : 'Accès Admin'}
            </h1>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              {isForgotMode
                ? 'Saisissez votre adresse email administrateur pour recevoir les instructions.'
                : 'Espace réservé aux administrateurs du Conservatoire'}
            </p>
          </div>

          {/* Erreur */}
          {errorMessage && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: 'rgba(239,68,68,0.9)',
              }}
            >
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Succès */}
          {successMessage && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: 'rgba(16,185,129,0.95)',
              }}
            >
              <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-500" />
              <div>{successMessage}</div>
            </div>
          )}

          {isForgotMode ? (
            /* Mode mot de passe oublié */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--sidebar-fg)' }}
                >
                  Adresse Email Administrateur
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--sidebar-muted)' }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kanto.mg"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-accent)]"
                    style={{
                      background: 'var(--sidebar-hover)',
                      border: '1px solid var(--sidebar-border)',
                      color: 'var(--sidebar-fg)',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                style={{
                  background: 'var(--sidebar-accent)',
                  color: '#080B0F',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Envoi du lien en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Envoyer le lien de réinitialisation</span>
                    <ArrowRight size={13} />
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
                  className="inline-flex items-center gap-1.5 text-xs hover:underline cursor-pointer"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  <ArrowLeft size={12} />
                  <span>Retour à la connexion</span>
                </button>
              </div>
            </form>
          ) : (
            /* Mode connexion standard */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium"
                  style={{ color: 'var(--sidebar-fg)' }}
                >
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--sidebar-muted)' }}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kanto.mg"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-accent)]"
                    style={{
                      background: 'var(--sidebar-hover)',
                      border: '1px solid var(--sidebar-border)',
                      color: 'var(--sidebar-fg)',
                    }}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-medium"
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
                    className="text-[11px] hover:underline cursor-pointer transition-opacity"
                    style={{ color: 'var(--sidebar-muted)' }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--sidebar-muted)' }}
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-accent)]"
                    style={{
                      background: 'var(--sidebar-hover)',
                      border: '1px solid var(--sidebar-border)',
                      color: 'var(--sidebar-fg)',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                style={{
                  background: 'var(--sidebar-accent)',
                  color: '#080B0F',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Accéder au Conservatoire</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>
          )}

          <div
            className="text-center text-[11px]"
            style={{ color: 'var(--sidebar-muted)' }}
          >
            Plateforme Kanto · Patrimoine & Langue Malagasy
          </div>
        </div>
      </div>
    </div>
  );
}
