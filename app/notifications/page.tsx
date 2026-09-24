'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { fetchApi } from '@/lib/api-client';
import {
  Bell,
  Plus,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Send,
  ExternalLink,
  Smartphone,
  Info,
  Flame,
  BookOpen,
  Scale,
  Users,
  Radio,
  Globe,
  Layers,
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  titleMg: string;
  titleFr?: string | null;
  messageMg: string;
  messageFr?: string | null;
  category: string;
  badgeText?: string | null;
  badgeType?: string | null;
  iconName?: string | null;
  iconColor?: string | null;
  targetRoute?: string | null;
  isBroadcast: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: 'culture', label: 'Culture & Angano', icon: BookOpen, color: '#C0392B', bg: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: 'game', label: 'Jeux & Défis', icon: Flame, color: '#E67E22', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'civic', label: 'Civique & Fady', icon: Scale, color: '#4A6741', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'community', label: 'Communauté', icon: Users, color: '#2980B9', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'system', label: 'Système & Infos', icon: Info, color: '#7F8C8D', bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
];

const BADGE_TYPES = [
  { id: 'new', label: 'Nouveau / Vaovao' },
  { id: 'streak', label: 'Série / Misesy' },
  { id: 'reward', label: 'Récompense / Isa' },
  { id: 'civic', label: 'Civique / Andrim-panjakana' },
  { id: 'info', label: 'Information générale' },
];

const PRESET_ROUTES = [
  { label: 'Aucun lien (Informatif)', value: '' },
  { label: 'Tous les items (Proverbes/Contes)', value: '/categoriesAllScreen/listItemAll' },
  { label: 'Section Jeux (Lalao)', value: '/jeux' },
  { label: 'Institutions civiques', value: '/civiqueList/institutionListScreen' },
];

interface CulturalPreset {
  id: string;
  name: string;
  tag: string;
  category: string;
  titleMg: string;
  titleFr: string;
  messageMg: string;
  messageFr: string;
  badgeText: string;
  badgeType: string;
  targetRoute: string;
}

const CULTURAL_PRESETS: CulturalPreset[] = [
  {
    id: 'ohabolana',
    name: 'Ohabolana anio',
    tag: 'Sagesse',
    category: 'culture',
    titleMg: 'Ohabolana anio',
    titleFr: 'Proverbe du jour',
    messageMg: "Ny hevitra no mahery fa tsy ny sandry. Diniho ny hevitra lalina fonosin'ity ohabolana ity.",
    messageFr: 'La réflexion surpasse la force brute. Découvrez le sens profond de ce proverbe ancestral.',
    badgeText: 'Ohabolana',
    badgeType: 'new',
    targetRoute: '/categoriesAllScreen/listItemAll',
  },
  {
    id: 'angano',
    name: 'Angano vaovao',
    tag: 'Conte',
    category: 'culture',
    titleMg: 'Angano vaovao azon-tsary sy feo',
    titleFr: 'Nouveau conte audio immersif',
    messageMg: "Misy angano vaovao miandry anao ao amin'ny Kanto. Mihainoa ny tantaran'i Trimobe sy Iketaka.",
    messageFr: 'Une nouvelle histoire traditionnelle vous attend. Écoutez le récit immersif de Trimobe et Iketaka.',
    badgeText: 'Angano',
    badgeType: 'new',
    targetRoute: '/categoriesAllScreen/listItemAll',
  },
  {
    id: 'kabary',
    name: 'Kabary nentin-drazana',
    tag: 'Éloquence',
    category: 'culture',
    titleMg: 'Kabary : Haipirenena sy haisoratra',
    titleFr: "Kabary : L'art oratoire traditionnel",
    messageMg: 'Ireo fomba fiteny am-panajana sy fandraisam-pitenenana nentim-paharazana nozaraina anio.',
    messageFr: "Explorez les subtilités de l'éloquence malgache et les formules cérémonielles d'antan.",
    badgeText: 'Kabary',
    badgeType: 'info',
    targetRoute: '/categoriesAllScreen/listItemAll',
  },
  {
    id: 'fanamby',
    name: 'Fanamby lalao',
    tag: 'Défi',
    category: 'game',
    titleMg: 'Fanamby lalao vaovao anio !',
    titleFr: 'Défi jeux du jour disponible !',
    messageMg: "Andramo ny fahalalanao momba ny tantaran'i Madagasikara ary mitadiava isa ambony indrindra !",
    messageFr: "Testez vos connaissances sur l'histoire de Madagascar et relevez le défi du jour !",
    badgeText: 'Fanamby',
    badgeType: 'streak',
    targetRoute: '/jeux',
  },
  {
    id: 'vintana',
    name: "Vintana & Tonon'andro",
    tag: 'Astrologie',
    category: 'culture',
    titleMg: 'Vintana anio : Andro Tsara',
    titleFr: 'Horoscope du jour : Énergies favorables',
    messageMg: "Jereo ny momba ny vintana sy ny tetiandron'ny andro anio araka ny fomban-drazana.",
    messageFr: 'Consultez les orientations astrologiques et énergétiques de votre signe selon la tradition.',
    badgeText: 'Vintana',
    badgeType: 'info',
    targetRoute: '',
  },
  {
    id: 'fanambarana',
    name: 'Fampahafantarana Kanto',
    tag: 'Officiel',
    category: 'system',
    titleMg: 'Fanavaozana ny rindranasa Kanto',
    titleFr: 'Mise à jour disponible sur Kanto',
    messageMg: 'Misy endri-javatra vaovao sy fanatsarana nampidirina ho anao.',
    messageFr: 'De nouvelles fonctionnalités et améliorations culturelles sont disponibles sur votre application.',
    badgeText: 'Vaovao',
    badgeType: 'info',
    targetRoute: '',
  },
];

