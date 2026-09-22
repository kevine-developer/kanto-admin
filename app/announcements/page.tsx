'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { fetchApi } from '@/lib/api-client';
import { useToast } from '@/lib/hooks/useToast';
import {
  Megaphone,
  Plus,
  RotateCcw,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Send,
  Info,
  Wrench,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Pencil,
  CheckCircle,
} from 'lucide-react';

export interface SystemAnnouncement {
  id: string;
  titleFr: string;
  titleMg: string;
  messageFr: string;
  messageMg: string;
  type: 'INFO' | 'MAINTENANCE' | 'NEW_FEATURE';
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const ANNOUNCEMENT_TYPES = [
  { id: 'INFO', label: 'Information / Fampahafantarana', icon: Info, color: '#2980B9', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'MAINTENANCE', label: 'Maintenance / Fikojakojana', icon: Wrench, color: '#E67E22', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'NEW_FEATURE', label: 'Nouveauté / Vaovao', icon: Sparkles, color: '#8B5CF6', bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
];

/**
 * Page d'administration des annonces système bilingues (malgache/français).
 * Permet la création, modification, suppression et activation/désactivation des bannières in-app.
 */
export default function AnnouncementsAdminPage() {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Modal création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [titleMg, setTitleMg] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [messageMg, setMessageMg] = useState('');
  const [messageFr, setMessageFr] = useState('');
  const [type, setType] = useState<'INFO' | 'MAINTENANCE' | 'NEW_FEATURE'>('INFO');
  const [isActive, setIsActive] = useState(true);
  const [version, setVersion] = useState(1);

  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchApi<SystemAnnouncement[]>('/announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des annonces.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const resetForm = () => {
    setTitleMg('');
    setTitleFr('');
    setMessageMg('');
    setMessageFr('');
    setType('INFO');
    setIsActive(true);
    setVersion(1);
    setEditingId(null);
    setModalError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (ann: SystemAnnouncement) => {
    setTitleMg(ann.titleMg || '');
    setTitleFr(ann.titleFr || '');
    setMessageMg(ann.messageMg || '');
    setMessageFr(ann.messageFr || '');
    setType(ann.type || 'INFO');
    setIsActive(Boolean(ann.isActive));
    setVersion(Number(ann.version) || 1);
    setEditingId(ann.id);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!titleMg.trim() || !messageMg.trim() || !titleFr.trim() || !messageFr.trim()) {
      setModalError('Tous les champs de titre et de message sont obligatoires.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        titleMg: titleMg.trim(),
        titleFr: titleFr.trim(),
        messageMg: messageMg.trim(),
        messageFr: messageFr.trim(),
        type,
        isActive,
        version: Math.max(1, Number(version) || 1),
      };

      if (editingId) {
        await fetchApi(`/announcements/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Annonce modifiée avec succès.');
      } else {
        await fetchApi('/announcements', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Nouvelle annonce créée avec succès.');
      }

      setIsModalOpen(false);
      resetForm();
      await loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Échec de l'enregistrement de l'annonce.";
      setModalError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (ann: SystemAnnouncement) => {
    const nextState = !ann.isActive;
    try {
      // Mise à jour optimiste dans l'UI
      setAnnouncements((prev) =>
        prev.map((item) => {
          if (item.id === ann.id) {
            return { ...item, isActive: nextState };
          }
          // Si on active celle-ci, désactiver les autres
          if (nextState) {
            return { ...item, isActive: false };
          }
          return item;
        })
      );

      await fetchApi(`/announcements/${ann.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextState }),
      });
      toast.success(nextState ? 'Annonce activée.' : 'Annonce désactivée.');
      await loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de modification.';
      toast.error(msg);
      await loadAnnouncements();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette annonce ?')) return;
    try {
      await fetchApi(`/announcements/${id}`, { method: 'DELETE' });
      toast.success('Annonce supprimée avec succès.');
      await loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de suppression.';
      toast.error(msg);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sidebar-border)] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
              <Megaphone size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display" style={{ color: 'var(--foreground)' }}>
                Annonces Système
              </h1>
              <p className="text-xs mt-1" style={{ color: 'var(--sidebar-muted)' }}>
                Gérez les modales d&apos;information, maintenance et nouveautés au démarrage de l&apos;application mobile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadAnnouncements()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: 'var(--sidebar-muted)' }}
              title="Rafraîchir"
            >
              <RotateCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm cursor-pointer"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={16} />
              Nouvelle Annonce
            </button>
          </div>
        </div>

