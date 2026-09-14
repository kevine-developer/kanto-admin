import { fetchApi } from '@/lib/api-client';
import {
  ProgressionStats,
  LeaderboardData,
  CulturalRank,
} from '@/types/progression';

/**
 * Rangs culturels malagasy du conservatoire Kanto
 */
export const CULTURAL_RANKS: CulturalRank[] = [
  {
    level: 1,
    minXp: 0,
    titleMg: 'Mpianatra',
    titleFr: "L'Apprenti",
    color: '#10B981',
    descriptionMg: "Dingana voalohany amin'ny fahitana ny fahendrena sy ny tantara malagasy.",
    descriptionFr: 'Premiers pas dans la découverte des contes, proverbes et traditions.',
  },
  {
    level: 2,
    minXp: 50,
    titleMg: 'Mpitady',
    titleFr: 'Le Chercheur',
    color: '#CD7F32',
    descriptionMg: 'Mikaroka sy manadihady ny harena ara-kolontsaina.',
    descriptionFr: "Curieux et avide d'explorer les récits et valeurs traditionnelles.",
  },
  {
    level: 3,
    minXp: 150,
    titleMg: 'Mpanazava',
    titleFr: "L'Éclaireur",
    color: '#94A3B8',
    descriptionMg: "Manazava sy mizara ny fahazavan'ny ohabolana sy ny kabary.",
    descriptionFr: 'Partage la lumière des récits et expressions du patrimoine.',
  },
  {
    level: 4,
    minXp: 300,
    titleMg: 'Mpanan-tsaina',
    titleFr: "L'Érudit",
    color: '#F59E0B',
    descriptionMg: 'Fahalalana matotra momba ny ankamantatra sy ny vakoka.',
    descriptionFr: 'Connaissance affirmée des métaphores, énigmes et récits historiques.',
  },
  {
    level: 5,
    minXp: 500,
    titleMg: 'Mpikabary',
    titleFr: "L'Orateur Traditionnel",
    color: '#EC4899',
    descriptionMg: 'Fahaizana mandaha-teny sy mahafehy ny teny mirindra.',
    descriptionFr: "Maîtrise de l'art oratoire et des discours traditionnels solennels.",
  },
  {
    level: 6,
    minXp: 800,
    titleMg: 'Mpiaro ny Kolontsaina',
    titleFr: 'Le Gardien du Patrimoine',
    color: '#3B82F6',
    descriptionMg: 'Mpiaro sy mpanandratra ny soatoavina sy ny fomba amam-panao.',
    descriptionFr: "Protecteur actif de la mémoire, des arts et de l'identité malgache.",
  },
  {
    level: 7,
    minXp: 1200,
    titleMg: 'Olon-kendry',
    titleFr: 'Le Sage',
    color: '#059669',
    descriptionMg: 'Hajaina sy anontaniana torohevitra noho ny fahiratan-tsaina.',
    descriptionFr: 'Respecté et consulté pour son discernement et sa vaste sagesse.',
  },
  {
    level: 8,
    minXp: 1700,
    titleMg: 'Ray aman-dreny',
    titleFr: "L'Ancien & Guide",
    color: '#8B5CF6',
    descriptionMg: "Andry sy fitaratra amin'ny fampitana ny soa ho an'ny taranaka.",
    descriptionFr: 'Pilier de bienveillance et de transmission pour les générations futures.',
  },
  {
    level: 9,
    minXp: 2300,
    titleMg: 'Mpanolo-tsaina',
    titleFr: 'Le Conseiller Royal',
    color: '#06B6D4',
    descriptionMg: 'Mpanolo-tsaina ambony eo amin\'ny fiarahamonina sy ny fomba.',
    descriptionFr: 'Haut dignitaire et guide des règles ancestrales et des fomba.',
  },
  {
    level: 10,
    minXp: 3000,
    titleMg: 'Mpitàna ny Hasina',
    titleFr: 'Maître des Valeurs Ancestrales',
    color: '#EAB308',
    descriptionMg: "Tonga amin'ny fara tampon'ny fahalalana sy ny hasin'ny kolontsaina.",
    descriptionFr: 'Sommet suprême de la sagesse et légende vivante de Kanto.',
  },
];

export const progressionService = {
  /**
   * Récupère les statistiques globales de progression et de distribution des niveaux.
   * Propage les erreurs réseau/serveur pour permettre à l'UI d'afficher l'état d'erreur réel.
   * @throws {Error} En cas d'échec de la requête API ou de réponse invalide
   * @returns Statistiques agrégées de progression
   */
  async getAdminStats(): Promise<ProgressionStats> {
    const stats = await fetchApi<ProgressionStats>('/progress/admin/stats');
    if (!stats || typeof stats !== 'object' || typeof stats.totalPlayers !== 'number') {
      throw new Error('Statistiques de progression invalides reçues du serveur');
    }
    return stats;
  },

  /**
   * Récupère le classement des joueurs (avec filtre optionnel par niveau).
   * Propage les erreurs pour différencier une panne d'un classement vide.
   * @param level - Niveau optionnel pour filtrer les joueurs (1 à 10)
   * @param limit - Nombre maximum d'entrées à récupérer (défaut : 100)
   * @throws {Error} En cas de panne de l'API
   * @returns Données du classement incluant les entrées et le total de joueurs
   */
  async getLeaderboard(
    level?: number,
    limit: number = 100
  ): Promise<LeaderboardData> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (level !== undefined && level !== null && level > 0) {
      params.set('level', String(level));
    }
    const data = await fetchApi<LeaderboardData>(`/leaderboard?${params.toString()}`);
    if (!data || !Array.isArray(data.entries)) {
      throw new Error('Réponse invalide du serveur pour le classement');
    }
    return data;
  },

  /**
   * Ajuste manuellement l'expérience (XP) d'un joueur par un administrateur.
   * @param userId - Identifiant unique de l'utilisateur
   * @param xpDelta - Quantité de points d'XP à ajouter (positif) ou déduire (négatif)
   * @param reason - Motif facultatif consigné dans le journal d'administration
   * @throws {Error} En cas d'échec de la modification
   * @returns Résultat de l'ajustement
   */
  async adjustUserXp(
    userId: string,
    xpDelta: number,
    reason?: string
  ): Promise<unknown> {
    return fetchApi(`/progress/admin/users/${userId}/adjust-xp`, {
      method: 'PATCH',
      body: JSON.stringify({ xpDelta, reason }),
    });
  },

  /**
   * Retourne la liste complète ordonnée des 10 Rangs Culturels Malagasy.
   * @returns Tableau immuable des rangs culturels
   */
  getRanks(): CulturalRank[] {
    return CULTURAL_RANKS;
  },

  /**
   * Détermine le rang culturel associé à un niveau d'expérience donné (1 à 10).
   * @param level - Niveau du joueur (1-10)
   * @returns L'objet CulturalRank correspondant au niveau
   */
  getRankForLevel(level: number): CulturalRank {
    const safeLevel = Math.min(10, Math.max(1, level));
    return CULTURAL_RANKS[safeLevel - 1] || CULTURAL_RANKS[0];
  },
};
