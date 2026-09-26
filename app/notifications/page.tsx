'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { fetchApi } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
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
  Sparkles,
  Download,
  ArrowUpRight,
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

export const DEFAULT_PLAYSTORE_URL =
  'https://play.google.com/store/apps/details?id=com.devengalere.kantomg';

const CATEGORIES = [
  { id: 'culture', label: 'Culture & Angano', icon: BookOpen, color: '#C0392B', bg: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: 'game', label: 'Jeux & Défis', icon: Flame, color: '#E67E22', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'civic', label: 'Civique & Fady', icon: Scale, color: '#4A6741', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'community', label: 'Communauté', icon: Users, color: '#2980B9', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'system', label: 'Système & Mise à jour', icon: Info, color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
];

const BADGE_TYPES = [
  { id: 'new', label: 'Nouveau / Vaovao' },
  { id: 'update', label: 'Mise à jour / Fanavaozana' },
  { id: 'streak', label: 'Série / Misesy' },
  { id: 'reward', label: 'Récompense / Isa' },
  { id: 'civic', label: 'Civique / Andrim-panjakana' },
  { id: 'info', label: 'Information générale' },
];

const PRESET_ROUTES = [
  { label: 'Aucun lien (Informatif)', value: '' },
  { label: 'Google Play Store (Mise à jour de l’application)', value: DEFAULT_PLAYSTORE_URL },
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
    id: 'playstore_update',
    name: 'Mise à jour Play Store',
    tag: 'Play Store',
    category: 'system',
    titleMg: 'Fanavaozana Kanto vaovao azo alaina !',
    titleFr: 'Nouvelle mise à jour Kanto disponible !',
    messageMg: "Misy fanatsarana sy endri-javatra vaovao azo alaina ao amin'ny Google Play Store. Havaozy izao ny fampiharana Kanto !",
    messageFr: 'Une nouvelle version de Kanto est disponible sur le Google Play Store avec des améliorations et correctifs. Mettez à jour dès maintenant !',
    badgeText: 'Mise à jour',
    badgeType: 'update',
    targetRoute: DEFAULT_PLAYSTORE_URL,
  },
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
];