export default function NotificationsAdminPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Form State
  const [titleMg, setTitleMg] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [messageMg, setMessageMg] = useState('');
  const [messageFr, setMessageFr] = useState('');
  const [category, setCategory] = useState('culture');
  const [badgeText, setBadgeText] = useState('');
  const [badgeType, setBadgeType] = useState('new');
  const [targetRoute, setTargetRoute] = useState('');

  // Preview State
  const [previewLanguage, setPreviewLanguage] = useState<'mg' | 'fr'>('mg');
  const [previewMode, setPreviewMode] = useState<'lockscreen' | 'inapp'>('lockscreen');

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi<NotificationItem[]>('/admin/notifications');
      setNotifications(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des notifications.';
      setMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchApi<NotificationItem[]>('/admin/notifications')
      .then((data) => {
        if (isMounted) setNotifications(data || []);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des notifications.';
        setMessage({
          type: 'error',
          text: msg,
        });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resetForm = () => {
    setTitleMg('');
    setTitleFr('');
    setMessageMg('');
    setMessageFr('');
    setCategory('culture');
    setBadgeText('');
    setBadgeType('new');
    setTargetRoute('');
    setPreviewLanguage('mg');
    setPreviewMode('lockscreen');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: CulturalPreset) => {
    setTitleMg(preset.titleMg);
    setTitleFr(preset.titleFr);
    setMessageMg(preset.messageMg);
    setMessageFr(preset.messageFr);
    setCategory(preset.category);
    setBadgeText(preset.badgeText);
    setBadgeType(preset.badgeType);
    setTargetRoute(preset.targetRoute);
  };

  const handleTestPush = async () => {
    try {
      setIsTestingPush(true);
      const res = await fetchApi<{ success: boolean; message: string; sentCount?: number }>(
        '/admin/notifications/test-push',
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );
      setMessage({
        type: res.success ? 'success' : 'error',
        text: res.message || 'Test push exécuté avec succès.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du test de notification push.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsTestingPush(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleMg.trim() || !messageMg.trim()) {
      setMessage({ type: 'error', text: 'Le titre et le message en malgache sont requis.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const catObj = CATEGORIES.find((c) => c.id === category);

      await fetchApi('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          titleMg: titleMg.trim(),
          titleFr: titleFr.trim() || undefined,
          messageMg: messageMg.trim(),
          messageFr: messageFr.trim() || undefined,
          category,
          badgeText: badgeText.trim() || undefined,
          badgeType,
          iconName: category === 'game' ? 'flame-outline' : category === 'civic' ? 'scale-outline' : 'bulb-outline',
          iconColor: catObj?.color || '#C0392B',
          targetRoute: targetRoute.trim() || undefined,
          isBroadcast: true,
        }),
      });

      setMessage({ type: 'success', text: 'Notification diffusée avec succès à tous les utilisateurs !' });
      setIsModalOpen(false);
      resetForm();
      await loadNotifications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la diffusion de la notification.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetchApi(`/admin/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setMessage({ type: 'success', text: 'Notification supprimée.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de suppression.';
      setMessage({ type: 'error', text: msg });
    }
  };

  const currentCat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const activeTitle = previewLanguage === 'mg' ? (titleMg || 'Lohateny...') : (titleFr || titleMg || 'Titre...');
  const activeMessage = previewLanguage === 'mg' ? (messageMg || 'Hafatra...') : (messageFr || messageMg || 'Message...');

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sidebar-border)] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heritage tracking-tight text-[var(--foreground)]">
                Notifications &amp; Alertes
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Diffuser des annonces, actualités culturelles et alertes push à tous les utilisateurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTestPush}
              disabled={isTestingPush}
              title="Envoyer une notification push test vers les appareils enregistrés"
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--sidebar-border)] text-[var(--foreground)] hover:bg-[var(--sidebar-border)]/20 transition-colors flex items-center gap-1.5"
            >
              {isTestingPush ? (
                <Loader2 size={13} className="animate-spin text-amber-500" />
              ) : (
                <Radio size={13} className="text-amber-500" />
              )}
              <span>Tester le Push</span>
            </button>

            <button
              onClick={loadNotifications}
              disabled={isLoading}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--sidebar-border)] text-[var(--foreground)] hover:bg-[var(--sidebar-border)]/20 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm"
            >
              <Plus size={14} />
              Diffuser une notification
            </button>
          </div>
        </div>

        {/* Message d'alerte */}
        {message && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-red-500/10 border-red-500/20 text-red-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--card-bg)]">
            <div className="text-xs text-[var(--muted)] font-medium">Total envoyées</div>
            <div className="text-2xl font-bold mt-1 text-[var(--foreground)] font-heritage">
              {notifications.length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--card-bg)]">
            <div className="text-xs text-[var(--muted)] font-medium">Culture &amp; Angano</div>
            <div className="text-2xl font-bold mt-1 text-red-500 font-heritage">
              {notifications.filter((n) => n.category === 'culture').length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--card-bg)]">
            <div className="text-xs text-[var(--muted)] font-medium">Jeux &amp; Défis</div>
            <div className="text-2xl font-bold mt-1 text-amber-500 font-heritage">
              {notifications.filter((n) => n.category === 'game').length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--card-bg)]">
            <div className="text-xs text-[var(--muted)] font-medium">Civique &amp; Fady</div>
            <div className="text-2xl font-bold mt-1 text-emerald-500 font-heritage">
              {notifications.filter((n) => n.category === 'civic').length}
            </div>
          </div>
        </div>

        {/* Tableau des notifications */}
        <div className="rounded-xl border border-[var(--sidebar-border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--sidebar-border)] flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              Historique des diffusions ({notifications.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[var(--muted)]">
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs">Chargement des notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-[var(--muted)] text-xs">
              Aucune notification diffusée pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--sidebar-border)] bg-[var(--sidebar-border)]/10 text-[var(--muted)] font-medium">
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Titre Malgache / Français</th>
                    <th className="py-3 px-4">Message diffusé</th>
                    <th className="py-3 px-4">Lien &amp; Badge</th>
                    <th className="py-3 px-4">Date de diffusion</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--sidebar-border)]">
                  {notifications.map((item) => {
                    const catObj = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
                    const IconComp = catObj.icon;
                    const dateFormatted = new Date(item.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={item.id} className="hover:bg-[var(--sidebar-border)]/10 transition-colors">
                        <td className="py-3 px-4 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${catObj.bg}`}
                          >
                            <IconComp size={12} />
                            {catObj.label.split('&')[0].trim()}
                          </span>
                        </td>

                        <td className="py-3 px-4 align-top max-w-[200px]">
                          <div className="font-semibold text-[var(--foreground)]">{item.titleMg}</div>
                          {item.titleFr && (
                            <div className="text-[11px] text-[var(--muted)] italic mt-0.5">{item.titleFr}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 align-top max-w-[320px]">
                          <div className="text-[var(--foreground)] line-clamp-2">{item.messageMg}</div>
                          {item.messageFr && (
                            <div className="text-[11px] text-[var(--muted)] line-clamp-1 italic mt-0.5">
                              {item.messageFr}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-1 items-start">
                            {item.badgeText && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--sidebar-border)]/40 text-[var(--foreground)]">
                                {item.badgeText}
                              </span>
                            )}
                            {item.targetRoute && (
                              <span className="text-[10px] text-[var(--muted)] font-mono flex items-center gap-1">
                                <ExternalLink size={10} />
                                {item.targetRoute}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 align-top text-[var(--muted)] whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        <td className="py-3 px-4 align-top text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors inline-flex items-center justify-center"
                            title="Supprimer la notification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de Diffusion */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-3xl rounded-2xl border border-[var(--sidebar-border)] bg-[var(--card-bg)] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] animate-in fade-in slide-in-from-top-3 duration-150">
              {/* Header modal */}
              <div className="px-6 py-4 border-b border-[var(--sidebar-border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                    <Send size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-heritage text-[var(--foreground)]">
                      Diffuser une nouvelle notification
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      L&apos;annonce sera diffusée via notification push Expo et publiée dans le centre de notifications de l&apos;application
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--sidebar-border)]/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Contenu du formulaire */}
              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
                {/* Modèles culturels prédéfinis (Presets) */}
                <div className="p-3.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-border)]/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                      <Layers size={13} className="text-[var(--primary)]" />
                      Modèles culturels prédéfinis (remplissage en 1 clic) :
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">Cliquez pour appliquer</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CULTURAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="px-2.5 py-2 rounded-lg border border-[var(--sidebar-border)] bg-[var(--card-bg)] hover:border-[var(--primary)] text-left transition-all group"
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[10px] font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] truncate">
                            {preset.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--sidebar-border)]/40 text-[var(--muted)] shrink-0">
                            {preset.tag}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--muted)] truncate">
                          {preset.titleMg}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-2">
                    Catégorie de la notification
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => {
                      const IconComp = c.icon;
                      const isSelected = category === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategory(c.id)}
                          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-xs'
                              : 'border-[var(--sidebar-border)] hover:bg-[var(--sidebar-border)]/15 text-[var(--muted)]'
                          }`}
                        >
                          <IconComp size={15} style={{ color: c.color }} />
                          <span className="truncate">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Titres bilingues */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                      Titre en malgache <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titleMg}
                      onChange={(e) => setTitleMg(e.target.value)}
                      placeholder="Ex: Ohabolana anio..."
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--sidebar-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                      Titre en français <span className="text-xs text-[var(--muted)]">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={titleFr}
                      onChange={(e) => setTitleFr(e.target.value)}
                      placeholder="Ex: Proverbe du jour..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--sidebar-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                {/* Messages bilingues */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                      Message en malgache <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={messageMg}
                      onChange={(e) => setMessageMg(e.target.value)}
                      placeholder="Soraty eto ny hafatra fampahafantarana..."
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--sidebar-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                      Message en français <span className="text-xs text-[var(--muted)]">(optionnel)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={messageFr}
                      onChange={(e) => setMessageFr(e.target.value)}
                      placeholder="Texte explicatif pour les lecteurs francophones..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--sidebar-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                {/* Badges & Routes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                      Texte du Badge
                    </label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Ex: Ohabolana, Fanamby..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--sidebar-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                      Type de Badge
                    </label>
                    <select
                      value={badgeType}
                      onChange={(e) => setBadgeType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--sidebar-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      {BADGE_TYPES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                      Redirection / Route
                    </label>
                    <select
                      value={targetRoute}
                      onChange={(e) => setTargetRoute(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--sidebar-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-hidden focus:ring-1 focus:ring-[var(--primary)]"
                    >
                      {PRESET_ROUTES.map((r, i) => (
                        <option key={i} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Aperçu en direct Smartphone (Live Smartphone Preview) */}
                <div className="p-4 rounded-xl border border-[var(--sidebar-border)] bg-[var(--background)] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone size={14} className="text-[var(--primary)]" />
                      Prévisualisation mobile en direct
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Switch mode aperçu */}
                      <div className="inline-flex rounded-lg border border-[var(--sidebar-border)] p-0.5 bg-[var(--card-bg)] text-[10px]">
                        <button
                          type="button"
                          onClick={() => setPreviewMode('lockscreen')}
                          className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                            previewMode === 'lockscreen'
                              ? 'bg-[var(--primary)] text-white'
                              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          Push Écran
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode('inapp')}
                          className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                            previewMode === 'inapp'
                              ? 'bg-[var(--primary)] text-white'
                              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          Carte In-App
                        </button>
                      </div>

                      {/* Switch langue aperçu */}
                      <div className="inline-flex rounded-lg border border-[var(--sidebar-border)] p-0.5 bg-[var(--card-bg)] text-[10px]">
                        <button
                          type="button"
                          onClick={() => setPreviewLanguage('mg')}
                          className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                            previewLanguage === 'mg'
                              ? 'bg-[var(--primary)] text-white'
                              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          Malgache
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewLanguage('fr')}
                          className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                            previewLanguage === 'fr'
                              ? 'bg-[var(--primary)] text-white'
                              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          Français
                        </button>
                      </div>
                    </div>
                  </div>

                  {previewMode === 'lockscreen' ? (
                    /* Rendu Smartphone Lockscreen */
                    <div className="max-w-md mx-auto rounded-2xl border border-zinc-700/60 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-4 shadow-xl text-zinc-100">
                      {/* Barre d'état smartphone */}
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3 px-1">
                        <span className="font-semibold">09:41</span>
                        <div className="w-16 h-3.5 rounded-full bg-zinc-800 border border-zinc-700 mx-auto" />
                        <span className="text-[10px]">100%</span>
                      </div>

                      {/* Date & Heure Lockscreen discrète */}
                      <div className="text-center my-3">
                        <div className="text-xs text-zinc-400">
                          {previewLanguage === 'mg' ? 'Talata 22 Septambra' : 'Mardi 22 Septembre'}
                        </div>
                        <div className="text-3xl font-light tracking-tight text-zinc-100">
                          09:41
                        </div>
                      </div>

                      {/* Bannière de notification Push système */}
                      <div className="rounded-xl border border-white/10 bg-white/10 backdrop-blur-md p-3 shadow-lg">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-[#8B2519] text-white flex items-center justify-center text-[8px] font-bold">
                              K
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-200 uppercase tracking-wider">
                              KANTO
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-400">
                            {previewLanguage === 'mg' ? 'Vao haingana' : 'À l’instant'}
                          </span>
                        </div>

                        <div className="font-semibold text-xs text-white">
                          {activeTitle}
                        </div>
                        <div className="text-[11px] text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">
                          {activeMessage}
                        </div>

                        {badgeText && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/15 text-zinc-200 font-medium">
                              {badgeText}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Rendu Carte In-App Kanto */
                    <div className="p-3.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--card-bg)] flex items-start gap-3 shadow-xs">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${currentCat.color}15` }}
                      >
                        {(() => {
                          const CatIcon = currentCat.icon;
                          return <CatIcon size={18} color={currentCat.color} />;
                        })()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-xs text-[var(--foreground)] truncate">
                            {activeTitle}
                          </div>
                          <span className="text-[10px] text-[var(--muted)] shrink-0">
                            {previewLanguage === 'mg' ? 'Vao haingana' : 'À l’instant'}
                          </span>
                        </div>

                        <div className="text-xs text-[var(--foreground)]/80 mt-1 line-clamp-2">
                          {activeMessage}
                        </div>

                        {badgeText && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                              {badgeText}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Boutons actions modal */}
                <div className="pt-3 border-t border-[var(--sidebar-border)] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--sidebar-border)] text-[var(--foreground)] hover:bg-[var(--sidebar-border)]/20 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Diffusion en cours...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Diffuser maintenant
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
