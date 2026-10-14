'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
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
  Flame,
  BookOpen,
  Scale,
  Users,
  Info,
  Download,
  ArrowUpRight,
  Sparkles,
  Radio,
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

const PRESET_ROUTES = [
  { label: 'Aucun lien (Informatif)', value: '' },
  { label: 'Google Play Store (Mise à jour)', value: DEFAULT_PLAYSTORE_URL },
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
];

export default function NotificationsManagementPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // État du formulaire de création générale
  const [titleMg, setTitleMg] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [messageMg, setMessageMg] = useState('');
  const [messageFr, setMessageFr] = useState('');
  const [category, setCategory] = useState('culture');
  const [badgeText, setBadgeText] = useState('');
  const [badgeType, setBadgeType] = useState('new');
  const [targetRoute, setTargetRoute] = useState('');

  // État du formulaire de mise à jour Play Store
  const [updateVersion, setUpdateVersion] = useState('v0.0.8');
  const [updateType, setUpdateType] = useState<'features' | 'fixes' | 'major'>('features');
  const [updatePlayStoreUrl, setUpdatePlayStoreUrl] = useState(DEFAULT_PLAYSTORE_URL);
  const [updateTitleMg, setUpdateTitleMg] = useState('Fanavaozana Kanto vaovao azo alaina !');
  const [updateTitleFr, setUpdateTitleFr] = useState('Nouvelle mise à jour Kanto disponible !');
  const [updateMessageMg, setUpdateMessageMg] = useState(
    "Misy fanatsarana sy endri-javatra vaovao azo alaina ao amin'ny Google Play Store. Havaozy izao ny fampiharana Kanto !"
  );
  const [updateMessageFr, setUpdateMessageFr] = useState(
    'Une nouvelle version de Kanto est disponible sur le Google Play Store avec des améliorations et correctifs.'
  );
  const [updateBadgeText, setUpdateBadgeText] = useState('Mise à jour v0.0.8');


  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi<NotificationItem[]>('/admin/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger les notifications';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const resetForm = () => {
    setTitleMg('');
    setTitleFr('');
    setMessageMg('');
    setMessageFr('');
    setCategory('culture');
    setBadgeText('');
    setBadgeType('new');
    setTargetRoute('');
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
      const res = await fetchApi<{ success: boolean; message: string }>(
        '/admin/notifications/test-push',
        { method: 'POST', body: JSON.stringify({}) }
      );
      setMessage({ type: res.success ? 'success' : 'error', text: res.message || 'Test push exécuté avec succès.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du test push.';
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
          iconName: targetRoute.includes('play.google.com')
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
      setMessage({ type: 'success', text: 'Notification diffusée avec succès !' });
      setIsModalOpen(false);
      resetForm();
      await loadNotifications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de diffusion.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPlayStoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitleMg.trim() || !updateMessageMg.trim()) {
      setMessage({ type: 'error', text: 'Le titre et message en malgache sont obligatoires.' });
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

      setMessage({ type: 'success', text: `Mise à jour (${updateVersion}) diffusée vers le Play Store !` });
      setIsUpdateModalOpen(false);
      await loadNotifications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de diffusion Play Store.';
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

  return (
    <AdminShell>
      <div className="space-y-5 max-w-5xl mx-auto pb-12">
        {/* En-tête standard */}
        <PageHeader
          title="Notifications Push & Alertes"
          description="Diffusion des annonces temps réel, rappels culturels et mises à jour Google Play Store."
          icon={Bell}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsUpdateModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Sparkles size={13} />
                <span>Alerte Play Store</span>
              </button>

              <button
                onClick={handleTestPush}
                disabled={isTestingPush}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 shadow-xs"
                title="Tester l'envoi d'une notification push"
              >
                {isTestingPush ? (
                  <Loader2 size={13} className="animate-spin text-amber-500" />
                ) : (
                  <Radio size={13} className="text-amber-500" />
                )}
                <span>Test Push</span>
              </button>

              <button
                onClick={loadNotifications}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer shadow-xs"
                title="Actualiser"
              >
                <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                leftIcon={<Plus size={14} />}
              >
                Diffuser une notification
              </Button>
            </div>
          }
        />

        {/* Message toast inline */}
        {message && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-xs ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100 transition cursor-pointer">
              <X size={13} />
            </button>
          </div>
        )}

        {/* 4 Métriques compactes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="text-[11px] text-[var(--text-muted)]">Total diffusées</div>
            <div className="text-base font-bold font-mono text-[var(--foreground)]">{notifications.length}</div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="text-[11px] text-[var(--text-muted)]">Play Store</div>
            <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {notifications.filter((n) => n.targetRoute?.includes('play.google.com') || n.badgeType === 'update').length}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="text-[11px] text-[var(--text-muted)]">Culture &amp; Angano</div>
            <div className="text-base font-bold font-mono text-red-600 dark:text-red-400">
              {notifications.filter((n) => n.category === 'culture').length}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="text-[11px] text-[var(--text-muted)]">Jeux &amp; Défis</div>
            <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
              {notifications.filter((n) => n.category === 'game').length}
            </div>
          </div>
        </div>

        {/* Tableau épuré des notifications */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Historique des diffusions ({notifications.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
              <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
              <span className="text-xs">Chargement...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-muted)]">
              <Bell size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">Aucune notification diffusée pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] font-semibold text-[11px]">
                    <th className="px-4 py-2.5">Catégorie</th>
                    <th className="px-4 py-2.5">Titre</th>
                    <th className="px-4 py-2.5">Message</th>
                    <th className="px-4 py-2.5">Redirection</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                  {notifications.map((item) => {
                    const isPlayStore = Boolean(item.targetRoute?.includes('play.google.com'));
                    const catObj = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
                    const dateFormatted = new Date(item.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={item.id} className="hover:bg-[var(--card-hover)] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isPlayStore ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Download size={10} />
                              Play Store
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${catObj.bg}`}>
                              {catObj.label.split('&')[0].trim()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="font-semibold text-[var(--foreground)] truncate">{item.titleMg}</div>
                          {item.titleFr && (
                            <div className="text-[11px] text-[var(--text-muted)] italic truncate">{item.titleFr}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[300px]">
                          <div className="text-[var(--foreground)] line-clamp-1">{item.messageMg}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.targetRoute ? (
                            isPlayStore ? (
                              <a
                                href={item.targetRoute}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline"
                              >
                                <span>Play Store</span>
                                <ArrowUpRight size={10} />
                              </a>
                            ) : (
                              <span className="text-[11px] font-mono text-[var(--text-muted)] truncate max-w-[140px] inline-block">
                                {item.targetRoute}
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-[var(--text-subtle)]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                          {dateFormatted}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                            title="Supprimer"
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

      {/* ── MODALE 1 : MISE À JOUR PLAY STORE ───────────────────────── */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Download size={15} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[var(--foreground)]">Alerte Mise à jour Play Store</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Redirection directe vers Google Play</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitPlayStoreUpdate} className="overflow-y-auto p-5 space-y-3.5 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Version *"
                  value={updateVersion}
                  onChange={(e) => {
                    setUpdateVersion(e.target.value);
                    setUpdateBadgeText(`Mise à jour ${e.target.value}`);
                  }}
                  placeholder="v0.0.8"
                  required
                />
                <Select
                  label="Type de mise à jour"
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value as 'features' | 'fixes' | 'major')}
                  options={[
                    { label: 'Nouveautés', value: 'features' },
                    { label: 'Correctifs', value: 'fixes' },
                    { label: 'Majeure', value: 'major' },
                  ]}
                />
              </div>

              <Input
                label="Lien Google Play Store *"
                value={updatePlayStoreUrl}
                onChange={(e) => setUpdatePlayStoreUrl(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Titre malgache *"
                  value={updateTitleMg}
                  onChange={(e) => setUpdateTitleMg(e.target.value)}
                  required
                />
                <Input
                  label="Titre français"
                  value={updateTitleFr}
                  onChange={(e) => setUpdateTitleFr(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Textarea
                  label="Message malgache *"
                  value={updateMessageMg}
                  onChange={(e) => setUpdateMessageMg(e.target.value)}
                  rows={2}
                  required
                />
                <Textarea
                  label="Message français"
                  value={updateMessageFr}
                  onChange={(e) => setUpdateMessageFr(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--card-border)]">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsUpdateModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} leftIcon={<Send size={13} />}>
                  {isSubmitting ? 'Diffusion...' : 'Diffuser sur Play Store'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODALE 2 : DIFFUSER UNE NOTIFICATION GÉNÉRALE ──────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-[var(--card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] text-[var(--accent-text)] flex items-center justify-center">
                  <Send size={14} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-[var(--foreground)]">Nouvelle notification</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Diffusion immédiate à tous les utilisateurs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-3.5 flex-1">
              {/* Modèles rapides */}
              <div>
                <span className="text-[11px] font-semibold text-[var(--foreground)] mb-1.5 block">
                  Modèles culturels prêts à l&apos;emploi
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CULTURAL_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[11px] font-medium text-[var(--foreground)] transition cursor-pointer"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégorie */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const IconComp = c.icon;
                  const isSelected = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)]'
                      }`}
                    >
                      <IconComp size={13} style={{ color: c.color }} />
                      <span className="truncate">{c.label.split('&')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Titres bilingues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Titre malgache *"
                  value={titleMg}
                  onChange={(e) => setTitleMg(e.target.value)}
                  placeholder="Lohateny..."
                  required
                />
                <Input
                  label="Titre français"
                  value={titleFr}
                  onChange={(e) => setTitleFr(e.target.value)}
                  placeholder="Titre optionnel..."
                />
              </div>

              {/* Messages bilingues */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Textarea
                  label="Message malgache *"
                  value={messageMg}
                  onChange={(e) => setMessageMg(e.target.value)}
                  placeholder="Hafatra..."
                  rows={2}
                  required
                />
                <Textarea
                  label="Message français"
                  value={messageFr}
                  onChange={(e) => setMessageFr(e.target.value)}
                  placeholder="Message optionnel..."
                  rows={2}
                />
              </div>

              {/* Route & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Redirection interne ou externe"
                  value={targetRoute}
                  onChange={(e) => setTargetRoute(e.target.value)}
                  options={PRESET_ROUTES}
                />
                <Input
                  label="Texte du badge (optionnel)"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="ex: Ohabolana, Fanamby..."
                />
              </div>

              {/* Actions footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--card-border)]">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} leftIcon={<Send size={13} />}>
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