export default function NotificationsAdminPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal création générale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Modal spécialisée Mise à jour Play Store
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('v0.0.8');
  const [updateType, setUpdateType] = useState<'features' | 'fixes' | 'major'>('features');
  const [updatePlayStoreUrl, setUpdatePlayStoreUrl] = useState(DEFAULT_PLAYSTORE_URL);
  const [updateTitleMg, setUpdateTitleMg] = useState('');
  const [updateTitleFr, setUpdateTitleFr] = useState('');
  const [updateMessageMg, setUpdateMessageMg] = useState('');
  const [updateMessageFr, setUpdateMessageFr] = useState('');
  const [updateBadgeText, setUpdateBadgeText] = useState('Mise à jour');

  // Form State général
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
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchApi<NotificationItem[]>('/admin/notifications')
      .then((data) => { if (isMounted) setNotifications(data || []); })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des notifications.';
        setMessage({ type: 'error', text: msg });
      })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const resetForm = () => {
    setTitleMg(''); setTitleFr(''); setMessageMg(''); setMessageFr('');
    setCategory('culture'); setBadgeText(''); setBadgeType('new'); setTargetRoute('');
    setPreviewLanguage('mg'); setPreviewMode('lockscreen');
  };

  const handleOpenCreateModal = () => { resetForm(); setIsModalOpen(true); };

  // Génération des textes Play Store selon la version et le type
  const generateUpdateTexts = useCallback((ver: string, type: 'features' | 'fixes' | 'major') => {
    const cleanVer = ver.trim() || 'vaovao';

    if (type === 'major') {
      return {
        titleMg: `Fanavaozana Kanto lehibe (${cleanVer}) azo alaina !`,
        titleFr: `Mise à jour majeure Kanto (${cleanVer}) disponible !`,
        messageMg: `Fanavaozana goavana ahitana endri-javatra vaovao, lalao nohatsaraina ary traikefa haingana kokoa. Havaozy izao ao amin'ny Play Store !`,
        messageFr: `Une mise à jour majeure est disponible avec de nouvelles fonctionnalités culturelles, des jeux enrichis et des performances optimisées. Téléchargez-la sur le Play Store !`,
        badge: `Mise à jour ${cleanVer}`,
      };
    }

    if (type === 'fixes') {
      return {
        titleMg: `Fanatsarana sy fampandehanana Kanto (${cleanVer})`,
        titleFr: `Correctifs et optimisations Kanto (${cleanVer})`,
        messageMg: `Misy fanitsiana sy fanatsarana ny fandehan'ny rindranasa ho anao. Havaozy ao amin'ny Play Store mba hisorohana ny olana.`,
        messageFr: `Cette mise à jour apporte des corrections de bugs, une plus grande fluidité et une meilleure stabilité générale. Disponible sur le Play Store.`,
        badge: `Correctif ${cleanVer}`,
      };
    }

    // Défaut: features
    return {
      titleMg: `Fanavaozana Kanto vaovao (${cleanVer}) azo alaina !`,
      titleFr: `Nouvelle version Kanto (${cleanVer}) disponible !`,
      messageMg: `Misy endri-javatra vaovao sy fanatsarana nampidirina ao amin'ny Kanto. Tsindrio eto mba hanavaozana azy ao amin'ny Play Store !`,
      messageFr: `Découvrez les dernières nouveautés et améliorations de Kanto. Mettez à jour votre application dès maintenant sur le Google Play Store !`,
      badge: `Version ${cleanVer}`,
    };
  }, []);

  const handleOpenUpdateModal = () => {
    const generated = generateUpdateTexts(updateVersion, updateType);
    setUpdateTitleMg(generated.titleMg);
    setUpdateTitleFr(generated.titleFr);
    setUpdateMessageMg(generated.messageMg);
    setUpdateMessageFr(generated.messageFr);
    setUpdateBadgeText(generated.badge);
    setUpdatePlayStoreUrl(DEFAULT_PLAYSTORE_URL);
    setPreviewLanguage('mg');
    setPreviewMode('lockscreen');
    setIsUpdateModalOpen(true);
  };

  const handleUpdateVersionChange = (newVer: string) => {
    setUpdateVersion(newVer);
    const generated = generateUpdateTexts(newVer, updateType);
    setUpdateTitleMg(generated.titleMg);
    setUpdateTitleFr(generated.titleFr);
    setUpdateMessageMg(generated.messageMg);
    setUpdateMessageFr(generated.messageFr);
    setUpdateBadgeText(generated.badge);
  };

  const handleUpdateTypeChange = (newType: 'features' | 'fixes' | 'major') => {
    setUpdateType(newType);
    const generated = generateUpdateTexts(updateVersion, newType);
    setUpdateTitleMg(generated.titleMg);
    setUpdateTitleFr(generated.titleFr);
    setUpdateMessageMg(generated.messageMg);
    setUpdateMessageFr(generated.messageFr);
    setUpdateBadgeText(generated.badge);
  };

  const handleApplyPreset = (preset: CulturalPreset) => {
    setTitleMg(preset.titleMg); setTitleFr(preset.titleFr);
    setMessageMg(preset.messageMg); setMessageFr(preset.messageFr);
    setCategory(preset.category); setBadgeText(preset.badgeText);
    setBadgeType(preset.badgeType); setTargetRoute(preset.targetRoute);
  };

  const handleTestPush = async () => {
    try {
      setIsTestingPush(true);
      const res = await fetchApi<{ success: boolean; message: string; sentCount?: number }>(
        '/admin/notifications/test-push',
        { method: 'POST', body: JSON.stringify({}) },
      );
      setMessage({ type: res.success ? 'success' : 'error', text: res.message || 'Test push exécuté avec succès.' });
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
          iconName:
            targetRoute.includes('play.google.com')
              ? 'cloud-download-outline'
              : category === 'game'
              ? 'flame-outline'
              : category === 'civic'
              ? 'scale-outline'
              : 'bulb-outline',
          iconColor: targetRoute.includes('play.google.com') ? '#10B981' : catObj?.color || '#C0392B',
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

  const handleSubmitPlayStoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitleMg.trim() || !updateMessageMg.trim()) {
      setMessage({ type: 'error', text: 'Le titre et le message en malgache sont obligatoires.' });
      return;
    }
    if (!updatePlayStoreUrl.trim()) {
      setMessage({ type: 'error', text: "L'URL de redirection vers le Google Play Store est obligatoire." });
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchApi('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          titleMg: updateTitleMg.trim(),
          titleFr: updateTitleFr.trim() || undefined,
          messageMg: updateMessageMg.trim(),
          messageFr: updateMessageFr.trim() || undefined,
          category: 'system',
          badgeText: updateBadgeText.trim() || 'Mise à jour',
          badgeType: 'update',
          iconName: 'cloud-download-outline',
          iconColor: '#10B981',
          targetRoute: updatePlayStoreUrl.trim(),
          isBroadcast: true,
        }),
      });

      setMessage({
        type: 'success',
        text: `Notification de mise à jour (${updateVersion}) diffusée avec succès vers le Play Store !`,
      });
      setIsUpdateModalOpen(false);
      await loadNotifications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la diffusion de la mise à jour.';
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

  const activeUpdateTitle =
    previewLanguage === 'mg' ? (updateTitleMg || 'Lohateny...') : (updateTitleFr || updateTitleMg || 'Titre...');
  const activeUpdateMessage =
    previewLanguage === 'mg' ? (updateMessageMg || 'Hafatra...') : (updateMessageFr || updateMessageMg || 'Message...');

  return (
    <AdminShell>
      <div className="space-y-6 max-w-6xl">

        {/* ── En-tête ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/15 shadow-sm">
              <Bell size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heritage tracking-tight" style={{ color: 'var(--foreground)' }}>
                Notifications & Alertes
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Diffuser des annonces, actualités culturelles et alertes de mise à jour Play Store
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenUpdateModal}
              className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
              leftIcon={<Sparkles size={13} className="text-emerald-500" />}
            >
              Mise à jour Play Store
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestPush}
              disabled={isTestingPush}
              leftIcon={isTestingPush ? <Loader2 size={13} className="animate-spin text-amber-500" /> : <Radio size={13} className="text-amber-500" />}
            >
              Tester le Push
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadNotifications}
              disabled={isLoading}
              leftIcon={<RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />}
            >
              Actualiser
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus size={14} />}
            >
              Diffuser une notification
            </Button>
          </div>
        </div>

        {/* ── Alerte feedback ── */}
        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/8 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Stats rapides ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total envoyées', value: notifications.length, color: 'var(--accent)' },
            {
              label: 'Mises à jour Play Store',
              value: notifications.filter((n) => n.targetRoute?.includes('play.google.com') || n.badgeType === 'update').length,
              color: '#10B981',
            },
            { label: 'Culture & Angano', value: notifications.filter((n) => n.category === 'culture').length, color: '#C0392B' },
            { label: 'Jeux & Défis', value: notifications.filter((n) => n.category === 'game').length, color: '#E67E22' },
          ].map((stat) => (
            <div key={stat.label} className="kanto-stat-mini relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-full" style={{ background: stat.color }} />
              <div className="text-[11px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              <div className="text-2xl font-bold mt-1 font-heritage" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ── Tableau des notifications ── */}
        <div className="kanto-card rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Historique des diffusions
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                {notifications.length}
              </span>
            </h2>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={22} className="animate-spin" />
              <span className="text-xs font-medium">Chargement des notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
              <Bell size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Aucune notification diffusée</p>
              <p className="text-xs mt-1 opacity-70">Créez votre première notification ou diffusez une alerte Play Store.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="kanto-table">
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th>Titre MG / FR</th>
                    <th>Message diffusé</th>
                    <th>Badge & Redirection</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((item) => {
                    const isPlayStore = Boolean(item.targetRoute?.includes('play.google.com') || item.targetRoute?.startsWith('market://'));
                    const catObj = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
                    const IconComp = isPlayStore ? Download : catObj.icon;
                    const dateFormatted = new Date(item.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    });
                    return (
                      <tr key={item.id}>
                        <td>
                          {isPlayStore ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                              <Download size={11} />
                              Play Store
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${catObj.bg}`}>
                              <IconComp size={11} />
                              {catObj.label.split('&')[0].trim()}
                            </span>
                          )}
                        </td>
                        <td className="max-w-[180px]">
                          <div className="font-semibold text-xs truncate" style={{ color: 'var(--foreground)' }}>{item.titleMg}</div>
                          {item.titleFr && (
                            <div className="text-[11px] italic mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{item.titleFr}</div>
                          )}
                        </td>
                        <td className="max-w-[280px]">
                          <div className="text-xs line-clamp-2" style={{ color: 'var(--foreground)' }}>{item.messageMg}</div>
                          {item.messageFr && (
                            <div className="text-[11px] italic line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.messageFr}</div>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-col gap-1 items-start">
                            {item.badgeText && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                                {item.badgeText}
                              </span>
                            )}
                            {item.targetRoute && (
                              isPlayStore ? (
                                <a
                                  href={item.targetRoute}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/25 transition-colors"
                                  title="Tester le lien Google Play Store"
                                >
                                  <span>Google Play</span>
                                  <ArrowUpRight size={10} />
                                </a>
                              ) : (
                                <span className="text-[10px] font-mono flex items-center gap-1 truncate max-w-[160px]" style={{ color: 'var(--text-subtle)' }}>
                                  <ExternalLink size={9} />{item.targetRoute}
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{dateFormatted}</span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors inline-flex items-center justify-center"
                            title="Supprimer la notification"
                          >
                            <Trash2 size={13} />
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
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1 : ALERTE MISE À JOUR PLAY STORE DÉDIÉE                             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
          >
            {/* Header modal */}
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                    Alerte Mise à jour Play Store
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Notifier les utilisateurs d&apos;une nouvelle version avec redirection automatique vers le Google Play Store
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--foreground)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps formulaire */}
            <form onSubmit={handleSubmitPlayStoreUpdate} className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Type de mise à jour & Version */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Version de l'application *"
                  value={updateVersion}
                  onChange={(e) => handleUpdateVersionChange(e.target.value)}
                  placeholder="Ex: v0.0.8, v1.0.0..."
                  required
                />
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>
                    Type de mise à jour
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'features', label: 'Nouveautés' },
                        { id: 'fixes', label: 'Correctifs' },
                        { id: 'major', label: 'Majeure' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleUpdateTypeChange(t.id)}
                        className={`px-2 py-2 rounded-xl border text-xs font-medium transition-all ${
                          updateType === t.id ? 'font-bold' : ''
                        }`}
                        style={{
                          borderColor: updateType === t.id ? '#10B981' : 'var(--card-border)',
                          background: updateType === t.id ? 'rgba(16, 185, 129, 0.1)' : 'var(--card)',
                          color: updateType === t.id ? '#10B981' : 'var(--text-muted)',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* URL Google Play Store */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                    <span>Lien Google Play Store *</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">(Redirection immédiate au clic)</span>
                  </label>
                  <a
                    href={updatePlayStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <span>Vérifier le lien</span>
                    <ArrowUpRight size={12} />
                  </a>
                </div>
                <Input
                  value={updatePlayStoreUrl}
                  onChange={(e) => setUpdatePlayStoreUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  required
                />
              </div>

              {/* Titres bilingues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Titre malgache *"
                  value={updateTitleMg}
                  onChange={(e) => setUpdateTitleMg(e.target.value)}
                  placeholder="Fanavaozana Kanto vaovao azo alaina..."
                  required
                />
                <Input
                  label="Titre français"
                  value={updateTitleFr}
                  onChange={(e) => setUpdateTitleFr(e.target.value)}
                  placeholder="Nouvelle mise à jour disponible..."
                />
              </div>

              {/* Messages bilingues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Message malgache *"
                  value={updateMessageMg}
                  onChange={(e) => setUpdateMessageMg(e.target.value)}
                  placeholder="Hafatra fampahafantarana ny fanavaozana..."
                  required
                  rows={3}
                />
                <Textarea
                  label="Message français"
                  value={updateMessageFr}
                  onChange={(e) => setUpdateMessageFr(e.target.value)}
                  placeholder="Explication des nouveautés et incitation à la mise à jour..."
                  rows={3}
                />
              </div>

              {/* Badge texte */}
              <Input
                label="Libellé du badge"
                value={updateBadgeText}
                onChange={(e) => setUpdateBadgeText(e.target.value)}
                placeholder="Ex: Mise à jour v0.0.8"
              />

              {/* Prévisualisation mobile */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Smartphone size={13} className="text-emerald-500" />
                    Prévisualisation Push &amp; In-App Play Store
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="kanto-toggle-group">
                      {(['lockscreen', 'inapp'] as const).map((mode) => (
                        <button key={mode} type="button" onClick={() => setPreviewMode(mode)} className={`kanto-toggle-pill ${previewMode === mode ? 'active' : ''}`}>
                          {mode === 'lockscreen' ? 'Push Écran' : 'Carte In-App'}
                        </button>
                      ))}
                    </div>
                    <div className="kanto-toggle-group">
                      {(['mg', 'fr'] as const).map((lang) => (
                        <button key={lang} type="button" onClick={() => setPreviewLanguage(lang)} className={`kanto-toggle-pill ${previewLanguage === lang ? 'active' : ''}`}>
                          {lang === 'mg' ? 'MG' : 'FR'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {previewMode === 'lockscreen' ? (
                  <div className="max-w-sm mx-auto rounded-2xl border border-zinc-700/50 bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 shadow-xl text-zinc-100">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3 px-1">
                      <span className="font-semibold">09:41</span>
                      <div className="w-16 h-3.5 rounded-full bg-zinc-800 border border-zinc-700 mx-auto" />
                      <span className="text-[10px]">100%</span>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 backdrop-blur-md p-3 shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-[#10B981] text-white flex items-center justify-center text-[8px] font-bold">
                            <Download size={10} />
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">KANTO · PLAY STORE</span>
                        </div>
                        <span className="text-[9px] text-zinc-400">{previewLanguage === 'mg' ? 'Vao haingana' : "À l'instant"}</span>
                      </div>
                      <div className="font-semibold text-xs text-white">{activeUpdateTitle}</div>
                      <div className="text-[11px] text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">{activeUpdateMessage}</div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                          {updateBadgeText || 'Mise à jour'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          Ouvrir Play Store <ArrowUpRight size={10} />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto p-3.5 rounded-xl border flex items-start gap-3" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
                    <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                      <Download size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-xs truncate" style={{ color: 'var(--foreground)' }}>{activeUpdateTitle}</div>
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{previewLanguage === 'mg' ? 'Vao haingana' : "À l'instant"}</span>
                      </div>
                      <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{activeUpdateMessage}</div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {updateBadgeText || 'Mise à jour'}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          Mettre à jour sur le Play Store →
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Boutons actions modal */}
              <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
                <Button variant="outline" type="button" size="md" onClick={() => setIsUpdateModalOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  size="md"
                  isLoading={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                  leftIcon={<Download size={14} />}
                >
                  {isSubmitting ? 'Diffusion...' : 'Diffuser la mise à jour Play Store'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2 : DIFFUSER UNE NOTIFICATION GÉNÉRALE                               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
          >
            {/* Header modal */}
            <div className="px-6 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/15">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                    Diffuser une notification
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Envoyée instantanément en temps réel et en push à tous les utilisateurs Kanto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--foreground)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps formulaire */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Modèles rapides */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                    <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                    Modèles rapides
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-subtle)' }}>Cliquez pour appliquer</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CULTURAL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-3 py-2.5 rounded-xl border text-left transition-all group"
                      style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 1px var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--card-border)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                          {preset.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                          {preset.tag}
                        </span>
                      </div>
                      <div className="text-[10px] truncate" style={{ color: 'var(--text-subtle)' }}>{preset.titleMg}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Catégorie
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
                          isSelected ? 'font-bold' : ''
                        }`}
                        style={{
                          borderColor: isSelected ? 'var(--accent)' : 'var(--card-border)',
                          background: isSelected ? 'var(--accent-light)' : 'var(--card)',
                          color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)',
                          boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
                        }}
                      >
                        <IconComp size={14} style={{ color: c.color }} />
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Titres bilingues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Titre en malgache *"
                  value={titleMg}
                  onChange={(e) => setTitleMg(e.target.value)}
                  placeholder="Ex: Ohabolana anio..."
                  required
                />
                <Input
                  label="Titre en français"
                  value={titleFr}
                  onChange={(e) => setTitleFr(e.target.value)}
                  placeholder="Ex: Proverbe du jour..."
                  helperText="Optionnel"
                />
              </div>

              {/* Messages bilingues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Message en malgache *"
                  value={messageMg}
                  onChange={(e) => setMessageMg(e.target.value)}
                  placeholder="Soraty eto ny hafatra fampahafantarana..."
                  required
                  rows={3}
                />
                <Textarea
                  label="Message en français"
                  value={messageFr}
                  onChange={(e) => setMessageFr(e.target.value)}
                  placeholder="Texte explicatif pour les lecteurs francophones..."
                  rows={3}
                  helperText="Optionnel"
                />
              </div>

              {/* Badge & Route */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Texte du Badge"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="Ex: Ohabolana, Fanamby, Mise à jour..."
                />
                <Select
                  label="Type de Badge"
                  value={badgeType}
                  onChange={(e) => setBadgeType(e.target.value)}
                  options={BADGE_TYPES.map((b) => ({ label: b.label, value: b.id }))}
                />
                <Select
                  label="Redirection / Route"
                  value={targetRoute}
                  onChange={(e) => setTargetRoute(e.target.value)}
                  options={PRESET_ROUTES.map((r) => ({ label: r.label, value: r.value }))}
                />
              </div>

              {/* Champ d'URL manuelle optionnelle si non présente dans les presets */}
              <div>
                <Input
                  label="Route ou URL personnalisée (Optionnel)"
                  value={targetRoute}
                  onChange={(e) => setTargetRoute(e.target.value)}
                  placeholder="Ex: https://play.google.com/store/apps/details?id=com.devengalere.kantomg ou /jeux"
                  helperText="Vous pouvez saisir une URL externe (ex: Play Store) ou une route interne"
                />
              </div>

              {/* Aperçu mobile */}
              <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Smartphone size={13} style={{ color: 'var(--accent)' }} />
                    Prévisualisation mobile
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="kanto-toggle-group">
                      {(['lockscreen', 'inapp'] as const).map((mode) => (
                        <button key={mode} type="button" onClick={() => setPreviewMode(mode)} className={`kanto-toggle-pill ${previewMode === mode ? 'active' : ''}`}>
                          {mode === 'lockscreen' ? 'Push Écran' : 'Carte In-App'}
                        </button>
                      ))}
                    </div>
                    <div className="kanto-toggle-group">
                      {(['mg', 'fr'] as const).map((lang) => (
                        <button key={lang} type="button" onClick={() => setPreviewLanguage(lang)} className={`kanto-toggle-pill ${previewLanguage === lang ? 'active' : ''}`}>
                          {lang === 'mg' ? 'MG' : 'FR'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {previewMode === 'lockscreen' ? (
                  <div className="max-w-sm mx-auto rounded-2xl border border-zinc-700/50 bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 shadow-xl text-zinc-100">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3 px-1">
                      <span className="font-semibold">09:41</span>
                      <div className="w-16 h-3.5 rounded-full bg-zinc-800 border border-zinc-700 mx-auto" />
                      <span className="text-[10px]">100%</span>
                    </div>
                    <div className="text-center my-3">
                      <div className="text-xs text-zinc-400">{previewLanguage === 'mg' ? 'Talata 22 Septambra' : 'Mardi 22 Septembre'}</div>
                      <div className="text-3xl font-light tracking-tight text-zinc-100 mt-1">09:41</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/10 backdrop-blur-md p-3 shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded bg-[#8B2519] text-white flex items-center justify-center text-[8px] font-bold">K</div>
                          <span className="text-[10px] font-semibold text-zinc-200 uppercase tracking-wider">KANTO</span>
                        </div>
                        <span className="text-[9px] text-zinc-400">{previewLanguage === 'mg' ? 'Vao haingana' : "À l'instant"}</span>
                      </div>
                      <div className="font-semibold text-xs text-white">{activeTitle}</div>
                      <div className="text-[11px] text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">{activeMessage}</div>
                      {badgeText && (
                        <div className="mt-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/15 text-zinc-200 font-medium">{badgeText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto p-3.5 rounded-xl border flex items-start gap-3" style={{ borderColor: 'var(--card-border)', background: 'var(--card)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${currentCat.color}18` }}>
                      {(() => { const CatIcon = currentCat.icon; return <CatIcon size={18} color={currentCat.color} />; })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-xs truncate" style={{ color: 'var(--foreground)' }}>{activeTitle}</div>
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{previewLanguage === 'mg' ? 'Vao haingana' : "À l'instant"}</span>
                      </div>
                      <div className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{activeMessage}</div>
                      {badgeText && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}>
                            {badgeText}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer modal */}
              <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
                <Button variant="outline" type="button" size="md" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  size="md"
                  isLoading={isSubmitting}
                  leftIcon={<Send size={14} />}
                >
                  {isSubmitting ? 'Diffusion...' : 'Diffuser maintenant'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
