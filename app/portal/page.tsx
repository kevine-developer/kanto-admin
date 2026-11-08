'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';
import {
  partnerPortalService,
  PartnerProfile,
  PartnerDashboardStats,
} from '@/services/portal.service';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Eye,
  Share2,
  KeyRound,
  Megaphone,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Building2,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function PartnerPortalDashboardPage() {
  const { toast } = useToast();

  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [stats, setStats] = useState<PartnerDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Formulaire onboarding
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('ASSOCIATION');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const p = await partnerPortalService.getMyProfile();
      setProfile(p);
      setNeedsOnboarding(false);

      const s = await partnerPortalService.getDashboardStats();
      setStats(s);
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('introuvable')) {
        setNeedsOnboarding(true);
      } else {
        toast.error(err?.message || 'Impossible de charger le tableau de bord.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !orgEmail.trim()) {
      toast.warning('Veuillez renseigner le nom de l’organisation et son email de contact.');
      return;
    }

    setIsSubmittingOnboarding(true);
    try {
      await partnerPortalService.register({
        name: orgName.trim(),
        type: orgType,
        email: orgEmail.trim(),
        phone: orgPhone.trim() || undefined,
        description: orgDesc.trim() || undefined,
        websiteUrl: orgWebsite.trim() || undefined,
      });

      toast.success('Organisation enregistrée avec succès !');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la création de l’organisation.');
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm">Chargement des données du tableau de bord...</p>
      </div>
    );
  }

  // Si l'utilisateur n'a pas encore créé d'organisation
  if (needsOnboarding) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Enregistrer votre Organisation</h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Créez votre profil partenaire pour commencer à publier vos événements et obtenir vos
              identifiants d'API développeur.
            </p>
          </div>

          <form onSubmit={handleRegisterOrganization} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Nom de l'organisation / Entreprise *
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Ex: Association Kolontsaina Malagasy"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Type d'organisation *
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="ASSOCIATION">Association culturelle / ONG</option>
                  <option value="COMPANY">Entreprise / Société privée</option>
                  <option value="INSTITUTION">Institution / Collectivité publique</option>
                  <option value="INDEPENDENT_ORGANIZER">Organisateur indépendant</option>
                  <option value="DEVELOPER">Développeur / Intégrateur tiers</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email professionnel *
                </label>
                <input
                  type="email"
                  required
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  placeholder="contact@organisation.mg"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  placeholder="+261 34 00 000 00"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Site web ou page officielle
                </label>
                <input
                  type="url"
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  placeholder="https://organisation.mg"
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Présentation brève de vos activités culturelles
              </label>
              <textarea
                rows={3}
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                placeholder="Décrivez vos missions, types d'événements organisés..."
                className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingOnboarding}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              {isSubmittingOnboarding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Créer mon compte partenaire Kanto'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête et profil */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100">{profile?.name}</h1>
            {profile?.status === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Organisation vérifiée
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5" /> En cours de validation
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Identifiant public : <span className="font-mono text-zinc-300">/partners/{profile?.slug}</span> • Contact : {profile?.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/events/new"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            Créer un événement
          </Link>
          <Link
            href="/portal/api-keys"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            Gérer mes clés API
          </Link>
        </div>
      </div>

      {/* Cartes de statistiques clés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Événements En Ligne</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats?.activeEvents || 0}</div>
          <div className="text-[11px] text-zinc-500">
            {stats?.totalEvents || 0} créés au total • {stats?.pendingReviewEvents || 0} en attente
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Inscrits Confirmés</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {stats?.totalParticipants?.toLocaleString('fr-FR') || 0}
          </div>
          <div className="text-[11px] text-zinc-500">Participants cumulés sur vos sessions</div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Vues & Visibilité</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {stats?.totalViews?.toLocaleString('fr-FR') || 0}
          </div>
          <div className="text-[11px] text-zinc-500">
            {stats?.totalShares || 0} partages générés
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Clés API Actives</span>
            <KeyRound className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{stats?.activeApiKeys || 0}</div>
          <div className="text-[11px] text-zinc-500">
            {stats?.marketingRequestsCount || 0} campagnes marketing
          </div>
        </div>
      </div>

      {/* Raccourcis et modules fonctionnels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Événements */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-base text-zinc-100">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Mes Événements & Billetterie
            </div>
            <Link
              href="/portal/events"
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Consultez la liste de vos manifestations culturelles, suivez en temps réel la jauge et la
            liste d'attente, ou exportez les participants au format CSV pour votre accueil physique.
          </p>
          <div className="pt-2">
            <Link
              href="/portal/events"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition"
            >
              Gérer mes programmations
            </Link>
          </div>
        </div>

        {/* Module Campagnes Marketing */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 font-bold text-base text-zinc-100">
              <Megaphone className="w-5 h-5 text-amber-400" />
              Sponsoring & Prestations Marketing
            </div>
            <Link
              href="/portal/marketing"
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              Catalogue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Boostez la visibilité de vos événements auprès de la communauté Kanto MG. Choisissez parmi
            nos 6 emplacements stratégiques (Bannière Hero mobile, Spotlight thématique, Notification
            push).
          </p>
          <div className="pt-2">
            <Link
              href="/portal/marketing"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition"
            >
              Déposer une demande de visibilité
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

