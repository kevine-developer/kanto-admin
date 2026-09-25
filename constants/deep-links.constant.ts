export interface DefaultDeepLinkOption {
  label: string;
  value: string;
  category: string;
  description: string;
}

export const DEFAULT_DEEP_LINK_OPTIONS: DefaultDeepLinkOption[] = [
  {
    label: "👑 Abonnement Kanto Pro",
    value: "/(screens)/subscription",
    category: "Monétisation",
    description: "Écran d'adhésion et présentation des fonctionnalités Pro",
  },
  {
    label: "⚔️ Duel Culturel en Direct (Multijoueur)",
    value: "/(screens)/gamesAllScreen/multiplayerGame",
    category: "Jeux",
    description: "Salle d'attente et duels en temps réel",
  },
  {
    label: "✍️ Proposer un Ajout / Contribution",
    value: "/(screens)/profile/contributions",
    category: "Communauté",
    description: "Espace de transmission communautaire",
  },
  {
    label: "📜 Raki-teny (Dictionnaire ancestral)",
    value: "/(screens)/rakiTenyScreen",
    category: "Culture",
    description: "Fiches de vocabulaire et étymologie",
  },
  {
    label: "🎮 Tous les Jeux & Quiz",
    value: "/(screens)/gamesAllScreen",
    category: "Jeux",
    description: "Hub de tous les jeux et devinettes",
  },
  {
    label: "📖 Catégories & Sagesse Littéraire",
    value: "/(screens)/categoriesAllScreen",
    category: "Culture",
    description: "Contes, proverbes, poésies et discours",
  },
  {
    label: "🏛️ Histoire, Présidents & Billets",
    value: "/(screens)/civiqueList",
    category: "Histoire",
    description: "Chronologie civique et patrimoine malgache",
  },
  {
    label: "🔖 Mes Favoris",
    value: "/(tabs)/favoris",
    category: "Profil",
    description: "Onglet des favoris sauvegardés",
  },
  {
    label: "💬 Donner un avis / Support",
    value: "/(screens)/profile/feedback",
    category: "Support",
    description: "Formulaire d'évaluation et feedback",
  },
];
