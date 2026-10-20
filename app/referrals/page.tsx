'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  adminReferralService,
  ReferralAdminOverview,
  AdminReferralItem,
  ReferralConfig,
} from '@/services/referral.service';
import {
  Gift,
  Users,
  MousePointerClick,
  CheckCircle2,
  Clock,
  Award,
  Search,
  Filter,
  RefreshCw,
  Sliders,
  AlertCircle,
  Save,
  Check,
  Percent,
} from 'lucide-react';

type Tab = 'list' | 'config';

export default function ReferralsAdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [overview, setOverview] = useState<ReferralAdminOverview | null>(null);
  const [referrals, setReferrals] = useState<AdminReferralItem[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  const [_isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Formulaire de configuration
  const [configForm, setConfigForm] = useState<Partial<ReferralConfig>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      const data = await adminReferralService.getOverview();
      setOverview(data);
      if (data.config) {
        setConfigForm(data.config);
      }
    } catch (err: unknown) {
      console.warn('Erreur chargement overview parrainage :', err);
    }
  }, []);

  const fetchList = useCallback(async (page = 1) => {
    try {
      const res = await adminReferralService.getList({
        page,
        limit: 15,
        status: statusFilter,
        search: searchQuery,
      });
      setReferrals(res.items);
      setPagination(res.pagination);
    } catch (err: unknown) {
      console.warn('Erreur chargement liste parrainages :', err);
    }
  }, [statusFilter, searchQuery]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchOverview(), fetchList(1)]);
    setIsLoading(false);
  }, [fetchOverview, fetchList]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchOverview(), fetchList(pagination.page)]);
    setIsRefreshing(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setFeedback(null);
    try {
      const updated = await adminReferralService.updateConfig(configForm);
      setConfigForm(updated);
      await fetchOverview();
      setFeedback({
        type: 'success',
        text: 'Configuration du programme de parrainage mise à jour avec succès.',
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la configuration.';
      setFeedback({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const metrics = overview?.metrics || {
    totalCodes: 0,
    totalClicks: 0,
    totalReferrals: 0,
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    conversionRate: 0,
    totalXpDistributed: 0,
    totalCoinsDistributed: 0,
  };

  return (
    <AdminShell>
      <PageHeader
        title="Programme de Parrainage & Filleuls"
        description="Supervision du parrainage, suivi de l'acquisition des nouveaux membres et pilotage des récompenses"
        icon={Gift}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{
                borderColor: 'var(--card-border)',
                background: 'var(--card)',
                color: 'var(--text)',
              }}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        }
      />

      {/* 1. Métriques Clés d'Acquisition */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {/* Total Codes */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Codes Actifs</span>
            <Gift size={14} className="text-amber-600" />
          </div>
          <div className="text-xl font-bold mt-2">{metrics.totalCodes}</div>
        </div>

        {/* Clics Partages */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Clics Liens</span>
            <MousePointerClick size={14} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold mt-2">{metrics.totalClicks}</div>
        </div>

        {/* Total Invitations */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Inscriptions Initiées</span>
            <Users size={14} className="text-indigo-500" />
          </div>
          <div className="text-xl font-bold mt-2">{metrics.totalReferrals}</div>
        </div>

        {/* Parrainages Validés */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Parrainages Validés</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold mt-2 text-emerald-600">
            {metrics.completedCount}
          </div>
        </div>

        {/* Taux de Conversion */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Conversion Clics</span>
            <Percent size={14} className="text-violet-500" />
          </div>
          <div className="text-xl font-bold mt-2">{metrics.conversionRate}%</div>
        </div>

        {/* Total XP & Vola Distribués */}
        <div
          className="p-4 rounded-xl border flex flex-col justify-between"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>XP Distribués</span>
            <Award size={14} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold mt-2 text-amber-600">
            +{metrics.totalXpDistributed}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div
        className="flex items-center gap-2 border-b mb-6"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users size={15} />
          Suivi des Filleuls ({pagination.total})
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'config'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders size={15} />
          Configuration & Récompenses
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-lg mb-4 text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check size={14} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={14} className="text-red-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* CONTENU ONGLETS */}
      {activeTab === 'list' ? (
        <div className="space-y-4">
          {/* Barre d'outils / Filtres */}
          <div
            className="p-3 rounded-xl border flex flex-col md:flex-row gap-3 items-center justify-between"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
          >
            {/* Barre de recherche */}
            <div className="relative w-full md:w-80">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Rechercher par code, parrain, filleul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchList(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                style={{ borderColor: 'var(--card-border)' }}
              />
            </div>

            {/* Sélecteur de statut */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter size={13} className="text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-lg border px-2.5 py-1.5 bg-background text-foreground focus:outline-none"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">En attente (PENDING)</option>
                <option value="COMPLETED">Validés (COMPLETED)</option>
                <option value="REJECTED">Refusés (REJECTED)</option>
                <option value="EXPIRED">Expirés (EXPIRED)</option>
              </select>
            </div>
          </div>

          {/* Tableau des Parrainages */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="border-b uppercase text-[10px] tracking-wider text-muted-foreground"
                  style={{
                    background: 'var(--background-subtle, rgba(0,0,0,0.02))',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Parrain</th>
                    <th className="py-3 px-4">Filleul</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Récompense Parrain</th>
                    <th className="py-3 px-4">Récompense Filleul</th>
                    <th className="py-3 px-4">Date Inscription</th>
                    <th className="py-3 px-4">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                  {referrals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        Aucun parrainage correspondant aux critères.
                      </td>
                    </tr>
                  ) : (
                    referrals.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-amber-600">
                          {r.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">
                            {r.referrer?.name || 'Inconnu'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {r.referrer?.email || ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">
                            {r.referee?.name || 'Inconnu'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {r.referee?.email || ''}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              r.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {r.status === 'COMPLETED' && <CheckCircle2 size={10} />}
                            {r.status === 'PENDING' && <Clock size={10} />}
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {r.referrerXpAwarded > 0 ? (
                            <span className="font-semibold text-amber-600">
                              +{r.referrerXpAwarded} XP (+{r.referrerCoinsAwarded} Vola)
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {r.refereeXpAwarded > 0 ? (
                            <span className="font-semibold text-emerald-600">
                              +{r.refereeXpAwarded} XP (+{r.refereeCoinsAwarded} Vola)
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {r.completedAt
                            ? new Date(r.completedAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div
                className="flex items-center justify-between p-3 border-t text-xs text-muted-foreground"
                style={{ borderColor: 'var(--card-border)' }}
              >
                <div>
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} parrainages)
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => fetchList(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-2.5 py-1 rounded border disabled:opacity-50"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => fetchList(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-2.5 py-1 rounded border disabled:opacity-50"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ONGLET CONFIGURATION DU PROGRAMME */
        <form
          onSubmit={handleSaveConfig}
          className="max-w-3xl rounded-xl border p-6 space-y-6"
          style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        >
          <div>
            <h3 className="text-base font-bold">Règles et Récompenses du Parrainage</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Modifiez les seuils de gains d&apos;XP, les pièces Vola et les limites anti-fraude sans redémarrage serveur.
            </p>
          </div>

          {/* Toggle Actif / Suspendu */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border bg-background">
            <div>
              <div className="text-xs font-semibold">Statut du Programme</div>
              <div className="text-[11px] text-muted-foreground">
                Active ou suspend temporairement la création et la réclamation de nouveaux parrainages.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configForm.isEnabled ?? true}
                onChange={(e) =>
                  setConfigForm((prev) => ({ ...prev, isEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Récompense Parrain : XP */}
            <div>
              <label className="block text-xs font-medium mb-1">
                XP attribués au Parrain
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                value={configForm.referrerXp ?? 250}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    referrerXp: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                style={{ borderColor: 'var(--card-border)' }}
                required
              />
            </div>

            {/* Récompense Parrain : Vola */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Vola (pièces) attribuées au Parrain
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                value={configForm.referrerCoins ?? 50}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    referrerCoins: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                style={{ borderColor: 'var(--card-border)' }}
                required
              />
            </div>

            {/* Récompense Filleul : XP */}
            <div>
              <label className="block text-xs font-medium mb-1">
                XP de Bienvenue offerts au Filleul
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                value={configForm.refereeXp ?? 100}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    refereeXp: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                style={{ borderColor: 'var(--card-border)' }}
                required
              />
            </div>

            {/* Récompense Filleul : Vola */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Vola (pièces) de Bienvenue offertes au Filleul
              </label>
              <input
                type="number"
                min="0"
                max="5000"
                value={configForm.refereeCoins ?? 20}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    refereeCoins: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                style={{ borderColor: 'var(--card-border)' }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Plafond Max par Parrain */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Plafond max de parrainages récompensés par utilisateur
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={configForm.maxRewardsPerReferrer ?? 20}
                onChange={(e) =>
                  setConfigForm((prev) => ({
                    ...prev,
                    maxRewardsPerReferrer: Number(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 text-xs rounded-lg border bg-background"
                style={{ borderColor: 'var(--card-border)' }}
                required
              />
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Protection anti-spam : au-delà de ce nombre, les filleuls sont enregistrés sans distribuer d&apos;XP supplémentaire au parrain.
              </span>
            </div>

            {/* Condition d'activation */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Condition de validation
              </label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="requireFirstActivity"
                  checked={configForm.requireFirstActivity ?? true}
                  onChange={(e) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      requireFirstActivity: e.target.checked,
                    }))
                  }
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="requireFirstActivity" className="text-xs">
                  Exiger la 1ère activité (lecture, quiz) avant validation
                </label>
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="pt-4 border-t flex justify-end" style={{ borderColor: 'var(--card-border)' }}>
            <button
              type="submit"
              disabled={isSavingConfig}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {isSavingConfig ? 'Enregistrement...' : 'Enregistrer les Modifications'}
            </button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
