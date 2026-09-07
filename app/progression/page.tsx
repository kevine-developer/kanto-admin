'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Star, Trophy, Users } from 'lucide-react';

export default function ProgressionPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Progression & Gamification"
        description="Gestion des points d'XP, des niveaux et de la progression globale des joueurs."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* En attente d'une implémentation backend complète avec Prisma côté admin */}
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="font-semibold">Joueurs Actifs</h3>
          </div>
          <p className="text-3xl font-bold font-heritage">--</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Données en cours de synchronisation</p>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
              <Star size={20} />
            </div>
            <h3 className="font-semibold">Total XP Distribué</h3>
          </div>
          <p className="text-3xl font-bold font-heritage">--</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Depuis le lancement</p>
        </div>

        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Trophy size={20} />
            </div>
            <h3 className="font-semibold">Top Niveau</h3>
          </div>
          <p className="text-3xl font-bold font-heritage">Niveau --</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Record de progression</p>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl overflow-hidden mt-4 shadow-sm">
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="font-semibold text-lg">Nouvelle Architecture de Progression</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Les XP et la progression de chaque jeu sont désormais synchronisés avec la base de données PostgreSQL via NestJS.
          </p>
        </div>
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent-text)] mb-4">
            <Star size={32} />
          </div>
          <h3 className="text-lg font-medium mb-2">Le tableau de bord est prêt à recevoir les données</h3>
          <p className="text-[var(--text-muted)] max-w-md">
            L'API backend est en place. Prochainement, vous pourrez voir le leaderboard des joueurs, ajuster les gains d'XP et suivre l'historique complet des transactions de points de jeu.
          </p>
        </div>
      </div>
    </div>
  );
}
