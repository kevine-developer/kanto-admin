'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { fetchApi } from '@/lib/api-client';
import {
  Megaphone,
  Plus,
  RotateCcw,
  Trash2,
  CheckCircle2,
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
  { id: 'NEW_FEATURE', label: 'Nouveauté / Vaovao', icon: Sparkles, color: '#C0392B', bg: 'bg-red-500/10 text-red-500 border-red-500/20' },
];

/**
 * Page d'administration des annonces système bilingues (malgache/français).
 * Permet la création, modification, suppression et activation/désactivation des bannières in-app.
 */
export default function AnnouncementsAdminPage() {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setAnnouncements(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des annonces.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchApi<SystemAnnouncement[]>('/announcements')
      .then((data) => {
        if (isMounted) setAnnouncements(data || []);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des annonces.';
        setMessage({ type: 'error', text: msg });
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
    setType('INFO');
    setIsActive(true);
    setVersion(1);
    setEditingId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (ann: SystemAnnouncement) => {
    setTitleMg(ann.titleMg);
    setTitleFr(ann.titleFr);
    setMessageMg(ann.messageMg);
    setMessageFr(ann.messageFr);
    setType(ann.type);
    setIsActive(ann.isActive);
    setVersion(ann.version);
    setEditingId(ann.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleMg.trim() || !messageMg.trim() || !titleFr.trim() || !messageFr.trim()) {
      setMessage({ type: 'error', text: 'Tous les champs de titre et de message sont requis.' });
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
        version: Number(version),
      };

      if (editingId) {
        await fetchApi(`/announcements/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setMessage({ type: 'success', text: 'Annonce modifiée avec succès !' });
      } else {
        await fetchApi('/announcements', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage({ type: 'success', text: 'Nouvelle annonce créée avec succès !' });
      }

      setIsModalOpen(false);
      resetForm();
      await loadAnnouncements();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de l\'enregistrement de l\'annonce.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (ann: SystemAnnouncement) => {
    try {
      await fetchApi(`/announcements/${ann.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !ann.isActive }),
      });
      await loadAnnouncements();
      setMessage({ type: 'success', text: `Annonce ${!ann.isActive ? 'activée' : 'désactivée'}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de modification.';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette annonce ?')) return;
    try {
      await fetchApi(`/announcements/${id}`, { method: 'DELETE' });
      await loadAnnouncements();
      setMessage({ type: 'success', text: 'Annonce supprimée.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de suppression.';
      setMessage({ type: 'error', text: msg });
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
                Gérez les modales d&apos;information, maintenance et nouveautés au démarrage de l&apos;app
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAnnouncements()}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--sidebar-muted)' }}
              title="Rafraîchir"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm"
              style={{ background: 'var(--accent)' }}
            >
              <Plus size={16} />
              Nouvelle Annonce
            </button>
          </div>
        </div>

        {/* Notifications toast-like (simples) */}
        {message && (
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
            <button onClick={() => setMessage(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Liste des annonces */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
            <p className="text-sm font-medium text-zinc-500">Chargement des annonces...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed rounded-2xl" style={{ borderColor: 'var(--sidebar-border)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-zinc-500/5 text-zinc-400">
              <Megaphone size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>Aucune annonce</h3>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--sidebar-muted)' }}>
              Vous n&apos;avez pas encore créé d&apos;annonce système.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
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
                    borderColor: 'var(--sidebar-border)',
                    background: 'var(--card-bg)',
                    opacity: ann.isActive ? 1 : 0.6,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${catConfig.bg}`}>
                      <CatIcon size={18} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleActive(ann)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          ann.isActive 
                          ? 'text-emerald-500 hover:bg-emerald-500/10' 
                          : 'text-zinc-400 hover:bg-zinc-500/10'
                        }`}
                        title={ann.isActive ? "Désactiver" : "Activer"}
                      >
                        {ann.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => handleEdit(ann)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div>
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
                  
                  <div className="flex items-center justify-between mt-2 pt-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-muted)' }}>
                         v{ann.version}
                       </span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--sidebar-muted)' }}>
                      {new Date(ann.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL CRÉATION / ÉDITION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 pt-6 sm:pt-10 md:pt-12">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div 
            className="relative w-full max-w-2xl rounded-2xl flex flex-col shadow-xl max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5.5rem)] animate-in fade-in slide-in-from-top-3 duration-150"
            style={{ background: 'var(--background)', border: '1px solid var(--sidebar-border)' }}
          >
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                    {editingId ? "Modifier l'annonce" : 'Créer une annonce'}
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--sidebar-muted)' }}>
                    Configurez le message qui apparaîtra à l&apos;ouverture de l&apos;application
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--sidebar-muted)' }}
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <form id="announcement-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      {ANNOUNCEMENT_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                      Version de l&apos;annonce
                    </label>
                    <div className="flex items-center gap-2">
                       <input
                        type="number"
                        min="1"
                        value={version}
                        onChange={(e) => setVersion(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all"
                        style={{
                          background: 'var(--card-bg)',
                          borderColor: 'var(--sidebar-border)',
                          color: 'var(--foreground)',
                        }}
                        required
                      />
                      <div className="text-[10px] leading-tight" style={{ color: 'var(--sidebar-muted)' }}>
                        Incrémentez pour forcer l&apos;affichage si déjà lue.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                        Titre (Français) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={titleFr}
                        onChange={(e) => setTitleFr(e.target.value)}
                        placeholder="Ex: Mise à jour importante"
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
                        placeholder="Ex: L&apos;application sera en maintenance demain..."
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
                
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--sidebar-muted)' }}>
                        Titre (Malgache) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={titleMg}
                        onChange={(e) => setTitleMg(e.target.value)}
                        placeholder="Ex: Fanavaozana lehibe"
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
                        placeholder="Ex: Hisy fikojakojana rahampitso..."
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
                
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--sidebar-bg)' }}>
                   <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`p-1 rounded-full transition-colors ${
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
                        Si activée, cette annonce remplacera l&apos;annonce active actuelle.
                      </div>
                    </div>
                </div>

              </form>
            </div>

            <div className="p-5 border-t flex items-center justify-end gap-3" style={{ borderColor: 'var(--sidebar-border)', background: 'var(--card-bg)' }}>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: 'var(--foreground)', background: 'var(--sidebar-bg)' }}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                form="announcement-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'var(--accent)' }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {editingId ? 'Enregistrer' : 'Créer l\'annonce'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
