'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { systemService } from '@/services/system.service';
import { UserAccount } from '@/types';
import {
  Search,
  ShieldCheck,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Calendar,
} from 'lucide-react';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await systemService.getUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    systemService
      .getUsers()
      .then((data) => {
        if (!ignore) {
          setUsers(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs';
          setFeedback({ type: 'error', text: msg });
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleRole = async (user: UserAccount) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionLabel = nextRole === 'ADMIN' ? 'promouvoir en Administrateur' : 'rétrograder en Utilisateur simple';

    if (!confirm(`Voulez-vous vraiment ${actionLabel} le compte de ${user.name} (${user.email}) ?`)) {
      return;
    }

    try {
      setUpdatingId(user.id);
      setFeedback(null);

      await systemService.updateUserRole(user.id, nextRole);

      setFeedback({
        type: 'success',
        text: `Le rôle de ${user.name} a été mis à jour en [${nextRole}].`,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u))
      );
      void loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du changement de rôle';
      setFeedback({
        type: 'error',
        text: msg,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <AdminShell>
      <div className="w-full space-y-4 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              Gestion des Utilisateurs
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Supervision des comptes enregistrés et privilèges &bull; {users.length} comptes
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-lg flex items-center justify-between text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Search */}
        <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center text-xs text-neutral-400 gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Chargement des comptes...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-400">
              Aucun utilisateur ne correspond à votre recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 text-neutral-400 font-mono text-[10.5px]">
                    <th className="py-2.5 px-4 font-normal">UTILISATEUR</th>
                    <th className="py-2.5 px-4 font-normal">EMAIL</th>
                    <th className="py-2.5 px-4 font-normal">PRIVILÈGE</th>
                    <th className="py-2.5 px-4 font-normal">INSCRIPTION</th>
                    <th className="py-2.5 px-4 pr-4 text-right font-normal">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-sans">
                  {filteredUsers.map((user) => {
                    const isAdmin = user.role === 'ADMIN';
                    const isUpdating = updatingId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold flex items-center justify-center text-xs">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {user.name}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-500">
                          <div className="flex items-center gap-1.5">
                            <Mail size={13} className="text-neutral-400" />
                            <span>{user.email}</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <ShieldCheck size={12} />
                              <span>ADMIN</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                              <User size={12} />
                              <span>MEMBRE</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-4 text-[11px] text-neutral-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-neutral-400" />
                            <span>
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={isUpdating}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
                              isAdmin
                                ? 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                : 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90'
                            }`}
                          >
                            {isUpdating ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : isAdmin ? (
                              'Rétrograder'
                            ) : (
                              'Promouvoir'
                            )}
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
    </AdminShell>
  );
}
