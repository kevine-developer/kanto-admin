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
    label: "▶️ Reprendre la Dernière Partie (Continuer)",
    value: "kantomg://game/resume",
    category: "Jeux",
    description: "Reprendre directement le niveau et la session en cours",
  },
  {
    label: "⚡ Vrai ou Faux (Marina sa Diso)",
    value: "/(screens)/gamesAllScreen/trueFalseGame",
    category: "Jeux",
    description: "Jeu de rapidité et de culture générale",
  },
  {
    label: "🧩 Devinettes & Énigmes (Ankamantatra)",
    value: "/(screens)/gamesAllScreen/riddleGame",
    category: "Jeux",
    description: "Sagesse et résolution d'énigmes malgaches",
  },
  {
    label: "🔤 Mots Manquants (Teny Banga)",
    value: "/(screens)/gamesAllScreen/missingWord",
    category: "Jeux",
    description: "Compléter les proverbes et maximes",
  },
  {
    label: "🏆 Classement & Série (Leaderboard)",
    value: "/(tabs)/classement",
    category: "Progression",
    description: "Tableau d'honneur et suivi des séries de jours",
  },
  {
    label: "🌟 Horoscope Ancestral (Vintana)",
    value: "/(tabs)/explore",
    category: "Culture",
    description: "Signes astrologiques et traditions malgaches",
  },
  {
    label: "💬 Donner un avis / Support",
    value: "/(screens)/profile/feedback",
    category: "Support",
    description: "Formulaire d'évaluation et feedback",
  },
];
