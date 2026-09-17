import {
  BookOpen,
  ScrollText,
  Quote,
  Mic,
  Lock,
  CheckCheck,
  Puzzle,
  HelpCircle,
  Bell,
  Users,
  LayoutDashboard,
} from 'lucide-react';

export const APP_NAVIGATION = [
  { label: "Vue d'ensemble", href: '/', icon: LayoutDashboard },
  { label: 'Contes & Angano', href: '/contes', icon: BookOpen },
  { label: 'Proverbes & Fady', href: '/proverbes', icon: ScrollText },
  { label: 'Discours & Kabary', href: '/kabary', icon: Mic },
  { label: 'Citations & Auteurs', href: '/citations', icon: Quote },
  { label: 'Vrai ou Faux (Jeux)', href: '/true-false', icon: CheckCheck },
  { label: "Remets dans l'ordre (Jeux)", href: '/word-puzzle', icon: Puzzle },
  { label: 'Mot Manquant (Jeux)', href: '/missing-word', icon: HelpCircle },
  { label: 'Jeux & Catégories', href: '/locks', icon: Lock },
  { label: 'Notifications & Alertes', href: '/notifications', icon: Bell },
  { label: 'Utilisateurs & Rôles', href: '/users', icon: Users },
];

export const PRESET_LOCK_REASONS = [
  'Bientôt disponible',
  'En cours de maintenance technique',
  'Mise à jour du contenu culturel',
  'Temporairement indisponible',
];

export const THEMES_TRUE_FALSE: Record<string, string> = {
  GEN: 'Général',
  CULT: 'Culture & Coutumes',
  GEO: 'Géographie & Nature',
  HIST: 'Histoire & Société',
  LITT: 'Littérature & Arts',
  PROV: 'Proverbes & Sagesse',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Difficile',
  EXPERT: 'Expert',
};
