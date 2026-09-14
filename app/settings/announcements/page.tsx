'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchApi } from '@/lib/api-client';
import { useToast } from '@/lib/hooks/useToast';
import { Megaphone, Plus, Save, Trash2, CheckCircle, Info, Hammer, Sparkles } from 'lucide-react';

interface Announcement {
  id: string;
  titleFr: string;
  titleMg: string;
  messageFr: string;
  messageMg: string;
  type: 'INFO' | 'MAINTENANCE' | 'NEW_FEATURE';
  isActive: boolean;
  version: number;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Announcement>>({
    titleFr: '',
    titleMg: '',
    messageFr: '',
    messageMg: '',
    type: 'INFO',
    isActive: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<Announcement[]>('/announcements');
      setAnnouncements(data);
    } catch {
      toast.error('Erreur lors du chargement des annonces.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      titleFr: announcement.titleFr,
      titleMg: announcement.titleMg,
      messageFr: announcement.messageFr,
      messageMg: announcement.messageMg,
      type: announcement.type,
      isActive: announcement.isActive,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      titleFr: '',
      titleMg: '',
      messageFr: '',
      messageMg: '',
      type: 'INFO',
      isActive: false,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await fetchApi(`/announcements/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
        toast.success('Annonce mise à jour avec succès.');
      } else {
        await fetchApi('/announcements', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success('Nouvelle annonce créée.');
      }
      handleCancel();
      void loadAnnouncements();
    } catch {
      toast.error('Erreur lors de la sauvegarde de l\'annonce.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;
    try {
      await fetchApi(`/announcements/${id}`, { method: 'DELETE' });
      toast.success('Annonce supprimée.');
      void loadAnnouncements();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'MAINTENANCE': return <Hammer size={16} className="text-amber-500" />;
      case 'NEW_FEATURE': return <Sparkles size={16} className="text-purple-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PageHeader
          title="Annonces Système"
          description="Gérez les messages affichés au démarrage de l'application (Nouveautés, Maintenance, Info)."
          icon={Megaphone}
        />

        {/* FORMULAIRE */}
        <section className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--card-border)] pb-3">
            <Plus size={16} className="text-[var(--accent)]" />
            <span>{editingId ? 'Modifier l\'annonce' : 'Créer une nouvelle annonce'}</span>
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--foreground)]">Titre (Français)</label>
                <input
                  type="text"
                  required
                  value={formData.titleFr}
                  onChange={e => setFormData({ ...formData, titleFr: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                  placeholder="Ex: Nouvelle mise à jour !"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--foreground)]">Titre (Malgache)</label>
                <input
                  type="text"
                  required
                  value={formData.titleMg}
                  onChange={e => setFormData({ ...formData, titleMg: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                  placeholder="Ex: Fanavaozana vaovao !"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--foreground)]">Message (Français)</label>
                <textarea
                  required
                  rows={3}
                  value={formData.messageFr}
                  onChange={e => setFormData({ ...formData, messageFr: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                  placeholder="Ex: Découvrez nos nouveaux proverbes..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--foreground)]">Message (Malgache)</label>
                <textarea
                  required
                  rows={3}
                  value={formData.messageMg}
                  onChange={e => setFormData({ ...formData, messageMg: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                  placeholder="Ex: Jereo ireo ohabolana vaovao..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--foreground)]">Type d&apos;annonce</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as Announcement['type'] })}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg text-sm text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
                >
                  <option value="INFO">Information Générale</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="NEW_FEATURE">Nouveauté / Mise à jour</option>
                </select>
              </div>
              <div className="space-y-1 flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  <span className="text-sm font-semibold text-[var(--foreground)]">Activer cette annonce</span>
                </label>
                <span className="ml-2 text-xs text-[var(--text-muted)]">(Désactivera l&apos;annonce active précédente)</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm font-medium hover:bg-[var(--card-hover)]"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </section>

        {/* LISTE DES ANNONCES */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <span>Historique des annonces</span>
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm">Chargement...</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-sm bg-[var(--card)] rounded-2xl border border-[var(--card-border)]">
              Aucune annonce n&apos;a été créée pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {announcements.map(ann => (
                <div key={ann.id} className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-colors ${ann.isActive ? 'border-[var(--accent)] bg-[var(--accent-light)]' : 'border-[var(--card-border)] bg-[var(--card)]'}`}>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getIconForType(ann.type)}
                      <h3 className="font-bold text-sm text-[var(--foreground)]">{ann.titleFr}</h3>
                      {ann.isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle size={10} /> Active
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">v{ann.version}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">{ann.messageFr}</p>
                    <div className="text-[10px] text-[var(--text-subtle)]">
                      Malgache: {ann.titleMg}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(ann)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-white dark:bg-black text-xs font-medium hover:border-[var(--accent)] transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
