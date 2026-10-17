'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Modal, ConfirmModal } from '@/components/ui';
import { systemService } from '@/services/system.service';
import { UserAccount, UserDetails, UserRole } from '@/types';
import { useSession } from '@/lib/auth-client';
import {
  Search,
  ShieldCheck,
  Loader2,
  KeyRound,
  Users as UsersIcon,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle2,
  Eye,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';

type RoleFilter = 'ALL' | 'ADMIN' | 'MODERATOR' | 'CONTRIBUTOR' | 'USER';
type StatusFilter = 'ALL' | 'ACTIVE' | 'BANNED';

const ROLE_BADGES: Record<
  UserRole,
  { label: string; bg: string; text: string; border: string }
> = {
  ADMIN: {
    label: 'Administrateur',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/30',
  },
  MODERATOR: {
    label: 'Modérateur',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/30',
  },
  CONTRIBUTOR: {
    label: 'Contributeur',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/30',
  },
  USER: {
    label: 'Membre',
    bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-500/20',
  },
};

export default function UsersAdminPage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  // Actions & Modales
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetails | null>(null);

  // Modal de suspension (Ban)
  const [banModalState, setBanModalState] = useState<{
    isOpen: boolean;
    user: UserAccount | null;
    reason: string;
    expiresAt: string;
  }>({
    isOpen: false,
    user: null,
    reason: '',
    expiresAt: '',
  });

  // Modal de changement de rôle
  const [roleModalState, setRoleModalState] = useState<{
    isOpen: boolean;
    user: UserAccount | null;
    newRole: UserRole;
  }>({
    isOpen: false,
    user: null,
    newRole: 'USER',
  });

  // Modal de confirmation (débannissement, suppression)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant?: 'primary' | 'danger' | 'warning';
    action: () => Promise<void>;
  } | null>(null);

  // Chargement des utilisateurs avec pagination serveur
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await systemService.getUsers({
        page: currentPage,
        limit: pageSize,
        search: search.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });

      setUsers(res.data);
      if (res.meta) {
        setTotalCount(res.meta.total);
        setTotalPages(res.meta.totalPages || 1);
      } else {
        setTotalCount(res.data.length);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, roleFilter, statusFilter, toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Ouvrir la fiche détaillée
  const handleOpenDetails = async (userId: string) => {
    try {
      const details = await systemService.getUserDetails(userId);
      setSelectedUserDetail(details);
    } catch {
      toast.error('Impossible de charger la fiche utilisateur.');
    }
  };

  // Traiter le bannissement
  const handleConfirmBan = async () => {
    if (!banModalState.user) return;
    if (!banModalState.reason.trim()) {
      toast.error('Un motif de suspension clair est obligatoire.');
      return;
    }

    try {
      const res = await systemService.banUser(
        banModalState.user.id,
        banModalState.reason,
        banModalState.expiresAt || null,
      );
      toast.success(res.message);
      setBanModalState({ isOpen: false, user: null, reason: '', expiresAt: '' });
      void loadUsers();
      if (selectedUserDetail?.user.id === banModalState.user.id) {
        void handleOpenDetails(banModalState.user.id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suspension');
    }
  };

  // Traiter le débannissement
  const handleUnban = (user: UserAccount) => {
    setConfirmModal({
      isOpen: true,
      title: 'Réactiver le compte utilisateur ?',
      description: `Êtes-vous sûr de vouloir réactiver le compte de ${user.name} (${user.email}) ? L'accès à l'application sera immédiatement rétabli.`,
      variant: 'primary',
      action: async () => {
        try {
          const res = await systemService.unbanUser(user.id);
          toast.success(res.message);
          void loadUsers();
          if (selectedUserDetail?.user.id === user.id) {
            void handleOpenDetails(user.id);
          }
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Erreur lors de la réactivation');
        }
      },
    });
  };

  // Traiter le changement de rôle
  const handleConfirmRoleChange = async () => {
    if (!roleModalState.user) return;
    try {
      await systemService.updateUserRole(roleModalState.user.id, roleModalState.newRole);
      toast.success(`Rôle mis à jour en ${roleModalState.newRole}`);
      setRoleModalState({ isOpen: false, user: null, newRole: 'USER' });
      void loadUsers();
      if (selectedUserDetail?.user.id === roleModalState.user.id) {
        void handleOpenDetails(roleModalState.user.id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du changement de rôle');
    }
  };

  // Traiter la suppression
  const handleDeleteUser = (user: UserAccount) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer définitivement ce compte ?',
      description: `Cette action est irréversible. Le compte ${user.email} et ses sessions associées seront supprimés de la base de données.`,
      variant: 'danger',
      action: async () => {
        try {
          const res = await systemService.deleteUser(user.id);
          toast.success(res.message);
          setSelectedUserDetail(null);
          void loadUsers();
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
        }
      },
    });
  };

  // Réinitialiser le mot de passe
  const handleResetPassword = async (user: UserAccount) => {
    try {
      const res = await systemService.resetUserPassword(user.id);
      toast.success(res.message);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur envoi email réinitialisation');
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-5 pb-8">
        <PageHeader
          title="Gestion des Utilisateurs"
          description="Administration des comptes, gestion des permissions, modération et suivi d'engagement citoyen."
          badge={
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--accent)]">
              {totalCount} compte(s) enregistré(s)
            </span>
          }
          icon={UsersIcon}
          actions={
            <button
              type="button"
              onClick={() => void loadUsers()}
              title="Actualiser la liste"
              className="p-1.5 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
            >
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
        />

        {/* Barre de filtres et recherche */}
        <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou pseudo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent)] transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtre Rôle */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as RoleFilter);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="ADMIN">Administrateurs</option>
              <option value="MODERATOR">Modérateurs</option>
              <option value="CONTRIBUTOR">Contributeurs</option>
              <option value="USER">Membres</option>
            </select>

            {/* Filtre Statut */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actifs uniquement</option>
              <option value="BANNED">Suspendus uniquement</option>
            </select>
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--card-border)] bg-[var(--card-hover)] text-[var(--text-muted)] font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-medium">Utilisateur</th>
                  <th className="py-2.5 px-3 font-medium">Rôle</th>
                  <th className="py-2.5 px-3 font-medium">Statut</th>
                  <th className="py-2.5 px-3 font-medium">Inscription</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                      <Loader2 size={18} className="animate-spin inline-block mr-2" />
                      Chargement des comptes...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[var(--text-muted)]">
                      Aucun utilisateur ne correspond aux critères de recherche.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUserId;
                    const isBanned = Boolean(u.banned);
                    const badge = ROLE_BADGES[u.role] || ROLE_BADGES.USER;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-[var(--card-hover)] transition-colors ${
                          isBanned ? 'bg-red-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center font-bold text-xs text-[var(--text-muted)] shrink-0 overflow-hidden">
                              {u.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={u.image}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (u.name || 'U').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--foreground)] truncate flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-purple-500/20 text-purple-600 dark:text-purple-300 font-mono">
                                    Vous
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                              <Ban size={10} /> Suspendu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={10} /> Actif
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-[var(--text-muted)] font-mono">
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void handleOpenDetails(u.id)}
                              title="Voir la fiche détaillée"
                              className="p-1.5 rounded-md hover:bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => setRoleModalState({ isOpen: true, user: u, newRole: u.role })}
                              title={isSelf ? 'Auto-modification interdite' : 'Modifier les permissions'}
                              className="p-1.5 rounded-md hover:bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                              <ShieldCheck size={14} />
                            </button>

                            {isBanned ? (
                              <button
                                type="button"
                                onClick={() => handleUnban(u)}
                                title="Réactiver le compte"
                                className="p-1.5 rounded-md hover:bg-emerald-500/10 text-emerald-600 transition cursor-pointer"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isSelf || u.role === 'ADMIN'}
                                onClick={() =>
                                  setBanModalState({
                                    isOpen: true,
                                    user: u,
                                    reason: '',
                                    expiresAt: '',
                                  })
                                }
                                title={
                                  isSelf || u.role === 'ADMIN'
                                    ? 'Impossible de suspendre un administrateur'
                                    : 'Suspendre le compte'
                                }
                                className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              >
                                <Ban size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Barre de pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[var(--card-border)] bg-[var(--card-hover)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <div>
                Page <span className="font-semibold text-[var(--foreground)]">{currentPage}</span> sur{' '}
                <span className="font-semibold text-[var(--foreground)]">{totalPages}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
                >
                  <ChevronLeft size={13} /> Précédent
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1"
                >
                  Suivant <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal : Fiche Utilisateur Détaillée */}
        {selectedUserDetail && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedUserDetail(null)}
            title="Fiche Utilisateur"
            maxWidth="2xl"
          >
            <div className="space-y-5 text-xs">
              {/* Carte Profil */}
              <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center font-bold text-base text-[var(--accent)] shrink-0 overflow-hidden">
                  {selectedUserDetail.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedUserDetail.user.image}
                      alt={selectedUserDetail.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (selectedUserDetail.user.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[var(--foreground)]">
                      {selectedUserDetail.user.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        (ROLE_BADGES[selectedUserDetail.user.role] || ROLE_BADGES.USER).bg
                      } ${(ROLE_BADGES[selectedUserDetail.user.role] || ROLE_BADGES.USER).text} ${
                        (ROLE_BADGES[selectedUserDetail.user.role] || ROLE_BADGES.USER).border
                      }`}
                    >
                      {(ROLE_BADGES[selectedUserDetail.user.role] || ROLE_BADGES.USER).label}
                    </span>
                    {selectedUserDetail.user.banned && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                        Compte Suspendu
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                    {selectedUserDetail.user.email} • ID: {selectedUserDetail.user.id}
                  </div>
                  {selectedUserDetail.user.banned && selectedUserDetail.user.banReason && (
                    <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px]">
                      <strong>Motif de suspension :</strong> {selectedUserDetail.user.banReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Métriques d'engagement */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Niveau</div>
                  <div className="text-base font-bold text-[var(--accent)] mt-0.5">
                    {selectedUserDetail.progress?.level || 1}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Total XP</div>
                  <div className="text-base font-bold text-[var(--foreground)] mt-0.5">
                    {selectedUserDetail.progress?.totalXp || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Contributions</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedUserDetail.metrics.contributions.approved} / {selectedUserDetail.metrics.contributions.total}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Quiz UGC</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {selectedUserDetail.metrics.counts.quizSets || 0}
                  </div>
                </div>
              </div>

              {/* Historique des signalements */}
              {selectedUserDetail.reportsAgainstUser.length > 0 && (
                <div className="space-y-2">
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={13} />
                    Signalements enregistrés contre ce compte ({selectedUserDetail.reportsAgainstUser.length})
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedUserDetail.reportsAgainstUser.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-2 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[11px] flex justify-between items-center"
                      >
                        <div>
                          <span className="font-semibold text-[var(--foreground)]">{rep.reason}</span>
                          {rep.description && (
                            <span className="text-[var(--text-muted)] ml-2">— {rep.description}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          {new Date(rep.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Rapides Administrateur */}
              <div className="pt-2 border-t border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleResetPassword(selectedUserDetail.user)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound size={13} /> Réinitialiser mot de passe
                </button>

                <div className="flex items-center gap-2">
                  {selectedUserDetail.user.banned ? (
                    <button
                      type="button"
                      onClick={() => handleUnban(selectedUserDetail.user)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 size={13} /> Réactiver le compte
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={selectedUserDetail.user.id === currentUserId || selectedUserDetail.user.role === 'ADMIN'}
                      onClick={() =>
                        setBanModalState({
                          isOpen: true,
                          user: selectedUserDetail.user,
                          reason: '',
                          expiresAt: '',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Ban size={13} /> Suspendre ce compte
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={selectedUserDetail.user.id === currentUserId}
                    onClick={() => handleDeleteUser(selectedUserDetail.user)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Supprimer définitivement"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal : Suspendre / Bannir */}
        {banModalState.isOpen && banModalState.user && (
          <Modal
            isOpen={true}
            onClose={() => setBanModalState({ isOpen: false, user: null, reason: '', expiresAt: '' })}
            title={`Suspendre le compte de ${banModalState.user.name}`}
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <p className="text-[var(--text-muted)]">
                L&apos;utilisateur ne pourra plus se connecter et toutes ses sessions actives seront
                révoquées immédiatement.
              </p>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--foreground)]">
                  Motif de la sanction <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={banModalState.reason}
                  onChange={(e) =>
                    setBanModalState((s) => ({ ...s, reason: e.target.value }))
                  }
                  placeholder="Ex: Propos injurieux répétés dans les commentaires..."
                  className="w-full p-2.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--foreground)]">
                  Date d&apos;expiration (Optionnel — laisser vide pour suspension définitive)
                </label>
                <input
                  type="date"
                  value={banModalState.expiresAt}
                  onChange={(e) =>
                    setBanModalState((s) => ({ ...s, expiresAt: e.target.value }))
                  }
                  className="w-full p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs text-[var(--foreground)] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() =>
                    setBanModalState({ isOpen: false, user: null, reason: '', expiresAt: '' })
                  }
                  className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBan}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                >
                  Confirmer la suspension
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal : Modifier Rôle */}
        {roleModalState.isOpen && roleModalState.user && (
          <Modal
            isOpen={true}
            onClose={() => setRoleModalState({ isOpen: false, user: null, newRole: 'USER' })}
            title={`Modifier les permissions de ${roleModalState.user.name}`}
            maxWidth="md"
          >
            <div className="space-y-4 text-xs">
              <p className="text-[var(--text-muted)]">
                Sélectionnez le nouveau rôle pour <strong>{roleModalState.user.email}</strong> :
              </p>

              <div className="space-y-2">
                {(['USER', 'CONTRIBUTOR', 'MODERATOR', 'ADMIN'] as UserRole[]).map((r) => (
                  <label
                    key={r}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                      roleModalState.newRole === r
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--card-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={roleModalState.newRole === r}
                        onChange={() => setRoleModalState((s) => ({ ...s, newRole: r }))}
                        className="accent-[var(--accent)]"
                      />
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        {ROLE_BADGES[r]?.label || r}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setRoleModalState({ isOpen: false, user: null, newRole: 'USER' })}
                  className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRoleChange}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent)] hover:opacity-90 text-white font-semibold transition"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal générique de confirmation */}
        {confirmModal && (
          <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(null)}
            title={confirmModal.title}
            description={confirmModal.description}
            variant={confirmModal.variant || 'primary'}
            onConfirm={async () => {
              await confirmModal.action();
              setConfirmModal(null);
            }}
          />
        )}
      </div>
    </AdminShell>
  );
}
