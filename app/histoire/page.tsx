'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, RefreshCw } from 'lucide-react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState, ConfirmModal } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { historyService } from '@/services/history.service';

import {
  VALID_TAB_KEYS,
  type TabKey,
  useHistoireData,
  useHistoireModal,
  useHistoireCrud,
  useHistoireFilters,
  HistoireTabBar,
  HistoireFilterBar,
  HistoireModal,
  PresidentCardList,
  NationalEmblemTable,
  ProvinceCardList,
  BanknoteCardList,
  NatureEmblemCardList,
  HistoryDateCardList,
  CivicLessonCardList,
} from '@/features/histoire';

function getAddButtonLabel(tab: TabKey): string {
  switch (tab) {
    case 'presidents':
      return 'Ajouter un Président';
    case 'emblems':
      return 'Ajouter un Emblème';
    case 'provinces':
      return 'Ajouter une Province / Blason';
    case 'banknotes':
      return 'Ajouter un Billet';
    case 'nature':
      return 'Ajouter une Espèce';
    case 'dates':
      return 'Ajouter une Date';
    case 'lessons':
      return 'Ajouter une Rubrique';
  }
}

function HistoireAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const urlTab = searchParams.get('tab') as TabKey | null;
  const initialTab: TabKey =
    urlTab && VALID_TAB_KEYS.includes(urlTab) ? urlTab : 'presidents';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [isSeeding, setIsSeeding] = useState(false);

  // Synchronisation de l'onglet actif avec l'URL
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    router.replace(`/histoire?tab=${tab}`, { scroll: false });
  };

  // Données et rechargement
  const { data, isLoading, loadAll } = useHistoireData();

  // Filtrage et recherche mémoïsés
  const {
    searchQuery,
    setSearchQuery,
    banknoteSeriesFilter,
    setBanknoteSeriesFilter,
    filtered,
  } = useHistoireFilters({ data, activeTab });

  // État de la modale CRUD
  const modal = useHistoireModal(activeTab);

  // Handlers CRUD (Sauvegarde et Suppression)
  const { handleSave, handleDelete } = useHistoireCrud({
    activeTab,
    editingItemId: modal.editingItem?.id,
    isEditMode: !!modal.editingItem,
    formValues: modal.formValues,
    setIsSubmitting: modal.setIsSubmitting,
    onSuccess: loadAll,
    onClose: modal.close,
  });

  // Synchronisation des données du patrimoine par défaut
  const handleSyncDefaults = async (force = false) => {
    setIsSeeding(true);
    try {
      const res = await historyService.seedDefaults(force);
      toast.success(res.message || 'Les données du patrimoine ont été synchronisées.');
      await loadAll();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Impossible de synchroniser les données'
      );
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-6 pb-12">
        {/* En-tête de page */}
        <PageHeader
          title="Histoire & Patrimoine National"
          description="Gestion du musée virtuel malgache : chefs d'État, sceaux républicains, provinces & blasons, numismatique, biodiversité, grandes dates et civisme."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSyncDefaults(false)}
                disabled={isSeeding}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Synchronise les données officielles et le musée des billets si vide"
              >
                <RefreshCw size={15} className={isSeeding ? 'animate-spin' : ''} />
                <span>
                  {isSeeding ? 'Synchronisation...' : 'Synchroniser le patrimoine'}
                </span>
              </button>

              <button
                onClick={modal.openCreate}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>{getAddButtonLabel(activeTab)}</span>
              </button>
            </div>
          }
        />

        {/* Barre d'onglets ergonomique avec compteurs */}
        <HistoireTabBar
          activeTab={activeTab}
          data={data}
          onChange={handleTabChange}
        />

        {/* Barre de recherche et filtres contextuels */}
        <HistoireFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showBanknoteFilter={activeTab === 'banknotes'}
          banknoteSeriesFilter={banknoteSeriesFilter}
          onBanknoteSeriesChange={setBanknoteSeriesFilter}
          totalBanknotes={data.banknotes.length}
        />

        {/* Contenu principal selon l'onglet actif */}
        {isLoading ? (
          <LoadingState message="Chargement des données historiques..." />
        ) : (
          <div>
            {activeTab === 'presidents' && (
              <PresidentCardList
                items={filtered.presidents}
                onEdit={modal.openEdit}
                onDelete={(item) =>
                  modal.setDeletingItem({ id: item.id, name: item.name })
                }
              />
            )}

            {activeTab === 'emblems' && (
              <NationalEmblemTable
                items={filtered.emblems}
                onEdit={modal.openEdit}
                onDelete={(item) =>
                  modal.setDeletingItem({ id: item.id, name: item.government })
                }
              />
            )}

            {activeTab === 'provinces' && (
              <ProvinceCardList
                items={filtered.provinces}
                onEdit={modal.openEdit}
                onDelete={(item) =>
                  modal.setDeletingItem({
                    id: item.id,
                    name: `Province de ${item.province}`,
                  })
                }
              />
            )}

            {activeTab === 'banknotes' && (
              <BanknoteCardList
                items={filtered.banknotes}
                isSeeding={isSeeding}
                onSyncDefaults={() => handleSyncDefaults(false)}
                onEdit={modal.openEdit}
                onDelete={(item) =>
                  modal.setDeletingItem({ id: item.id, name: item.titleFr })
                }
              />
            )}

            {activeTab === 'nature' && (
              <NatureEmblemCardList
                items={filtered.nature}
                onEdit={modal.openEdit}
                onDelete={(item) =>
                  modal.setDeletingItem({ id: item.id, name: item.nameFr })
                }
              />
            )}

            {activeTab === 'dates' && (
              <HistoryDateCardList
                items={filtered.dates}
                onEdit={modal.openEdit}
                onDelete={(item) =>
                  modal.setDeletingItem({ id: item.id, name: item.titleFr })
                }
              />
            )}

            {activeTab === 'lessons' && (
              <CivicLessonCardList
                items={filtered.lessons}
                onEdit={modal.openEdit}
                onDelete={(item) =>
                  modal.setDeletingItem({ id: item.id, name: item.titleFr })
                }
              />
            )}
          </div>
        )}

        {/* Modale CRUD unifiée */}
        <HistoireModal
          isOpen={modal.isModalOpen}
          onClose={modal.close}
          activeTab={activeTab}
          editingItem={modal.editingItem}
          formValues={modal.formValues}
          setFormValues={modal.setFormValues}
          isSubmitting={modal.isSubmitting}
          onSubmit={handleSave}
          addSymbol={modal.addSymbol}
          updateSymbol={modal.updateSymbol}
          removeSymbol={modal.removeSymbol}
          applyColorPreset={modal.applyColorPreset}
        />

        {/* Modale de confirmation de suppression */}
        <ConfirmModal
          isOpen={!!modal.deletingItem}
          onClose={() => modal.setDeletingItem(null)}
          onConfirm={async () => {
            await handleDelete(modal.deletingItem);
            modal.setDeletingItem(null);
          }}
          title="Confirmer la suppression"
          description={`Êtes-vous sûr de vouloir supprimer définitivement "${modal.deletingItem?.name}" ? Cette action est irréversible.`}
          confirmText={modal.isSubmitting ? 'Suppression...' : 'Supprimer définitivement'}
          isLoading={modal.isSubmitting}
          variant="danger"
        />
      </div>
    </AdminShell>
  );
}

export default function HistoireAdminPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement du module Histoire..." />}>
      <HistoireAdminContent />
    </Suspense>
  );
}
