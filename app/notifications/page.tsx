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
  Sparkles,
  BookOpen,
  Flame,
  Scale,
  Users,
  Info,
  ExternalLink,
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

export default function NotificationsAdminPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [titleMg, setTitleMg] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [messageMg, setMessageMg] = useState('');
  const [messageFr, setMessageFr] = useState('');
  const [category, setCategory] = useState('culture');
  const [badgeText, setBadgeText] = useState('');
  const [badgeType, setBadgeType] = useState('new');
  const [targetRoute, setTargetRoute] = useState('');

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
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
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
                Diffuser des annonces, actualités culturelles et rappels à tous les utilisateurs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadNotifications}
              disabled={isLoading}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--sidebar-border)] text-[var(--foreground)] hover:bg-[var(--sidebar-border)]/20 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              Actualiser
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
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--sidebar-border)]/40 text-[var(--foreground)] border border-[var(--sidebar-border)]">
                                {item.badgeText}
                              </span>
                            )}
                            {item.targetRoute ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--muted)] font-mono">
                                <ExternalLink size={10} />
                                {item.targetRoute.split('/').pop()}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--muted)]">Général</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 align-top text-[var(--muted)] text-[11px] whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors inline-block"
                            title="Supprimer la notification"
                          >
                            <Trash2 size={15} />
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
            <div className="w-full max-w-2xl rounded-2xl border border-[var(--sidebar-border)] bg-[var(--card-bg)] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] animate-in fade-in slide-in-from-top-3 duration-150">
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
                      L&apos;annonce sera instantanément visible sur l&apos;application mobile de tous les lecteurs
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

              {/* Contenu du formulaire avec Live Preview */}
              <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
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
                      placeholder="Ex: Ohabolana, +25 Pts..."
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

                {/* Aperçu en direct façon carte mobile (Live Preview) */}
                <div className="p-4 rounded-xl border border-[var(--sidebar-border)] bg-[var(--background)] space-y-2">
                  <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    Aperçu sur l&apos;application mobile
                  </div>

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
                          {titleMg || 'Titre de la notification'}
                        </div>
                        <span className="text-[10px] text-[var(--muted)] shrink-0">Vao haingana</span>
                      </div>

                      <div className="text-xs text-[var(--foreground)]/80 mt-1 line-clamp-2">
                        {messageMg || 'Le message de la notification s’affichera ici.'}
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
