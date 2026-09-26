'use client';

import { useToast } from '@/lib/hooks/useToast';
import { historyService } from '@/services/history.service';
import type {
  PresidentItem,
  NationalEmblemItem,
  BanknoteItem,
  ProvinceBlasonItem,
  NatureEmblemItem,
  HistoryDateItem,
  CivicLessonItem,
} from '@/types/history';
import type { GenericHistoryFormData } from '../types/forms';
import type { TabKey } from '../types/tabs';

/** Convertit un texte multiligne en tableau de strings non vides */
const parseLines = (text?: string): string[] =>
  (text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);

/**
 * Normalise le payload générique avant envoi à l'API.
 * Supprime les métadonnées système et convertit les champs intermédiaires.
 */
function normalizePayload(raw: GenericHistoryFormData): GenericHistoryFormData {
  const payload = { ...raw };

  // Supprimer les métadonnées système
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload._count;

  // Conversion des textareas → tableaux
  if (payload.achievementsFrRaw !== undefined) {
    payload.achievementsFr = parseLines(payload.achievementsFrRaw);
    delete payload.achievementsFrRaw;
  }
  if (payload.achievementsMgRaw !== undefined) {
    payload.achievementsMg = parseLines(payload.achievementsMgRaw);
    delete payload.achievementsMgRaw;
  }
  if (payload.keyFactsFrRaw !== undefined) {
    payload.keyFactsFr = parseLines(payload.keyFactsFrRaw);
    delete payload.keyFactsFrRaw;
  }
  if (payload.keyFactsMgRaw !== undefined) {
    payload.keyFactsMg = parseLines(payload.keyFactsMgRaw);
    delete payload.keyFactsMgRaw;
  }
  if (payload.securityFeaturesRaw !== undefined) {
    payload.securityFeaturesFr = parseLines(payload.securityFeaturesRaw);
    delete payload.securityFeaturesRaw;
  }
  if (payload.categoryRaw !== undefined) {
    payload.category = (payload.categoryRaw ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    delete payload.categoryRaw;
  }

  // Filtrer les symboles de province vides
  if (Array.isArray(payload.symbols)) {
    payload.symbols = payload.symbols.filter(
      (s) => s?.labelFr?.trim() || s?.labelMg?.trim() || s?.meaningFr?.trim()
    );
  }

  // Conversion numérique
  if (payload.orderIndex !== undefined) payload.orderIndex = Number(payload.orderIndex) || 0;
  if (payload.valueAriary !== undefined && payload.valueAriary !== null) {
    payload.valueAriary = Number(payload.valueAriary) || 0;
  } else {
    payload.valueAriary = 0;
  }
  if (payload.valueFmg !== undefined && payload.valueFmg !== null) {
    payload.valueFmg = Number(payload.valueFmg) || 0;
  } else {
    payload.valueFmg = 0;
  }

  if (payload.isComingSoon !== undefined) {
    payload.isComingSoon = Boolean(payload.isComingSoon);
  }

  return payload;
}

interface UseHistoireCrudOptions {
  activeTab: TabKey;
  editingItemId: string | undefined | null;
  isEditMode: boolean;
  formValues: GenericHistoryFormData;
  setIsSubmitting: (v: boolean) => void;
  onSuccess: () => void | Promise<void>;
  onClose: () => void;
}

/**
 * Hook de soumission et suppression CRUD pour la feature Histoire.
 * Dispatch vers le bon service selon l'onglet actif.
 */
export function useHistoireCrud({
  activeTab,
  editingItemId,
  isEditMode,
  formValues,
  setIsSubmitting,
  onSuccess,
  onClose,
}: UseHistoireCrudOptions) {
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const id = editingItemId ?? '';
      const payload = normalizePayload(formValues);

      if (!id && !isEditMode && activeTab !== 'emblems') {
        toast.error('Veuillez renseigner un identifiant unique (slug) pour cet élément.');
        return;
      }

      if (isEditMode) delete payload.id;

      switch (activeTab) {
        case 'presidents':
          if (isEditMode) await historyService.updatePresident(id, payload as Partial<PresidentItem>);
          else await historyService.createPresident(payload as Partial<PresidentItem>);
          break;
        case 'emblems':
          if (isEditMode) await historyService.updateNationalEmblem(id, payload as Partial<NationalEmblemItem>);
          else await historyService.createNationalEmblem(payload as Partial<NationalEmblemItem>);
          break;
        case 'banknotes': {
          const ar = Number(payload.valueAriary) || 0;
          const fmg = Number(payload.valueFmg) || 0;
          if (!payload.titleFr?.trim()) {
            payload.titleFr =
              ar > 0
                ? `Billet ${ar.toLocaleString('fr-FR')} Ariary`
                : fmg > 0
                  ? `Billet ${fmg.toLocaleString('fr-FR')} Francs`
                  : 'Billet de Madagascar';
          }
          if (!payload.titleMg?.trim()) {
            payload.titleMg =
              ar > 0
                ? `Vola ${ar.toLocaleString('fr-FR')} Ariary`
                : fmg > 0
                  ? `Vola ${fmg.toLocaleString('fr-FR')} Faranka`
                  : 'Vola Malagasy';
          }
          if (isEditMode) await historyService.updateBanknote(id, payload as Partial<BanknoteItem>);
          else await historyService.createBanknote(payload as Partial<BanknoteItem>);
          break;
        }
        case 'provinces':
          if (isEditMode) await historyService.updateProvince(id, payload as Partial<ProvinceBlasonItem>);
          else await historyService.createProvince(payload as Partial<ProvinceBlasonItem>);
          break;
        case 'nature':
          if (isEditMode) await historyService.updateNatureEmblem(id, payload as Partial<NatureEmblemItem>);
          else await historyService.createNatureEmblem(payload as Partial<NatureEmblemItem>);
          break;
        case 'dates':
          if (isEditMode) await historyService.updateHistoryDate(id, payload as Partial<HistoryDateItem>);
          else await historyService.createHistoryDate(payload as Partial<HistoryDateItem>);
          break;
        case 'lessons': {
          const lessonPayload: Partial<CivicLessonItem> = {
            id: payload.id,
            titleFr: payload.titleFr,
            titleMg: payload.titleMg,
            descriptionFr: payload.descriptionFr,
            descriptionMg: payload.descriptionMg,
            category: payload.category,
            imageUrl: payload.imageUrl,
            orderIndex: payload.orderIndex,
            status: formValues.lessonStatus ?? true,
          };
          if (isEditMode) await historyService.updateLesson(id, lessonPayload);
          else await historyService.createLesson(lessonPayload);
          break;
        }
      }

      toast.success(isEditMode ? 'Élément mis à jour avec succès.' : 'Élément créé avec succès.');
      onClose();
      await onSuccess();
    } catch (err) {
      toast.error(`Erreur lors de la sauvegarde : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deletingItem: { id: string } | null) => {
    if (!deletingItem) return;
    setIsSubmitting(true);

    try {
      const { id } = deletingItem;
      switch (activeTab) {
        case 'presidents': await historyService.deletePresident(id); break;
        case 'emblems': await historyService.deleteNationalEmblem(id); break;
        case 'banknotes': await historyService.deleteBanknote(id); break;
        case 'provinces': await historyService.deleteProvince(id); break;
        case 'nature': await historyService.deleteNatureEmblem(id); break;
        case 'dates': await historyService.deleteHistoryDate(id); break;
        case 'lessons': await historyService.deleteLesson(id); break;
      }
      toast.success('Élément supprimé avec succès.');
      await onSuccess();
    } catch (err) {
      toast.error(`Erreur suppression : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSave, handleDelete };
}
