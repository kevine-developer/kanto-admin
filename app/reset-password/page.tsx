'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage(
        "Lien de réinitialisation invalide ou token manquant. Veuillez redemander un lien."
      );
      return;
    }

    if (password.length < 8) {
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
            'Le lien a expiré ou est invalide. Veuillez recommencer la procédure.'
        );
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la réinitialisation.';
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 transition-colors"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
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
              Conservatoire Admin
            </div>
          </div>
        </div>

        {/* Titre & Sous-titre */}
        <div>
          <h1
            className="text-2xl font-bold font-heritage tracking-tight"
            style={{ color: 'var(--sidebar-fg)' }}
          >
            Configuration du mot de passe
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--sidebar-muted)' }}>
            Définissez le mot de passe de votre compte administrateur Kanto.
          </p>
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl text-xs"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'rgba(239,68,68,0.9)',
            }}
          >
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Écran de succès */}
        {isSuccess ? (
          <div
            className="p-6 rounded-2xl text-center space-y-3"
            style={{
              background: 'var(--sidebar-hover)',
              border: '1px solid var(--sidebar-border)',
            }}
          >
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={24} />
            </div>
            <h2
              className="text-base font-bold font-heritage"
              style={{ color: 'var(--sidebar-fg)' }}
            >
              Mot de passe défini avec succès !
            </h2>
            <p className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>
              Votre compte est maintenant activé. Redirection vers la page de connexion en cours...
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:underline pt-2"
            >
              <span>Se connecter maintenant</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          /* Formulaire */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--sidebar-fg)' }}
              >
                Nouveau mot de passe (8 caractères minimum)
              </label>
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-accent)]"
                  style={{
                    background: 'var(--sidebar-hover)',
                    border: '1px solid var(--sidebar-border)',
                    color: 'var(--sidebar-fg)',
                  }}
                />
              </div>
            </div>

            {/* Confirmation */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--sidebar-fg)' }}
              >
                Confirmez le mot de passe
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--sidebar-muted)' }}
                />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
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
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2 shadow-xs"
              style={{
                background: 'var(--sidebar-accent)',
                color: '#080B0F',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <span>Enregistrer mon mot de passe</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-xs hover:underline"
            style={{ color: 'var(--sidebar-muted)' }}
          >
            Retour à la page de connexion
          </Link>
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
          <Loader2 size={24} className="animate-spin text-emerald-500" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
