'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import {
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Check,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Critères de sécurité en direct
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialOrUpper = /[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Calcul du score de robustesse (0 à 3)
  const strengthScore = [
    hasMinLength,
    hasNumber,
    hasSpecialOrUpper,
  ].filter(Boolean).length;

  // Compte à rebours de redirection après succès
  useEffect(() => {
    if (!isSuccess) return;
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage(
        'Lien de réinitialisation invalide ou token de sécurité manquant. Veuillez faire une nouvelle demande.'
      );
      return;
    }

    if (!hasMinLength) {
      setErrorMessage('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (res?.error) {
        setErrorMessage(
          res.error.message ||
            'Ce lien a expiré ou a déjà été utilisé. Veuillez redemander un lien de réinitialisation.'
        );
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Une erreur imprévue est survenue lors de la réinitialisation.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors selection:bg-emerald-500/20 selection:text-emerald-300"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* ── Halos lumineux d'ambiance Kanto ────────────────────────── */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[130px] opacity-20"
        style={{ background: 'radial-gradient(circle, #3FB950 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[130px] opacity-15"
        style={{ background: 'radial-gradient(circle, #D97706 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Carte principale avec style glassmorphism */}
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

          {/* En-tête : Logo & Marque */}
          <div className="flex items-center gap-3.5 mb-7">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base font-heritage shadow-lg shadow-emerald-500/20 ring-1 ring-white/10"
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
                  className="font-heritage font-bold text-base tracking-tight leading-none"
                  style={{ color: 'var(--sidebar-fg)' }}
                >
                  Kanto
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Admin
                </span>
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-widest mt-1"
                style={{ color: 'var(--sidebar-muted)' }}
              >
                Conservatoire National
              </div>
            </div>
          </div>

          {/* ── Cas 1 : Token manquant dans l'URL ──────────────────── */}
          {!token && !isSuccess ? (
            <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
                <ShieldAlert size={28} />
              </div>

              <div className="space-y-2">
                <h1
                  className="text-xl font-bold font-heritage tracking-tight"
                  style={{ color: 'var(--sidebar-fg)' }}
                >
                  Lien de sécurité manquant
                </h1>
                <p
                  className="text-xs sm:text-sm leading-relaxed max-w-sm mx-auto"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  Pour définir un mot de passe administrateur, vous devez utiliser le lien
                  personnalisé reçu par email contenant votre clé de validation.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/login?mode=forgot"
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 active:scale-[0.99]"
                  style={{
                    background: 'linear-gradient(135deg, #3FB950 0%, #2EA043 100%)',
                    color: '#080B0F',
                  }}
                >
                  <span>Demander un nouveau lien</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  <ArrowLeft size={13} />
                  <span>Retour à la page de connexion</span>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            /* ── Cas 2 : Succès de la réinitialisation ──────────────── */
            <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <CheckCircle2 size={32} />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles size={12} />
                  Compte sécurisé avec succès
                </div>
                <h1
                  className="text-2xl font-bold font-heritage tracking-tight"
                  style={{ color: 'var(--sidebar-fg)' }}
                >
                  Mot de passe mis à jour !
                </h1>
                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  Votre nouveau mot de passe administrateur est immédiatement opérationnel.
                  Redirection automatique dans <span className="font-bold text-emerald-400">{redirectCountdown}s</span>...
                </p>
              </div>

              {/* Barre de progression de redirection */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${((3 - redirectCountdown) / 3) * 100}%` }}
                />
              </div>

              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #3FB950 0%, #2EA043 100%)',
                  color: '#080B0F',
                }}
              >
                <span>Accéder immédiatement à la connexion</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            /* ── Cas 3 : Formulaire de saisie du nouveau mot de passe ─── */
            <div>
              {/* Titre & Description */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                  <KeyRound size={20} />
                </div>
                <h1
                  className="text-2xl font-bold font-heritage tracking-tight"
                  style={{ color: 'var(--sidebar-fg)' }}
                >
                  Nouveau mot de passe
                </h1>
                <p
                  className="text-xs sm:text-sm mt-1 leading-relaxed"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  Choisissez un mot de passe robuste pour protéger votre accès au Conservatoire.
                </p>
              </div>

              {/* Message d'erreur */}
              {errorMessage && (
                <div
                  className="flex items-start gap-3 p-3.5 rounded-2xl text-xs mb-5 animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#F87171',
                  }}
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Champ Nouveau mot de passe */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="new-password"
                    className="text-xs font-semibold block"
                    style={{ color: 'var(--sidebar-fg)' }}
                  >
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--sidebar-muted)' }}
                    />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl text-xs sm:text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      style={{
                        background: 'var(--sidebar-bg)',
                        border: '1px solid var(--sidebar-border)',
                        color: 'var(--sidebar-fg)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
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

                  {/* Barre visuelle de robustesse */}
                  {password.length > 0 && (
                    <div className="pt-1.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span style={{ color: 'var(--sidebar-muted)' }}>Robustesse :</span>
                        <span
                          className={`font-semibold ${
                            strengthScore === 3
                              ? 'text-emerald-400'
                              : strengthScore === 2
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {strengthScore === 3
                            ? 'Forte'
                            : strengthScore === 2
                            ? 'Moyenne'
                            : 'Insuffisante'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 h-1.5">
                        <div
                          className={`rounded-full transition-all duration-300 ${
                            strengthScore >= 1
                              ? strengthScore === 1
                                ? 'bg-red-400'
                                : strengthScore === 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                              : 'bg-white/10'
                          }`}
                        />
                        <div
                          className={`rounded-full transition-all duration-300 ${
                            strengthScore >= 2
                              ? strengthScore === 2
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                              : 'bg-white/10'
                          }`}
                        />
                        <div
                          className={`rounded-full transition-all duration-300 ${
                            strengthScore >= 3 ? 'bg-emerald-400' : 'bg-white/10'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Champ Confirmation du mot de passe */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirm-password"
                    className="text-xs font-semibold block"
                    style={{ color: 'var(--sidebar-fg)' }}
                  >
                    Confirmez le mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--sidebar-muted)' }}
                    />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl text-xs sm:text-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                      style={{
                        background: 'var(--sidebar-bg)',
                        border: '1px solid var(--sidebar-border)',
                        color: 'var(--sidebar-fg)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      tabIndex={0}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer text-[var(--sidebar-muted)] hover:text-[var(--sidebar-fg)] hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      aria-label={
                        showConfirmPassword
                          ? 'Masquer la confirmation'
                          : 'Afficher la confirmation'
                      }
                      title={
                        showConfirmPassword
                          ? 'Masquer la confirmation'
                          : 'Afficher la confirmation'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} className="text-emerald-400" />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Checklist des exigences de sécurité */}
                <div
                  className="p-3.5 rounded-2xl border space-y-2 text-[11px]"
                  style={{
                    background: 'var(--sidebar-bg)',
                    borderColor: 'var(--sidebar-border)',
                  }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--sidebar-muted)]">
                    Exigences du compte
                  </div>
                  <div className="space-y-1.5">
                    <div
                      className={`flex items-center gap-2 transition-colors ${
                        hasMinLength ? 'text-emerald-400 font-medium' : 'text-[var(--sidebar-muted)]'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${
                          hasMinLength
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-transparent'
                        }`}
                      >
                        <Check size={10} />
                      </div>
                      <span>Au moins 8 caractères</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 transition-colors ${
                        hasNumber ? 'text-emerald-400 font-medium' : 'text-[var(--sidebar-muted)]'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${
                          hasNumber
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-transparent'
                        }`}
                      >
                        <Check size={10} />
                      </div>
                      <span>Au moins un chiffre (0-9)</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 transition-colors ${
                        passwordsMatch
                          ? 'text-emerald-400 font-medium'
                          : confirmPassword.length > 0
                          ? 'text-red-400'
                          : 'text-[var(--sidebar-muted)]'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${
                          passwordsMatch
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-transparent'
                        }`}
                      >
                        <Check size={10} />
                      </div>
                      <span>
                        {passwordsMatch
                          ? 'Les deux mots de passe correspondent'
                          : confirmPassword.length > 0
                          ? 'Les mots de passe ne correspondent pas'
                          : 'Correspondance des deux mots de passe'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton de soumission */}
                <button
                  type="submit"
                  disabled={isLoading || !hasMinLength || !passwordsMatch}
                  className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-4 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 active:scale-[0.99]"
                  style={{
                    background: 'linear-gradient(135deg, #3FB950 0%, #2EA043 100%)',
                    color: '#080B0F',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Enregistrement sécurisé...</span>
                    </>
                  ) : (
                    <>
                      <span>Valider mon nouveau mot de passe</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Lien retour */}
              <div className="text-center pt-5">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs hover:underline cursor-pointer transition-colors"
                  style={{ color: 'var(--sidebar-muted)' }}
                >
                  <ArrowLeft size={13} />
                  <span>Retour à la page de connexion</span>
                </Link>
              </div>
            </div>
          )}

          {/* Pied de carte */}
          <div
            className="mt-6 pt-5 border-t flex items-center justify-between text-[11px]"
            style={{
              borderColor: 'var(--sidebar-border)',
              color: 'var(--sidebar-muted)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Chiffrement AES-256</span>
            </div>
            <span>Kanto Conservatoire</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordForm />
    </Suspense>
  );
}
