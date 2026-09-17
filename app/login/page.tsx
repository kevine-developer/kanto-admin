'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Lock, Mail, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';

/**
 * Page d'authentification des administrateurs du portail Kanto.
 * Gère la saisie des identifiants et l'accès sécurisé au panneau d'administration.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@kanto.mg');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn.email({ email: email.trim().toLowerCase(), password });
      if (res?.error) {
        setErrorMessage(res.error.message || 'Identifiants invalides');
        setIsLoading(false);
        return;
      }
      // Rechargement direct pour garantir la prise en compte immédiate des cookies de session
      window.location.href = '/';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur réseau est survenue';
      setErrorMessage(msg);
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
              Accès Admin
            </h1>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--sidebar-muted)' }}
            >
              Espace réservé aux administrateurs du Conservatoire
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

          {/* Formulaire */}
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
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--sidebar-fg)' }}
              >
                Mot de Passe
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

          <div
            className="rounded-xl p-3 text-[11.5px] space-y-1"
            style={{
              background: 'var(--sidebar-hover)',
              border: '1px solid var(--sidebar-border)',
              color: 'var(--sidebar-muted)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold" style={{ color: 'var(--sidebar-fg)' }}>
                Identifiants administrateur :
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@kanto.mg');
                  setPassword('AdminKanto2026!');
                }}
                className="text-[10.5px] px-2 py-0.5 rounded font-mono font-medium hover:underline cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--sidebar-accent)' }}
              >
                Pré-remplir
              </button>
            </div>
            <div className="font-mono text-[11px] opacity-80">
              admin@kanto.mg / AdminKanto2026!
            </div>
          </div>

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
