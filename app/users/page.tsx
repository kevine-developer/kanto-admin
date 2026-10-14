'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { systemService } from '@/services/system.service';
import { UserAccount } from '@/types';
import {
  Search,
  ShieldCheck,
  User,
  Loader2,
  Calendar,
  KeyRound,
  Users as UsersIcon,
  UserCheck,
  ArrowUpDown,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  List,
  Layers,
  Copy,
} from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';

type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'name_asc'
  | 'name_desc'
  | 'email_asc'
  | 'role_first';

type RoleFilter = 'ALL' | 'ADMIN' | 'USER';
type ViewMode = 'flat' | 'grouped';

export default function UsersAdminPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('flat');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Actions
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await systemService.getUsers();
      setUsers(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, sortBy, pageSize]);

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const members = total - admins;
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const recent = users.filter((u) => new Date(u.createdAt) >= oneMonthAgo).length;

    return { total, admins, members, recent };
  }, [users]);

  // Filtrage et Tri
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.id?.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'email_asc':
          return (a.email || '').localeCompare(b.email || '');
        case 'role_first': {
          if (a.role === b.role) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.role === 'ADMIN' ? -1 : 1;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [users, search, roleFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedUsers, currentPage, pageSize]);

  const groupedUsers = useMemo(() => {
    const admins = filteredAndSortedUsers.filter((u) => u.role === 'ADMIN');
    const members = filteredAndSortedUsers.filter((u) => u.role !== 'ADMIN');
    return { admins, members };
  }, [filteredAndSortedUsers]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const handleResetPassword = async (user: UserAccount) => {
    if (!confirm(`Envoyer un email de réinitialisation de mot de passe à ${user.email} ?`)) {
      return;
    }

    try {
      setResettingId(user.id);
      const res = await systemService.resetUserPassword(user.id);
      toast.success(res.message || `Lien envoyé à ${user.email}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'envoi de réinitialisation";
      toast.error(msg);
    } finally {
      setResettingId(null);
    }
  };

  const handleToggleRole = async (user: UserAccount) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionLabel = nextRole === 'ADMIN' ? 'promouvoir en Administrateur' : 'rétrograder en Membre simple';

    if (!confirm(`Voulez-vous vraiment ${actionLabel} le compte ${user.email} ?`)) {
      return;
    }

    try {
      setUpdatingId(user.id);
      await systemService.updateUserRole(user.id, nextRole);
      toast.success(`Rôle de ${user.name || user.email} mis à jour : [${nextRole}].`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du changement de rôle';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderUserTable = (items: UserAccount[], titleBadge?: string) => (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-xs">
      {titleBadge && (
        <div className="px-4 py-2.5 bg-[var(--input-bg)] border-b border-[var(--card-border)] flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--foreground)]">{titleBadge}</span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {items.length} {items.length > 1 ? 'comptes' : 'compte'}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] font-semibold text-[11px]">
              <th className="py-2.5 px-4">Utilisateur</th>
              <th className="py-2.5 px-4">Adresse Email</th>
              <th className="py-2.5 px-4">Rôle</th>
              <th className="py-2.5 px-4">Inscription</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {items.map((user) => {
              const isAdmin = user.role === 'ADMIN';
              const isUpdating = updatingId === user.id;
              const isResetting = resettingId === user.id;

              return (
                <tr key={user.id} className="hover:bg-[var(--card-hover)] transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                          isAdmin
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-[var(--accent-light)] border-[var(--accent-border)] text-[var(--accent-text)]'
                        }`}
                      >
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--foreground)] truncate">
                          {user.name || 'Sans nom'}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-4 font-mono text-[11px] text-[var(--foreground)]">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate max-w-[200px]">{user.email}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user.email);
                          toast.success('Email copié !');
                        }}
                        className="text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
                        title="Copier l'email"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  </td>

                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <ShieldCheck size={11} />
                        <span>ADMIN</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--card-border)]">
                        <User size={11} />
                        <span>MEMBRE</span>
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[11px] text-[var(--text-muted)]">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleResetPassword(user)}
                        disabled={isResetting}
                        title="Envoyer email de réinitialisation"
                        className="p-1 rounded-md border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer disabled:opacity-50"
                      >
                        {isResetting ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
                      </button>

                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={isUpdating}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer disabled:opacity-50 ${
                          isAdmin
                            ? 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/30'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : isAdmin ? (
                          'Rétrograder'
                        ) : (
                          'Promouvoir Admin'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <AdminShell>
      <div className="space-y-5 max-w-5xl mx-auto pb-12">
        {/* En-tête de page standardisé */}
        <PageHeader
          title="Utilisateurs & Privilèges"
          description="Supervision des comptes membres, gestion des rôles administrateurs et accès."
          icon={UsersIcon}
          actions={
            <button
              onClick={() => void loadUsers()}
              disabled={isLoading}
              title="Rafraîchir"
              className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>
          }
        />

        {/* 4 Métriques compactes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Total inscrits</span>
              <UsersIcon size={12} className="text-[var(--accent)]" />
            </div>
            <div className="text-base font-bold font-mono text-[var(--foreground)] mt-0.5">{stats.total}</div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Administrateurs</span>
              <ShieldCheck size={12} className="text-emerald-500" />
            </div>
            <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.admins}</div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Membres</span>
              <UserCheck size={12} className="text-sky-500" />
            </div>
            <div className="text-base font-bold font-mono text-[var(--foreground)] mt-0.5">{stats.members}</div>
          </div>

          <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-0.5">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
              <span>Récents (30j)</span>
              <Calendar size={12} className="text-amber-500" />
            </div>
            <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{stats.recent}</div>
          </div>
        </div>

        {/* Barre d'outils compacte (Recherche, Filtres rôle, Tri, Vue) */}
        <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] space-y-2.5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email ou identifiant..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <ArrowUpDown size={12} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-2 py-1 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] cursor-pointer outline-none"
                >
                  <option value="date_desc">Plus récents</option>
                  <option value="date_asc">Plus anciens</option>
                  <option value="name_asc">Nom A → Z</option>
                  <option value="name_desc">Nom Z → A</option>
                  <option value="role_first">Admins d&apos;abord</option>
                </select>
              </div>

              {/* Commutateur de vue */}
              <div className="flex items-center rounded-lg border border-[var(--card-border)] p-0.5 bg-[var(--input-bg)]">
                <button
                  onClick={() => setViewMode('flat')}
                  title="Vue liste standard"
                  className={`p-1 rounded-md text-xs transition cursor-pointer ${
                    viewMode === 'flat'
                      ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <List size={13} />
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  title="Vue groupée par rôle"
                  className={`p-1 rounded-md text-xs transition cursor-pointer ${
                    viewMode === 'grouped'
                      ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Layers size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Filtres de rôle en pilules discrètes */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--card-border)]">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                roleFilter === 'ALL'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Tous ({stats.total})
            </button>

            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                roleFilter === 'ADMIN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <ShieldCheck size={11} />
              <span>Admins ({stats.admins})</span>
            </button>

            <button
              onClick={() => setRoleFilter('USER')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                roleFilter === 'USER'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <User size={11} />
              <span>Membres ({stats.members})</span>
            </button>
          </div>
        </div>

        {/* Contenu : Tables d'utilisateurs */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
            <span className="text-xs">Chargement des utilisateurs...</span>
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)] rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-2">
            <UsersIcon size={24} className="mx-auto mb-1 opacity-30" />
            <p className="text-xs font-medium">Aucun utilisateur ne correspond à vos filtres</p>
            <button
              onClick={() => { setSearch(''); setRoleFilter('ALL'); }}
              className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="space-y-4">
            {groupedUsers.admins.length > 0 && renderUserTable(groupedUsers.admins, 'Administrateurs du Système')}
            {groupedUsers.members.length > 0 && renderUserTable(groupedUsers.members, 'Membres de la Communauté')}
          </div>
        ) : (
          <div className="space-y-3">
            {renderUserTable(paginatedUsers)}

            {/* Pagination compacte */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <span>Lignes :</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-0.5 text-xs rounded-md bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>
                    {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredAndSortedUsers.length)} sur {filteredAndSortedUsers.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="font-mono text-xs px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-md border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
