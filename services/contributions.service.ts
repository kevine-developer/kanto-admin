import { fetchApi } from '@/lib/api-client';
import {
  ContributionItem,
  ContributionStats,
  ContentReport,
} from '@/types/contribution';

/**
 * Valide qu'un objet est une contribution conforme.
 * @param item - Donnée brute reçue de l'API
 * @returns true si l'objet contient les champs essentiels d'une contribution
 */
function isValidContribution(item: unknown): item is ContributionItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as Record<string, unknown>).id === 'string' &&
    typeof (item as Record<string, unknown>).category === 'string'
  );
}

/**
 * Valide qu'un objet est un signalement conforme.
 * @param report - Donnée brute reçue de l'API
 * @returns true si l'objet contient les champs essentiels d'un signalement
 */
function isValidReport(report: unknown): report is ContentReport {
  return (
    typeof report === 'object' &&
    report !== null &&
    typeof (report as Record<string, unknown>).id === 'string'
  );
}

export const contributionsService = {
  /**
   * Récupère les contributions en attente de modération depuis le serveur.
   * Valide la structure des données retournées et propage les erreurs réseau/API.
   * @param filters - Filtres optionnels (statut, catégorie, alerte modération, recherche)
   * @throws {Error} En cas d'échec de la requête HTTP ou de données invalides
   * @returns Liste des contributions valides en attente
   */
  async getPending(filters?: {
    status?: string;
    category?: string;
    flagged?: boolean;
    search?: string;
  }): Promise<ContributionItem[]> {
    const query = new URLSearchParams();
    if (filters?.status && filters.status !== 'ALL') query.set('status', filters.status);
    if (filters?.category && filters.category !== 'ALL') query.set('category', filters.category);
    if (filters?.flagged !== undefined) query.set('flagged', String(filters.flagged));
    if (filters?.search) query.set('search', filters.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchApi<ContributionItem[] | { data: ContributionItem[] }>(
      `/contributions/pending${queryString}`
    );
    const list = Array.isArray(res)
      ? res
      : res && Array.isArray((res as { data: ContributionItem[] }).data)
      ? (res as { data: ContributionItem[] }).data
      : null;

    if (!list) {
      throw new Error('Réponse invalide du serveur pour les contributions en attente');
    }

    return list.filter(isValidContribution);
  },

  /**
   * Récupère l'historique d'audit des décisions pour une contribution.
   */
  async getAuditLogs(id: string): Promise<any[]> {
    return fetchApi<any[]>(`/contributions/${id}/audit-logs`);
  },

  /**
   * Récupère les statistiques globales de modération.
   * Valide la cohérence de l'objet de statistiques et propage les erreurs.
   * @throws {Error} En cas de panne de l'API ou de structure invalide
   * @returns Statistiques complètes de modération
   */
  async getStats(): Promise<ContributionStats> {
    const stats = await fetchApi<ContributionStats>('/contributions/admin/stats');
    if (!stats || typeof stats !== 'object' || typeof stats.weeklyTarget !== 'number') {
      throw new Error('Statistiques de modération invalides reçues du serveur');
    }
    return stats;
  },

  /**
   * Récupère la liste des signalements de contenu soumis par les utilisateurs.
   * Valide chaque signalement et propage les erreurs de chargement.
   * @throws {Error} En cas d'erreur réseau ou HTTP
   * @returns Liste des signalements valides non résolus
   */
  async getReports(): Promise<ContentReport[]> {
    const res = await fetchApi<ContentReport[] | { data: ContentReport[] }>(
      `/contributions/admin/reports`
    );
    const list = Array.isArray(res)
      ? res
      : res && Array.isArray((res as { data: ContentReport[] }).data)
      ? (res as { data: ContentReport[] }).data
      : null;

    if (!list) {
      throw new Error('Réponse invalide du serveur pour les signalements');
    }

    return list.filter(isValidReport);
  },

  /**
   * Valide, rejette ou demande des modifications pour une contribution en attente.
   * @param id - Identifiant unique de la contribution
   * @param approve - true pour approuver et publier, false pour rejeter/demander modifs
   * @param reason - Motif de rejet ou consignes de modification
   * @param requestChanges - true si des modifications sont demandées au contributeur
   * @throws {Error} En cas d'échec de la mise à jour sur le serveur
   * @returns La contribution mise à jour avec son nouveau statut
   */
  async validate(
    id: string,
    approve: boolean,
    reason?: string,
    requestChanges?: boolean
  ): Promise<ContributionItem> {
    return fetchApi<ContributionItem>(`/contributions/${id}/validate`, {
      method: 'PATCH',
      body: JSON.stringify({
        approve,
        reason,
        feedback: reason,
        requestChanges: !!requestChanges,
      }),
    });
  },

  /**
   * Marque un signalement de contenu comme résolu par l'administrateur.
   * @param id - Identifiant du signalement à clôturer
   * @throws {Error} En cas d'échec de la requête
   * @returns Le signalement mis à jour
   */
  async resolveReport(id: string): Promise<ContentReport> {
    return fetchApi<ContentReport>(`/contributions/admin/reports/${id}/resolve`, {
      method: 'PATCH',
    });
  },

  /**
   * Confirme qu'une contribution est un doublon, enclenchant le compte à rebours de 24h et la notification à l'auteur.
   * @param id - Identifiant de la contribution
   * @throws {Error} En cas d'erreur de requête
   */
  async confirmDuplicate(id: string): Promise<ContributionItem> {
    return fetchApi<ContributionItem>(`/contributions/${id}/confirm-duplicate`, {
      method: 'PATCH',
    });
  },

  /**
   * Résout une réclamation / contestation formulée par l'auteur d'une contribution signalée comme doublon.
   * @param id - Identifiant de la contribution
   * @param approve - true pour accepter la réclamation et restaurer, false pour rejeter et maintenir la suppression sous 24h
   * @param note - Motif / justification de la décision
   */
  async resolveDispute(id: string, approve: boolean, note?: string): Promise<ContributionItem> {
    return fetchApi<ContributionItem>(`/contributions/${id}/resolve-dispute`, {
      method: 'PATCH',
      body: JSON.stringify({ approve, note }),
    });
  },

  /**
   * Déclenche manuellement la purge des doublons expirés (au-delà de 24h sans contestation pendante).
   */
  async purgeExpiredDuplicates(): Promise<{ count: number }> {
    return fetchApi<{ count: number }>(`/contributions/admin/purge-duplicates`, {
      method: 'POST',
    });
  },

  /**
   * Supprime définitivement une contribution du système.
   * @param id - Identifiant de la contribution à supprimer
   * @throws {Error} En cas d'échec de la suppression
   * @returns Promesse résolue après suppression
   */
  async deleteContribution(id: string): Promise<void> {
    await fetchApi(`/contributions/${id}`, {
      method: 'DELETE',
    });
  },
};
