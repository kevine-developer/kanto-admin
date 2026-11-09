'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/lib/hooks/useToast';
import {
  adminReviewsService,
  AdminReviewItem,
} from '@/services/reviews.service';
import {
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Globe,
  Lock,
  MessageSquare,
  AlertCircle,
  EyeOff,
  User,
  Smartphone,
  Calendar,
  X,
} from 'lucide-react';

export default function AdminReviewsPage() {
  const { toast } = useToast();

  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modale de modération
  const [selectedReview, setSelectedReview] = useState<AdminReviewItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | 'PENDING' | null>(null);
  const [moderatorNote, setModeratorNote] = useState<string>('');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminReviewsService.getReviews({
        page,
        limit: 15,
        status: statusFilter,
        rating: ratingFilter !== 'ALL' ? Number(ratingFilter) : undefined,
        search: searchQuery,
      });
      setReviews(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger la liste des avis.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, ratingFilter, searchQuery, toast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleOpenModerationModal = (
    review: AdminReviewItem,
    action: 'APPROVED' | 'REJECTED' | 'PENDING',
  ) => {
    setSelectedReview(review);
    setActionType(action);
    setModeratorNote(review.moderatorNote || '');
  };

  const handleConfirmModeration = async () => {
    if (!selectedReview || !actionType) return;

    setIsSubmittingAction(true);
    try {
      await adminReviewsService.moderateReview(
        selectedReview.id,
        actionType,
        moderatorNote.trim() || undefined,
      );

      toast.success(
        actionType === 'APPROVED'
          ? 'L’avis a été approuvé et est désormais visible sur le site public.'
          : actionType === 'REJECTED'
          ? 'L’avis a été rejeté avec note interne.'
          : 'Le statut de l’avis a été mis à jour.'
      );

      setSelectedReview(null);
      setActionType(null);
      setModeratorNote('');
      loadReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la modération de l’avis.';
      toast.error(msg);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={s <= rating ? 'fill-amber-500' : 'text-stone-300 dark:text-stone-700 fill-none'}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string, isAuthorized: boolean) => {
    if (!isAuthorized) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
          <Lock size={12} />
          Usage interne (Non autorisé)
        </span>
      );
    }

    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 size={12} />
            Publié sur le portail
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock size={12} />
            En attente de validation
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle size={12} />
            Refusé
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400">
            <EyeOff size={12} />
            Retiré par l’utilisateur
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* En-tête */}
        <PageHeader
          title="Modération des Avis & Témoignages"
          description="Gérez les retours d'expérience utilisateurs et décidez de leur publication publique sur app-kanto.gastsar.fr en respectant scrupuleusement le consentement RGPD."
        />

        {/* Barre de filtres et recherche */}
        <div className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtre statut */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Statut :</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">En attente de modération</option>
                <option value="APPROVED">Approuvés (En ligne)</option>
                <option value="NOT_AUTHORIZED">Usage interne uniquement</option>
                <option value="REJECTED">Refusés</option>
                <option value="WITHDRAWN">Retirés par l’auteur</option>
              </select>
            </div>

            {/* Filtre note */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Note :</span>
              <select
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="ALL">Toutes les notes</option>
                <option value="5">5 étoiles (⭐⭐⭐⭐⭐)</option>
                <option value="4">4 étoiles (⭐⭐⭐⭐)</option>
                <option value="3">3 étoiles (⭐⭐⭐)</option>
                <option value="2">2 étoiles (⭐⭐)</option>
                <option value="1">1 étoile (⭐)</option>
              </select>
            </div>
          </div>

          {/* Recherche textuelle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Rechercher par texte, auteur..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadReviews}
              disabled={isLoading}
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Liste des avis */}
        {isLoading ? (
          <div className="p-12 text-center text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-sm">Chargement des avis et des statuts de modération...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
            <MessageSquare size={32} className="mx-auto mb-3 text-stone-400" />
            <p className="text-sm font-medium">Aucun avis trouvé correspondant à vos critères.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-stone-500 dark:text-stone-400 px-1">
              Affichage de {reviews.length} sur {totalCount} avis au total.
            </div>

            <div className="grid grid-cols-1 gap-4">
              {reviews.map((rev) => {
                const authorDisplay = rev.user?.name || rev.authorName || 'Visiteur';
                const authorEmail = rev.user?.email || rev.authorEmail || 'Non communiqué';

                return (
                  <div
                    key={rev.id}
                    className="p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {/* Note & Auteur */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          {renderStars(rev.rating)}
                          <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {rev.rating} / 5
                          </span>
                          {getStatusBadge(rev.moderationStatus, rev.isPublicationAuthorized)}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400 pt-1">
                          <span className="flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                            <User size={13} />
                            {authorDisplay} ({authorEmail})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={13} />
                            {new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {rev.appVersion && (
                            <span className="flex items-center gap-1">
                              <Smartphone size={13} />
                              Version {rev.appVersion} {rev.platform ? `(${rev.platform})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Options d'affichage public */}
                      <div className="text-right text-xs">
                        {rev.isPublicationAuthorized ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Globe size={13} />
                            <span>
                              Nom public : <strong>{rev.publicDisplayName || 'Anonyme'}</strong> ({rev.publicDisplayNameType})
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            <Lock size={13} />
                            <span>Usage interne seulement</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Commentaire de l'utilisateur (Non modifiable) */}
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-lg border border-stone-200 dark:border-stone-800">
                      <p className="text-sm text-stone-900 dark:text-stone-100 whitespace-pre-wrap leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Note du modérateur si présente */}
                    {rev.moderatorNote && (
                      <div className="text-xs p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 rounded border border-amber-200 dark:border-amber-900/40 flex items-start gap-2">
                        <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                        <div>
                          <strong>Note de modération :</strong> {rev.moderatorNote}
                          {rev.moderatedBy && ` (par ${rev.moderatedBy})`}
                        </div>
                      </div>
                    )}

                    {/* Boutons d'action modérateur */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="text-xs text-stone-400">
                        Règle stricte : la note et le texte de l’avis sont immuables.
                      </div>

                      <div className="flex items-center gap-2">
                        {rev.isPublicationAuthorized && rev.moderationStatus !== 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenModerationModal(rev, 'APPROVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 size={13} className="mr-1" />
                            Approuver la publication
                          </Button>
                        )}

                        {rev.moderationStatus === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModerationModal(rev, 'REJECTED')}
                            className="text-amber-600 border-amber-300 dark:border-amber-800 hover:bg-amber-50"
                          >
                            <EyeOff size={13} className="mr-1" />
                            Masquer / Dépublier
                          </Button>
                        )}

                        {rev.moderationStatus !== 'REJECTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModerationModal(rev, 'REJECTED')}
                            className="text-rose-600 border-rose-300 dark:border-rose-800 hover:bg-rose-50"
                          >
                            <XCircle size={13} className="mr-1" />
                            Refuser
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Page précédente
                </Button>
                <span className="text-xs text-stone-600 dark:text-stone-400">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Page suivante
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modale de confirmation de modération avec motif interne */}
      {selectedReview && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                {actionType === 'APPROVED' ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    Approuver la publication publique
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="text-rose-600" />
                    Refuser la publication de l’avis
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedReview(null);
                  setActionType(null);
                }}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              {actionType === 'APPROVED'
                ? `L’avis #${selectedReview.id.slice(0, 8)} apparaîtra immédiatement sur la vitrine officielle de Kanto MG avec la mention : ${selectedReview.publicDisplayName || 'Membre de la communauté'}.`
                : `Cet avis ne sera pas visible sur le portail public. Il restera consigné en base pour l'équipe technique.`}
            </p>

            {/* Rappel de l'avis */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                {renderStars(selectedReview.rating)} ({selectedReview.rating}/5)
              </div>
              <p className="text-stone-700 dark:text-stone-300 italic line-clamp-3">
                « {selectedReview.comment} »
              </p>
            </div>

            {/* Note interne du modérateur */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Motif ou note interne du modérateur (facultatif) :
              </label>
              <textarea
                value={moderatorNote}
                onChange={(e) => setModeratorNote(e.target.value)}
                placeholder="Ex: Avis constructif et bienveillant validé / Propos inappropriés..."
                rows={3}
                className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReview(null);
                  setActionType(null);
                }}
                disabled={isSubmittingAction}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmModeration}
                isLoading={isSubmittingAction}
                disabled={isSubmittingAction}
                className={actionType === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}
              >
                Confirmer la décision
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