        {/* Liste des annonces */}
        {isLoading && announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
            <p className="text-sm font-medium text-zinc-500">Chargement des annonces...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed rounded-2xl"
            style={{ borderColor: 'var(--sidebar-border)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-zinc-500/5 text-zinc-400">
              <Megaphone size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
              Aucune annonce enregistrée
            </h3>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--sidebar-muted)' }}>
              Créez une annonce pour informer les utilisateurs des nouveautés ou de maintenances planifiées.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              style={{ background: 'var(--sidebar-accent)', color: 'var(--foreground)' }}
            >
              <Plus size={16} />
              Créer la première annonce
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((ann) => {
              const catConfig = ANNOUNCEMENT_TYPES.find((c) => c.id === ann.type) || ANNOUNCEMENT_TYPES[0];
              const CatIcon = catConfig.icon;

              return (
                <div
                  key={ann.id}
                  className="flex flex-col rounded-2xl border transition-all hover:shadow-sm p-5 gap-4"
                  style={{
                    borderColor: ann.isActive ? 'var(--accent)' : 'var(--sidebar-border)',
                    background: 'var(--card-bg)',
                    opacity: ann.isActive ? 1 : 0.75,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${catConfig.bg}`}>
                      <CatIcon size={18} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => void handleToggleActive(ann)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          ann.isActive
                            ? 'text-emerald-500 hover:bg-emerald-500/10'
                            : 'text-zinc-400 hover:bg-zinc-500/10'
                        }`}
                        title={ann.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {ann.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                      <button
                        onClick={() => handleEdit(ann)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => void handleDelete(ann.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {ann.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={10} /> Active
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[var(--sidebar-muted)] px-1.5 py-0.5 rounded bg-[var(--sidebar-bg)]">
                        v{ann.version}
                      </span>
                    </div>
                    <h3 className="font-bold text-base line-clamp-1" style={{ color: 'var(--foreground)' }}>
                      {ann.titleFr}
                    </h3>
                    <p className="text-xs font-medium mt-0.5 line-clamp-1" style={{ color: 'var(--accent)' }}>
                      {ann.titleMg}
                    </p>
                  </div>

                  <div className="flex-1 text-sm line-clamp-3" style={{ color: 'var(--sidebar-muted)' }}>
                    <p>{ann.messageFr}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t text-[11px]" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <span className="font-medium" style={{ color: 'var(--sidebar-muted)' }}>
                      {catConfig.label.split('/')[0].trim()}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: 'var(--sidebar-muted)' }}>
                      {new Date(ann.updatedAt || ann.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CRÉATION / ÉDITION INTÉGRÉ AVEC FORMULAIRE NATIF */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />
          <div
            className="relative w-full max-w-2xl rounded-2xl flex flex-col shadow-2xl max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] animate-in fade-in slide-in-from-top-3 duration-150 overflow-hidden"
            style={{ background: 'var(--background)', border: '1px solid var(--sidebar-border)' }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[inherit]">
              {/* Header Modal */}
              <div className="flex items-center justify-between p-5 border-b shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                      {editingId ? "Modifier l'annonce" : 'Créer une annonce'}
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>
                      Configurez le message diffusé aux utilisateurs au démarrage de l&apos;application
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ color: 'var(--sidebar-muted)' }}
                  disabled={isSubmitting}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Corps du Formulaire */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {modalError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                      Type d&apos;annonce
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'INFO' | 'MAINTENANCE' | 'NEW_FEATURE')}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--sidebar-border)',
                        color: 'var(--foreground)',
                      }}
                      required
                    >
                      {ANNOUNCEMENT_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                      Numéro de version
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={version}
                        onChange={(e) => setVersion(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all"
                        style={{
                          background: 'var(--card-bg)',
                          borderColor: 'var(--sidebar-border)',
                          color: 'var(--foreground)',
                        }}
                        required
                      />
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--sidebar-muted)' }}>
                      Augmenter la version pour réafficher la modale aux utilisateurs l&apos;ayant déjà fermée.
                    </span>
                  </div>
                </div>

                {/* Section Français */}
                <div className="space-y-4 pt-2 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                      Titre (Français) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titleFr}
                      onChange={(e) => setTitleFr(e.target.value)}
                      placeholder="Ex: Mise à jour majeure disponible"
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--sidebar-border)',
                        color: 'var(--foreground)',
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                      Message (Français) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={messageFr}
                      onChange={(e) => setMessageFr(e.target.value)}
                      placeholder="Ex: Découvrez les nouveaux contes et légendes de Madagascar..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all resize-none"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--sidebar-border)',
                        color: 'var(--foreground)',
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Section Malgache */}
                <div className="space-y-4 pt-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                      Titre (Malgache) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={titleMg}
                      onChange={(e) => setTitleMg(e.target.value)}
                      placeholder="Ex: Fanavaozana vaovao misy"
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--sidebar-border)',
                        color: 'var(--accent)',
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                      Message (Malgache) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={messageMg}
                      onChange={(e) => setMessageMg(e.target.value)}
                      placeholder="Ex: Fantaro ireo angano sy tantara vaovao malagasy..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all resize-none"
                      style={{
                        background: 'var(--card-bg)',
                        borderColor: 'var(--sidebar-border)',
                        color: 'var(--accent)',
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Statut d'activation */}
                <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`p-1 rounded-full transition-colors cursor-pointer ${
                      isActive ? 'text-emerald-500' : 'text-zinc-400'
                    }`}
                  >
                    {isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                      Annonce Active
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>
                      Si cochée, cette annonce deviendra l&apos;unique annonce active affichée sur l&apos;application.
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Modal avec Boutons natifs */}
              <div
                className="p-5 border-t flex items-center justify-end gap-3 shrink-0"
                style={{ borderColor: 'var(--sidebar-border)', background: 'var(--card-bg)' }}
              >
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  style={{ color: 'var(--foreground)', background: 'var(--sidebar-bg)' }}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: 'var(--accent)' }}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {editingId ? 'Enregistrer les modifications' : "Créer l'annonce"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
