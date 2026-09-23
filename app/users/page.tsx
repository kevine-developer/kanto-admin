'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  KeyRound,
  Users as UsersIcon,
  UserCheck,
  ArrowUpDown,
  Filter,
  Layers,
  List,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await systemService.getUsers();
      setUsers(data || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Réinitialiser la page si les filtres changent
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

    // 1. Filtre par recherche textuelle (Nom ou Email)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.id?.toLowerCase().includes(q)
      );
    }

    // 2. Filtre par Rôle
    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // 3. Tri
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

  // Pagination découpée
  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedUsers, currentPage, pageSize]);

  // Données groupées par rôle si vue 'grouped'
  const groupedUsers = useMemo(() => {
    const admins = filteredAndSortedUsers.filter((u) => u.role === 'ADMIN');
    const members = filteredAndSortedUsers.filter((u) => u.role !== 'ADMIN');
    return { admins, members };
  }, [filteredAndSortedUsers]);

  // Formatage de date
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
    if (
      !confirm(
        `Envoyer un email de réinitialisation de mot de passe à ${user.name || user.email} (${user.email}) ?`
      )
    ) {
      return;
    }

    try {
      setResettingId(user.id);
      setFeedback(null);
      const res = await systemService.resetUserPassword(user.id);
      setFeedback({
        type: 'success',
        text: res.message || `Lien de réinitialisation envoyé à ${user.email}.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'envoi de l'email de réinitialisation";
      setFeedback({ type: 'error', text: msg });
    } finally {
      setResettingId(null);
    }
  };

  const handleToggleRole = async (user: UserAccount) => {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionLabel =
      nextRole === 'ADMIN'
        ? 'promouvoir en Administrateur'
        : 'rétrograder en Utilisateur simple';

    if (
      !confirm(
        `Voulez-vous vraiment ${actionLabel} le compte de ${user.name} (${user.email}) ?`
      )
    ) {
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
      const msg =
        err instanceof Error ? err.message : 'Erreur lors du changement de rôle';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setUpdatingId(null);
    }
  };

  // Rendu d'une table d'utilisateurs
  const renderUserTable = (items: UserAccount[], titleBadge?: string) => (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {titleBadge && (
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {titleBadge}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {items.length} {items.length > 1 ? 'comptes' : 'compte'}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-muted-foreground font-mono text-[10.5px] uppercase tracking-wider">
              <th className="py-2.5 px-4 font-medium">Utilisateur</th>
              <th className="py-2.5 px-4 font-medium">Email</th>
              <th className="py-2.5 px-4 font-medium">Rôle / Privilège</th>
              <th className="py-2.5 px-4 font-medium">Date d&apos;inscription</th>
              <th className="py-2.5 px-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((user) => {
              const isAdmin = user.role === 'ADMIN';
              const isUpdating = updatingId === user.id;
              const isResetting = resettingId === user.id;

              return (
                <tr
                  key={user.id}
                  className="hover:bg-muted/40 transition-colors group"
                >
                  {/* Avatar + Nom */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                          isAdmin
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-primary/10 border-primary/20 text-primary'
                        }`}
                      >
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {user.name || 'Sans nom'}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">
                          ID: {user.id.slice(0, 10)}...
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-muted-foreground/70 shrink-0" />
                      <span className="truncate max-w-[200px]">{user.email}</span>
                    </div>
                  </td>

                  {/* Privilège */}
                  <td className="py-2.5 px-4">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                        <ShieldCheck size={12} />
                        <span>ADMINISTRATEUR</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                        <User size={12} />
                        <span>MEMBRE</span>
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-muted-foreground/70 shrink-0" />
                      <span>{formatDate(user.createdAt)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Réinitialiser mot de passe */}
                      <button
                        onClick={() => handleResetPassword(user)}
                        disabled={isResetting}
                        title="Envoyer un email de réinitialisation de mot de passe"
                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isResetting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <KeyRound size={13} />
                        )}
                      </button>

                      {/* Changer rôle */}
                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={isUpdating}
                        title={isAdmin ? 'Rétrograder en Membre' : 'Promouvoir en Administrateur'}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer ${
                          isAdmin
                            ? 'border-border text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2 size={12} className="animate-spin" />
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
      <div className="w-full space-y-5 pb-10">
        {/* En-tête de page */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" />
              <span>Gestion des Utilisateurs & Privilèges</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supervision des comptes membres, rôles d&apos;administration et sécurité.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadUsers()}
              disabled={isLoading}
              title="Rafraîchir la liste"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl flex items-center justify-between text-xs font-medium animate-in fade-in duration-150 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Cartes KPI / Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Total Inscrits</span>
              <UsersIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Comptes enregistrés</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Administrateurs</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.admins}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Accès backoffice total</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Membres</span>
              <UserCheck className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.members}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Utilisateurs standards</div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Récents (30j)</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.recent}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Nouvelles adhésions</div>
          </div>
        </div>

        {/* Barre d'outils professionnelle (Filtres, Recherche, Tri, Groupement) */}
        <div className="p-3 rounded-xl border border-border bg-card shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Recherche textuelle */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email ou ID..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sélecteur de Tri & Mode d'Affichage */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sélecteur de Tri */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpDown size={13} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="date_desc">Inscription : Plus récent</option>
                  <option value="date_asc">Inscription : Plus ancien</option>
                  <option value="name_asc">Nom : A → Z</option>
                  <option value="name_desc">Nom : Z → A</option>
                  <option value="email_asc">Email : A → Z</option>
                  <option value="role_first">Admins en premier</option>
                </select>
              </div>

              {/* Bascule de Vue (Liste continue vs Groupée par Rôle) */}
              <div className="flex items-center rounded-lg border border-border p-0.5 bg-background">
                <button
                  onClick={() => setViewMode('flat')}
                  title="Vue liste standard"
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    viewMode === 'flat'
                      ? 'bg-muted text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <List size={13} />
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  title="Vue groupée par Rôle (Admins / Membres)"
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    viewMode === 'grouped'
                      ? 'bg-muted text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Onglets Facettes de Rôle */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
            <span className="text-[11px] font-mono text-muted-foreground mr-1 flex items-center gap-1">
              <Filter size={11} /> Filtrer :
            </span>

            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                roleFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Tous ({stats.total})
            </button>

            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'ADMIN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <ShieldCheck size={12} />
              <span>Administrateurs ({stats.admins})</span>
            </button>

            <button
              onClick={() => setRoleFilter('USER')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'USER'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <User size={12} />
              <span>Membres ({stats.members})</span>
            </button>
          </div>
        </div>

        {/* Contenu principal : Tableaux */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
            <Loader2 size={18} className="animate-spin text-primary" />
            <span>Chargement des utilisateurs en cours...</span>
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-border bg-card/50 p-6 space-y-2">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <UsersIcon size={20} />
            </div>
            <div className="text-sm font-semibold text-foreground">Aucun utilisateur trouvé</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Aucun compte ne correspond à vos filtres actuels. Modifiez votre recherche ou réinitialisez les filtres.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('ALL');
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Réinitialiser les filtres</span>
            </button>
          </div>
        ) : viewMode === 'grouped' ? (
          /* Mode Groupé par Rôle */
          <div className="space-y-5">
            {groupedUsers.admins.length > 0 &&
              renderUserTable(groupedUsers.admins, 'Administrateurs du Système')}
            {groupedUsers.members.length > 0 &&
              renderUserTable(groupedUsers.members, 'Membres de la Communauté')}
          </div>
        ) : (
          /* Mode Liste Standard avec Pagination */
          <div className="space-y-3">
            {renderUserTable(paginatedUsers)}

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Lignes par page :</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 text-xs rounded-md bg-card border border-border text-foreground cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="font-mono text-[11px]">
                  {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredAndSortedUsers.length)} sur{' '}
                  {filteredAndSortedUsers.length}
                </span>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                  title="Page précédente"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2.5 font-mono text-xs">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground disabled:opacity-40 transition-colors cursor-pointer"
                  title="Page suivante"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
