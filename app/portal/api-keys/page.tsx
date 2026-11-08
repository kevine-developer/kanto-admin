'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import {
  partnerPortalService,
  PartnerApiKeyItem,
  CreateApiKeyResult,
  PartnerApiLogItem,
} from '@/services/portal.service';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Trash2,
  BookOpen,
  ExternalLink,
  Code2,
  RefreshCw,
  Loader2,
  Eye,
  Terminal,
} from 'lucide-react';

const AVAILABLE_SCOPES = [
  { id: 'events:read', label: 'Consultation événements', desc: 'Lecture de vos événements et métadonnées' },
  { id: 'events:write', label: 'Création & modification', desc: 'Création et mise à jour d’événements' },
  { id: 'events:delete', label: 'Annulation événements', desc: 'Annulation d’événements avec motif' },
  { id: 'registrations:read', label: 'Liste des inscrits (RGPD)', desc: 'Accès aux participants anonymisés' },
  { id: 'media:upload', label: 'Téléversement médias', desc: 'Upload sécurisé d’affiches et bannières' },
  { id: 'marketing:read', label: 'Catalogue marketing', desc: 'Consultation des offres et devis' },
  { id: 'marketing:write', label: 'Demandes marketing', desc: 'Dépôt de demandes de sponsoring' },
];

