import { fetchApi } from '@/lib/api-client';
import {
  ContributionItem,
  ContributionStats,
  ContentReport,
} from '@/types/contribution';

export const contributionsService = {
  /**
   * Récupérer les contributions en attente de modération
   */
  async getPending(): Promise<ContributionItem[]> {
    try {
      const res = await fetchApi<ContributionItem[] | { data: ContributionItem[] }>(
        '/contributions/pending'
      );
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as { data: ContributionItem[] }).data)) {
        return (res as { data: ContributionItem[] }).data;
      }
      return [];
    } catch (err) {
      console.error('Erreur getPending contributions:', err);
      return [];
    }
  },

  /**
   * Récupérer les statistiques de modération (dont objectif hebdomadaire de 10)
   */
  async getStats(): Promise<ContributionStats> {
    try {
      return await fetchApi<ContributionStats>('/contributions/admin/stats');
    } catch (err) {
      console.error('Erreur getStats contributions:', err);
      return {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        totalReportsPending: 0,
        approvedThisWeek: 0,
        weeklyTarget: 10,
      };
    }
  },

  /**
   * Récupérer les signalements de contenu soumis par les utilisateurs
   */
  async getReports(): Promise<ContentReport[]> {
    try {
      const res = await fetchApi<ContentReport[] | { data: ContentReport[] }>(
        '/contributions/admin/reports'
      );
      if (Array.isArray(res)) return res;
      if (res && Array.isArray((res as { data: ContentReport[] }).data)) {
        return (res as { data: ContentReport[] }).data;
      }
      return [];
    } catch (err) {
      console.error('Erreur getReports contributions:', err);
      return [];
    }
  },

  /**
   * Valider ou rejeter une contribution
   */
  async validate(id: string, approve: boolean): Promise<ContributionItem> {
    return fetchApi<ContributionItem>(`/contributions/${id}/validate`, {
      method: 'PATCH',
      body: JSON.stringify({ approve }),
    });
  },

  /**
   * Marquer un signalement comme résolu
   */
  async resolveReport(id: string): Promise<ContentReport> {
    return fetchApi<ContentReport>(`/contributions/admin/reports/${id}/resolve`, {
      method: 'PATCH',
    });
  },

  /**
   * Supprimer définitivement une contribution
   */
  async deleteContribution(id: string): Promise<void> {
    await fetchApi(`/contributions/${id}`, {
      method: 'DELETE',
    });
  },
};