export default function PartnerApiKeysPage() {
  const { toast } = useToast();

  const [keys, setKeys] = useState<PartnerApiKeyItem[]>([]);
  const [logs, setLogs] = useState<PartnerApiLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  // Modal création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('LIVE');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'events:read',
    'events:write',
    'registrations:read',
  ]);
  const [isCreating, setIsCreating] = useState(false);

  // Modal résultat clé secrète
  const [secretResult, setSecretResult] = useState<CreateApiKeyResult | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await partnerPortalService.listApiKeys();
      setKeys(data || []);
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de récupérer vos clés API.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchLogs = useCallback(async () => {
    setIsLogsLoading(true);
    try {
      const data = await partnerPortalService.getApiLogs(50);
      setLogs(data || []);
    } catch {
      // Ignorer si les logs sont vides
    } finally {
      setIsLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchLogs();
  }, [fetchKeys, fetchLogs]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) {
      toast.warning('Veuillez donner un nom à votre clé API.');
      return;
    }
    if (selectedScopes.length === 0) {
      toast.warning('Veuillez sélectionner au moins un scope d’autorisation.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await partnerPortalService.createApiKey({
        name: keyName.trim(),
        environment,
        scopes: selectedScopes,
      });

      setSecretResult(res);
      setIsCreateModalOpen(false);
      setKeyName('');
      setSelectedScopes(['events:read', 'events:write', 'registrations:read']);
      fetchKeys();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la génération de la clé API.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string, name: string) => {
    if (!confirm(`Êtes-vous certain de vouloir révoquer la clé API « ${name} » ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await partnerPortalService.revokeApiKey(keyId);
      toast.success(`La clé « ${name} » a été révoquée immédiatement.`);
      fetchKeys();
    } catch (err: any) {
      toast.error(err?.message || 'Impossible de révoquer la clé.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    toast.success('Clé copiée dans le presse-papiers.');
    setTimeout(() => setHasCopied(false), 2500);
  };

  const toggleScope = (id: string) => {
    setSelectedScopes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-amber-400" />
            Clés API & Intégrations Développeur
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Générez et révoquez vos clés d’accès sécurisées pour synchroniser vos événements ou
            intégrer Kanto MG dans votre propre site web.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000/api/partners/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Documentation Interactive (OpenAPI)
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            Générer une clé API
          </button>
        </div>
      </div>

      {/* Guide rapide d'authentification */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Exemple d'appel d'authentification cURL :
        </div>
        <div className="bg-zinc-950 p-3.5 rounded-xl font-mono text-xs text-zinc-300 overflow-x-auto border border-zinc-800/80">
          curl -X GET "https://partners-api.gastsar.fr/v1/events" \<br />
          &nbsp;&nbsp;-H <span className="text-emerald-400">"X-API-Key: kanto_live_votre_cle_secrete"</span> \<br />
          &nbsp;&nbsp;-H "Content-Type: application/json"
        </div>
      </div>

      {/* Liste des clés API */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">Mes Clés API Enregistrées</h3>
          <button
            onClick={fetchKeys}
            disabled={isLoading}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
            <p className="text-xs">Chargement de vos clés d'API...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <KeyRound className="w-10 h-10 mx-auto text-zinc-600 stroke-1" />
            <p className="text-sm font-semibold text-zinc-300">Aucune clé API active</p>
            <p className="text-xs max-w-sm mx-auto">
              Cliquez sur « Générer une clé API » ci-dessus pour connecter vos systèmes tiers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-800/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5">Nom de la clé</th>
                  <th className="px-4 py-3.5">Préfixe de clé</th>
                  <th className="px-4 py-3.5">Environnement</th>
                  <th className="px-4 py-3.5">Scopes</th>
                  <th className="px-4 py-3.5">Dernier usage</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-zinc-800/25 transition">
                    <td className="px-6 py-4 font-semibold text-zinc-100">{k.name}</td>
                    <td className="px-4 py-4 font-mono text-xs text-zinc-300">
                      {k.keyPrefix}••••••••
                    </td>
                    <td className="px-4 py-4">
                      {k.environment === 'LIVE' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          LIVE
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-700 text-zinc-300 border border-zinc-600">
                          TEST
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/60"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-400">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('fr-FR') : 'Jamais'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {k.revokedAt ? (
                        <span className="text-xs text-rose-400 italic">Révoquée</span>
                      ) : (
                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="px-2.5 py-1 text-xs text-rose-400 hover:text-white hover:bg-rose-600/30 rounded border border-rose-500/30 transition flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Révoquer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Journal des appels récents */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">Historique Récent des Requêtes API</h3>
          <button
            onClick={fetchLogs}
            disabled={isLogsLoading}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLogsLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {isLogsLoading ? (
          <div className="py-12 flex justify-center text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500">
            Aucun appel API journalisé pour le moment.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-800/40 text-[11px] font-semibold text-zinc-500 uppercase sticky top-0">
                <tr>
                  <th className="px-6 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Méthode</th>
                  <th className="px-4 py-2.5">Endpoint</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-6 py-2.5 text-right">Temps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/20">
                    <td className="px-6 py-2.5 text-zinc-400">
                      {new Date(log.createdAt).toLocaleTimeString('fr-FR')}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-zinc-200">{log.method}</td>
                    <td className="px-4 py-2.5 text-zinc-300">{log.endpoint}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-bold ${
                          log.statusCode < 300
                            ? 'text-emerald-400'
                            : log.statusCode < 400
                            ? 'text-blue-400'
                            : 'text-red-400'
                        }`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-6 py-2.5 text-right text-zinc-400">
                      {log.responseTimeMs ? `${log.responseTimeMs} ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Création Clé */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                Générer une nouvelle clé API
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Définissez le nom, l'environnement et les permissions restreintes accordées à cette
                clé.
              </p>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Nom d'usage de la clé *
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Ex: API Billetterie WordPress"
                  className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Environnement
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEnvironment('LIVE')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      environment === 'LIVE'
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    LIVE (Production)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvironment('TEST')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      environment === 'TEST'
                        ? 'bg-zinc-700 text-zinc-100 border-zinc-500'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    TEST (Bac à sable)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Scopes d'autorisation (Permissions)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_SCOPES.map((scope) => {
                    const isChecked = selectedScopes.includes(scope.id);
                    return (
                      <div
                        key={scope.id}
                        onClick={() => toggleScope(scope.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-200'
                            : 'bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-0.5 accent-emerald-500"
                        />
                        <div>
                          <div className="font-semibold text-zinc-200">{scope.label}</div>
                          <div className="text-[11px] text-zinc-500">{scope.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Générer la clé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Clé Secrète Unique */}
      {secretResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Conservez votre clé secrète en lieu sûr !
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {secretResult.warning}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">
                Votre clé API secrète :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={secretResult.secretKey}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(secretResult.secretKey)}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  {hasCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {hasCopied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSecretResult(null)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition"
              >
                J'ai copié et sécurisé ma clé API
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

