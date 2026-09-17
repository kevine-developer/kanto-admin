/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  SearchBar,
  ConfirmModal,
  LoadingState,
  EmptyState,
  Modal,
  Field,
  Input,
  ImageUploadDropzone,
} from '@/components/ui';
import { resolveMediaUrl } from '@/lib/utils/media';
import { historyService } from '@/services/history.service';
import {
  CivicLessonItem,
  PresidentItem,
  BanknoteItem,
  ProvinceBlasonItem,
  ProvinceSymbol,
  NatureEmblemItem,
  HistoryDateItem,
  NationalEmblemItem,
  ContentStatus,
} from '@/types/history';
import {
  Crown,
  Shield,
  Banknote as BanknoteIcon,
  MapPin,
  TreePine,
  History,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Palette,
  Award,
} from 'lucide-react';

type TabKey =
  | 'presidents'
  | 'emblems'
  | 'banknotes'
  | 'provinces'
  | 'nature'
  | 'dates'
  | 'lessons';

export interface HistoryFormData {
  id?: string;
  name?: string;
  period?: string;
  republic?: string;
  republicMg?: string;
  titleFr?: string;
  titleMg?: string;
  badgeColor?: string;
  quoteFr?: string;
  quoteMg?: string;
  bioFr?: string;
  bioMg?: string;
  achievementsFrRaw?: string;
  achievementsMgRaw?: string;
  achievementsFr?: string[];
  achievementsMg?: string[];
  government?: string;
  descriptionFr?: string;
  descriptionMg?: string;
  notesFr?: string;
  notesMg?: string;
  province?: string;
  chefLieu?: string;
  color?: string;
  bgLight?: string;
  borderLight?: string;
  symbols?: ProvinceSymbol[];
  keyFactsFrRaw?: string;
  keyFactsMgRaw?: string;
  keyFactsFr?: string[];
  keyFactsMg?: string[];
  nameFr?: string;
  nameMg?: string;
  valueAriary?: number;
  valueFmg?: number;
  series?: string;
  seriesLabelFr?: string;
  seriesLabelMg?: string;
  colorLight?: string;
  colorDark?: string;
  obverseDescriptionFr?: string;
  obverseDescriptionMg?: string;
  reverseDescriptionFr?: string;
  reverseDescriptionMg?: string;
  symbolismFr?: string;
  symbolismMg?: string;
  securityFeaturesRaw?: string;
  securityFeaturesFr?: string[];
  scientificName?: string;
  type?: string;
  statusFr?: string;
  statusMg?: string;
  culturalRoleFr?: string;
  culturalRoleMg?: string;
  year?: string;
  exactDate?: string;
  era?: string;
  summaryFr?: string;
  summaryMg?: string;
  impactFr?: string;
  impactMg?: string;
  categoryRaw?: string;
  category?: string[];
  imageUrl?: string | null;
  orderIndex?: number;
  accentColor?: string;
  status?: ContentStatus;
  lessonStatus?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: unknown;
}

export type HistoryItem =
  | PresidentItem
  | NationalEmblemItem
  | BanknoteItem
  | ProvinceBlasonItem
  | NatureEmblemItem
  | HistoryDateItem
  | CivicLessonItem;

const PRESET_COLORS = [
  { label: 'Bleu Royal', hex: '#2B6CB0', bg: '#EBF8FF', border: '#BEE3F8' },
  { label: 'Vert Émeraude', hex: '#2F855A', bg: '#F0FFF4', border: '#C6F6D5' },
  { label: 'Rouge Madagascar', hex: '#C53030', bg: '#FFF5F5', border: '#FED7D7' },
  { label: 'Orange Terre', hex: '#DD6B20', bg: '#FFFAF0', border: '#FEEBC8' },
  { label: 'Pourpre Sacré', hex: '#805AD5', bg: '#FAF5FF', border: '#E9D8FD' },
  { label: 'Ocre Doré', hex: '#D69E2E', bg: '#FFFFF0', border: '#FEFCBF' },
  { label: 'Turquoise Océan', hex: '#319795', bg: '#E6FFFA', border: '#B2F5EA' },
  { label: 'Sépia Ancien', hex: '#744210', bg: '#FFFAF0', border: '#FBD38D' },
];

function HistoireAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Onglet actif initialisé depuis l'URL si présent
  const urlTab = searchParams.get('tab') as TabKey | null;
  const initialTab: TabKey =
    urlTab &&
    ['presidents', 'emblems', 'banknotes', 'provinces', 'nature', 'dates', 'lessons'].includes(urlTab)
      ? urlTab
      : 'presidents';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Synchronisation avec l'URL
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    router.replace(`/histoire?tab=${tab}`, { scroll: false });
  };

  // Données des 7 onglets
  const [presidents, setPresidents] = useState<PresidentItem[]>([]);
  const [nationalEmblems, setNationalEmblems] = useState<NationalEmblemItem[]>([]);
  const [banknotes, setBanknotes] = useState<BanknoteItem[]>([]);
  const [provinces, setProvinces] = useState<ProvinceBlasonItem[]>([]);
  const [natureEmblems, setNatureEmblems] = useState<NatureEmblemItem[]>([]);
  const [historyDates, setHistoryDates] = useState<HistoryDateItem[]>([]);
  const [lessons, setLessons] = useState<CivicLessonItem[]>([]);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State générique
  const [formValues, setFormValues] = useState<HistoryFormData>({});

  // Chargement global
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        presidentsData,
        emblemsData,
        banknotesData,
        provincesData,
        natureData,
        datesData,
        lessonsData,
      ] = await Promise.all([
        historyService.getPresidents().catch(() => []),
        historyService.getNationalEmblems().catch(() => []),
        historyService.getBanknotes().catch(() => []),
        historyService.getProvinces().catch(() => []),
        historyService.getNatureEmblems().catch(() => []),
        historyService.getHistoryDates().catch(() => []),
        historyService.getLessons().catch(() => []),
      ]);

      setPresidents(presidentsData);
      setNationalEmblems(emblemsData);
      setBanknotes(banknotesData);
      setProvinces(provincesData);
      setNatureEmblems(natureData);
      setHistoryDates(datesData);
      setLessons(lessonsData);
    } catch (err) {
      console.error('Erreur chargement données histoire:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Gestion de l'ouverture de modale en création
  const handleOpenCreate = () => {
    setEditingItem(null);
    const defaults: HistoryFormData = {
      orderIndex: 0,
      status: 'PUBLISHED',
    };

    if (activeTab === 'presidents') {
      defaults.badgeColor = '#2A6B3D';
      defaults.achievementsFrRaw = '';
      defaults.achievementsMgRaw = '';
      defaults.republic = '4ème République';
      defaults.republicMg = 'Repoblika Fahefatra';
    } else if (activeTab === 'provinces') {
      defaults.color = '#2B6CB0';
      defaults.bgLight = '#EBF8FF';
      defaults.borderLight = '#BEE3F8';
      defaults.symbols = [
        { labelFr: '', labelMg: '', meaningFr: '', meaningMg: '' },
      ];
      defaults.keyFactsFrRaw = '';
      defaults.keyFactsMgRaw = '';
    } else if (activeTab === 'nature') {
      defaults.type = 'FLORA';
      defaults.statusFr = 'Espèce protégée / Endémique';
      defaults.statusMg = 'Harena voaaro';
      defaults.accentColor = '#1B5E20';
    } else if (activeTab === 'banknotes') {
      defaults.series = 'SERIE_2017';
      defaults.seriesLabelFr = 'Série 2017 - Madagascar et ses Richesses';
      defaults.seriesLabelMg = 'Sokajy 2017 - Madagasikara sy ny Harenany';
      defaults.colorLight = '#2E7D32';
      defaults.colorDark = '#1B5E20';
      defaults.securityFeaturesRaw = '';
    } else if (activeTab === 'dates') {
      defaults.accentColor = '#B71C1C';
      defaults.era = 'Époque contemporaine';
    } else if (activeTab === 'lessons') {
      defaults.categoryRaw = 'culture-histoire, patrimoine';
      defaults.lessonStatus = true;
    }

    setFormValues(defaults);
    setIsModalOpen(true);
  };

  // Gestion de l'ouverture de modale en édition
  const handleOpenEdit = (item: HistoryItem) => {
    setEditingItem(item);

    const values: HistoryFormData = { ...(item as unknown as HistoryFormData) };

    // Conversion des listes pour affichage fluide dans les textareas
    if ('achievementsFr' in item && Array.isArray(item.achievementsFr)) {
      values.achievementsFrRaw = item.achievementsFr.join('\n');
    }
    if ('achievementsMg' in item && Array.isArray(item.achievementsMg)) {
      values.achievementsMgRaw = item.achievementsMg.join('\n');
    }
    if ('keyFactsFr' in item && Array.isArray(item.keyFactsFr)) {
      values.keyFactsFrRaw = item.keyFactsFr.join('\n');
    }
    if ('keyFactsMg' in item && Array.isArray(item.keyFactsMg)) {
      values.keyFactsMgRaw = item.keyFactsMg.join('\n');
    }
    if ('securityFeaturesFr' in item && Array.isArray(item.securityFeaturesFr)) {
      values.securityFeaturesRaw = item.securityFeaturesFr.join('\n');
    }
    if ('category' in item && Array.isArray(item.category)) {
      values.categoryRaw = item.category.join(', ');
    }
    if ('symbols' in item && Array.isArray(item.symbols)) {
      values.symbols = item.symbols.length > 0
        ? [...item.symbols]
        : [{ labelFr: '', labelMg: '', meaningFr: '', meaningMg: '' }];
    } else if (activeTab === 'provinces') {
      values.symbols = [{ labelFr: '', labelMg: '', meaningFr: '', meaningMg: '' }];
    }
    if ('status' in item && typeof item.status === 'boolean') {
      values.lessonStatus = item.status;
    }

    setFormValues(values);
    setIsModalOpen(true);
  };

  // Gestion des symboles pour les blasons de province
  const handleAddSymbol = () => {
    setFormValues((prev) => ({
      ...prev,
      symbols: [
        ...(prev.symbols || []),
        { labelFr: '', labelMg: '', meaningFr: '', meaningMg: '' },
      ],
    }));
  };

  const handleUpdateSymbol = (index: number, field: keyof ProvinceSymbol, value: string) => {
    setFormValues((prev) => {
      const current = Array.isArray(prev.symbols) ? [...prev.symbols] : [];
      if (!current[index]) {
        current[index] = { labelFr: '', labelMg: '', meaningFr: '', meaningMg: '' };
      }
      current[index] = { ...current[index], [field]: value };
      return { ...prev, symbols: current };
    });
  };

  const handleRemoveSymbol = (index: number) => {
    setFormValues((prev) => {
      const current = Array.isArray(prev.symbols) ? [...prev.symbols] : [];
      current.splice(index, 1);
      return { ...prev, symbols: current };
    });
  };

  // Application rapide d'un preset de couleur
  const handleApplyColorPreset = (preset: typeof PRESET_COLORS[0]) => {
    setFormValues((prev) => ({
      ...prev,
      color: preset.hex,
      bgLight: preset.bg,
      borderLight: preset.border,
    }));
  };

  // Sauvegarde & Normalisation du payload
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isEdit = !!editingItem;
      const id = (editingItem?.id || formValues.id || '').trim();

      if (!id && !isEdit && activeTab !== 'emblems') {
        alert("Veuillez renseigner un identifiant unique (slug) pour cet élément.");
        setIsSubmitting(false);
        return;
      }

      // Nettoyage et formatage du payload
      const payload: HistoryFormData = { ...formValues };

      // Supprimer les métadonnées système
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload._count;

      // Normalisation des listes multilignes
      const parseLines = (text?: string): string[] =>
        (text || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

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
        payload.category = (payload.categoryRaw || '')
          .split(',')
          .map((c: string) => c.trim())
          .filter(Boolean);
        delete payload.categoryRaw;
      }

      // Filtrer les symboles de province vides
      if (Array.isArray(payload.symbols)) {
        payload.symbols = payload.symbols.filter(
          (s: ProvinceSymbol) => s && (s.labelFr?.trim() || s.labelMg?.trim() || s.meaningFr?.trim())
        );
      }

      // Conversion numérique
      if (payload.orderIndex !== undefined) {
        payload.orderIndex = Number(payload.orderIndex) || 0;
      }
      if (payload.valueAriary !== undefined) {
        payload.valueAriary = Number(payload.valueAriary) || 0;
      }
      if (payload.valueFmg !== undefined) {
        payload.valueFmg = Number(payload.valueFmg) || 0;
      }

      // En mode édition, ne pas écraser l'ID dans le body si immuable
      if (isEdit) {
        delete payload.id;
      }

      switch (activeTab) {
        case 'presidents':
          if (isEdit) await historyService.updatePresident(id, payload as Partial<PresidentItem>);
          else await historyService.createPresident(payload as Partial<PresidentItem>);
          break;
        case 'emblems':
          if (isEdit) await historyService.updateNationalEmblem(id, payload as Partial<NationalEmblemItem>);
          else await historyService.createNationalEmblem(payload as Partial<NationalEmblemItem>);
          break;
        case 'banknotes':
          if (isEdit) await historyService.updateBanknote(id, payload as Partial<BanknoteItem>);
          else await historyService.createBanknote(payload as Partial<BanknoteItem>);
          break;
        case 'provinces':
          if (isEdit) await historyService.updateProvince(id, payload as Partial<ProvinceBlasonItem>);
          else await historyService.createProvince(payload as Partial<ProvinceBlasonItem>);
          break;
        case 'nature':
          if (isEdit) await historyService.updateNatureEmblem(id, payload as Partial<NatureEmblemItem>);
          else await historyService.createNatureEmblem(payload as Partial<NatureEmblemItem>);
          break;
        case 'dates':
          if (isEdit) await historyService.updateHistoryDate(id, payload as Partial<HistoryDateItem>);
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
          if (isEdit) await historyService.updateLesson(id, lessonPayload);
          else await historyService.createLesson(lessonPayload);
          break;
        }
      }

      setIsModalOpen(false);
      setEditingItem(null);
      await loadAllData();
    } catch (err) {
      alert(`Erreur lors de la sauvegarde: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suppression
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      const id = deletingItem.id;
      switch (activeTab) {
        case 'presidents':
          await historyService.deletePresident(id);
          break;
        case 'emblems':
          await historyService.deleteNationalEmblem(id);
          break;
        case 'banknotes':
          await historyService.deleteBanknote(id);
          break;
        case 'provinces':
          await historyService.deleteProvince(id);
          break;
        case 'nature':
          await historyService.deleteNatureEmblem(id);
          break;
        case 'dates':
          await historyService.deleteHistoryDate(id);
          break;
        case 'lessons':
          await historyService.deleteLesson(id);
          break;
      }
      setDeletingItem(null);
      await loadAllData();
    } catch (err) {
      alert(`Erreur suppression: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrage
  const q = searchQuery.toLowerCase().trim();

  const filteredPresidents = presidents.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.republic.toLowerCase().includes(q) ||
      p.titleFr.toLowerCase().includes(q)
  );
  const filteredEmblems = nationalEmblems.filter(
    (e) =>
      !q ||
      e.period.toLowerCase().includes(q) ||
      e.government.toLowerCase().includes(q) ||
      e.descriptionFr.toLowerCase().includes(q)
  );
  const filteredBanknotes = banknotes.filter(
    (b) =>
      !q ||
      b.titleFr.toLowerCase().includes(q) ||
      String(b.valueAriary).includes(q) ||
      b.series.toLowerCase().includes(q)
  );
  const filteredProvinces = provinces.filter(
    (pr) =>
      !q ||
      pr.province.toLowerCase().includes(q) ||
      pr.chefLieu.toLowerCase().includes(q) ||
      pr.titleFr.toLowerCase().includes(q)
  );
  const filteredNature = natureEmblems.filter(
    (n) =>
      !q ||
      n.nameFr.toLowerCase().includes(q) ||
      n.scientificName.toLowerCase().includes(q) ||
      n.nameMg.toLowerCase().includes(q)
  );
  const filteredDates = historyDates.filter(
    (d) => !q || d.year.includes(q) || d.titleFr.toLowerCase().includes(q)
  );
  const filteredLessons = lessons.filter(
    (l) => !q || l.titleFr.toLowerCase().includes(q) || l.descriptionFr.toLowerCase().includes(q)
  );

  return (
    <AdminShell>
      <div className="w-full space-y-6 pb-12">
        <PageHeader
          title="Histoire, Mémoire & Emblèmes"
          description="Gérez les présidents, emblèmes d'État, blasons des 6 provinces, musée numismatique, faune/flore et grandes dates historiques de Madagascar."
          actions={
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
            >
              <Plus size={16} />
              <span>
                {activeTab === 'presidents' && 'Ajouter un Président'}
                {activeTab === 'emblems' && 'Ajouter un Emblème'}
                {activeTab === 'provinces' && 'Ajouter une Province / Blason'}
                {activeTab === 'banknotes' && 'Ajouter un Billet'}
                {activeTab === 'nature' && 'Ajouter une Espèce'}
                {activeTab === 'dates' && 'Ajouter une Date'}
                {activeTab === 'lessons' && 'Ajouter une Rubrique'}
              </span>
            </button>
          }
        />

        {/* Barre d'onglets ergonomique */}
        <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
          {[
            { key: 'presidents', label: 'Présidents', icon: Crown, count: presidents.length },
            { key: 'emblems', label: 'Emblèmes & Sceaux', icon: Shield, count: nationalEmblems.length },
            { key: 'provinces', label: '6 Provinces (Blasons)', icon: MapPin, count: provinces.length },
            { key: 'banknotes', label: 'Billets Malgaches', icon: BanknoteIcon, count: banknotes.length },
            { key: 'nature', label: 'Nature & Trésors', icon: TreePine, count: natureEmblems.length },
            { key: 'dates', label: 'Grandes Dates', icon: History, count: historyDates.length },
            { key: 'lessons', label: 'Thématiques / Rubriques', icon: Layers, count: lessons.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key as TabKey)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm font-semibold'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-mono">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Recherche */}
        <div className="flex items-center justify-between gap-4">
          <div className="w-full max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher par nom, province, mot-clé, date..."
            />
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Chargement des données historiques..." />
        ) : (
          <div>
            {/* ======================================================== */}
            {/* 1. ONGLET PRÉSIDENTS */}
            {/* ======================================================== */}
            {activeTab === 'presidents' &&
              (filteredPresidents.length === 0 ? (
                <EmptyState
                  title="Aucun président trouvé"
                  description="Créez une nouvelle fiche président de la République."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPresidents.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="w-20 h-28 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0 border border-stone-200 dark:border-stone-700 shadow-inner">
                          {item.imageUrl ? (
                            <img
                              src={resolveMediaUrl(item.imageUrl)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Crown size={28} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span
                              className="inline-block px-2.5 py-0.5 text-xs font-bold rounded-md text-white shadow-xs"
                              style={{ backgroundColor: item.badgeColor || '#2A6B3D' }}
                            >
                              {item.republic}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                                item.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-stone-900 dark:text-white text-base truncate">
                            {item.name}
                          </h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                            {item.period}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                            {item.titleFr}
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                            🇲🇬 {item.titleMg}
                          </p>
                        </div>
                      </div>

                      {item.quoteFr && (
                        <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border-l-3 border-emerald-500 space-y-1">
                          <p className="text-xs italic text-stone-700 dark:text-stone-300 font-serif">
                            « {item.quoteFr} »
                          </p>
                          {item.quoteMg && (
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic font-serif">
                              🇲🇬 « {item.quoteMg} »
                            </p>
                          )}
                        </div>
                      )}

                      {Array.isArray(item.achievementsFr) && item.achievementsFr.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <p className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1">
                            <Award size={12} />
                            <span>Faits majeurs ({item.achievementsFr.length})</span>
                          </p>
                          <ul className="text-xs text-stone-600 dark:text-stone-300 list-disc list-inside space-y-0.5 line-clamp-2">
                            {item.achievementsFr.slice(0, 2).map((ach, idx) => (
                              <li key={idx} className="truncate">
                                {ach}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400">
                        <span className="font-mono text-[11px]">Ordre: #{item.orderIndex}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingItem({ id: item.id, name: item.name })}
                            className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* ======================================================== */}
            {/* 2. ONGLET EMBLÈMES & SCEAUX D'ÉTAT */}
            {/* ======================================================== */}
            {activeTab === 'emblems' &&
              (filteredEmblems.length === 0 ? (
                <EmptyState
                  title="Aucun emblème d'État trouvé"
                  description="Ajoutez un emblème ou sceau officiel républicain."
                />
              ) : (
                <div className="overflow-hidden border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
                      <tr>
                        <th className="py-3.5 px-4 w-36">Période</th>
                        <th className="py-3.5 px-4 w-28 text-center">Sceau / Image</th>
                        <th className="py-3.5 px-4 w-60">Gouvernement / Régime</th>
                        <th className="py-3.5 px-4">Description et Symbolique</th>
                        <th className="py-3.5 px-4 text-center w-24">Statut</th>
                        <th className="py-3.5 px-4 text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                      {filteredEmblems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                        >
                          <td className="py-4 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                            {item.period}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-inner">
                              {item.imageUrl ? (
                                <img
                                  src={resolveMediaUrl(item.imageUrl)}
                                  alt={item.government}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                  <Shield size={22} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-stone-900 dark:text-white">
                            {item.government}
                          </td>
                          <td className="py-4 px-4 space-y-1.5">
                            <p className="text-stone-800 dark:text-stone-200 text-sm">
                              {item.descriptionFr}
                            </p>
                            {item.descriptionMg && (
                              <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                                🇲🇬 {item.descriptionMg}
                              </p>
                            )}
                            {item.notesFr && (
                              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-md inline-block">
                                📌 {item.notesFr}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-semibold uppercase ${
                                item.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() =>
                                setDeletingItem({
                                  id: item.id,
                                  name: `${item.government} (${item.period})`,
                                })
                              }
                              className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors ml-1"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* ======================================================== */}
            {/* 3. ONGLET 6 PROVINCES & BLASONS */}
            {/* ======================================================== */}
            {activeTab === 'provinces' &&
              (filteredProvinces.length === 0 ? (
                <EmptyState
                  title="Aucune province trouvée"
                  description="Ajoutez une province de Madagascar et son blason officiel."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProvinces.map((item) => {
                    const cardBg = item.bgLight || '#F8FAFC';
                    const cardBorder = item.borderLight || '#E2E8F0';
                    const accentColor = item.color || '#2B6CB0';
                    const symbolsCount = Array.isArray(item.symbols) ? item.symbols.length : 0;
                    const factsCount = Array.isArray(item.keyFactsFr) ? item.keyFactsFr.length : 0;

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all relative overflow-hidden"
                        style={{
                          backgroundColor: cardBg,
                          borderColor: cardBorder,
                        }}
                      >
                        {/* Liseré supérieur coloré */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1.5"
                          style={{ backgroundColor: accentColor }}
                        />

                        <div className="flex gap-4 items-start pt-1">
                          <div
                            className="w-20 h-24 rounded-xl overflow-hidden bg-white dark:bg-stone-900 flex-shrink-0 border shadow-xs p-1.5 flex items-center justify-center"
                            style={{ borderColor: cardBorder }}
                          >
                            {item.imageUrl ? (
                              <img
                                src={resolveMediaUrl(item.imageUrl)}
                                alt={item.province}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <MapPin size={28} style={{ color: accentColor }} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className="px-2 py-0.5 text-xs font-bold rounded-md text-white"
                                style={{ backgroundColor: accentColor }}
                              >
                                {item.province}
                              </span>
                              <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                                #{item.orderIndex}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                              Chef-lieu : <span className="font-bold">{item.chefLieu}</span>
                            </p>
                            <p
                              className="text-xs font-bold mt-1 truncate"
                              style={{ color: accentColor }}
                            >
                              {item.titleFr}
                            </p>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic truncate">
                              🇲🇬 {item.titleMg}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-stone-700 dark:text-stone-300 line-clamp-3 leading-relaxed">
                          {item.descriptionFr}
                        </p>

                        {/* Badges symboles et faits */}
                        <div className="flex items-center gap-2 pt-1">
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-md font-semibold border flex items-center gap-1 bg-white/70 dark:bg-stone-800/70"
                            style={{ borderColor: cardBorder, color: accentColor }}
                          >
                            <Shield size={12} />
                            <span>{symbolsCount} symbole{symbolsCount > 1 ? 's' : ''}</span>
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold border border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 flex items-center gap-1">
                            <Sparkles size={12} />
                            <span>{factsCount} fait{factsCount > 1 ? 's' : ''} clé{factsCount > 1 ? 's' : ''}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-black/5 dark:border-white/5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                              item.status === 'PUBLISHED'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-stone-400 text-white'
                            }`}
                          >
                            {item.status}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-stone-700 hover:text-emerald-700 hover:bg-white/80 dark:hover:bg-stone-800 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() =>
                                setDeletingItem({ id: item.id, name: `Province de ${item.province}` })
                              }
                              className="p-1.5 text-stone-700 hover:text-rose-600 hover:bg-white/80 dark:hover:bg-stone-800 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

            {/* ======================================================== */}
            {/* 4. ONGLET BILLETS MALGACHES */}
            {/* ======================================================== */}
            {activeTab === 'banknotes' &&
              (filteredBanknotes.length === 0 ? (
                <EmptyState
                  title="Aucun billet trouvé"
                  description="Ajoutez un billet de banque au musée numismatique."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBanknotes.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3"
                    >
                      <div className="relative h-36 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
                        {item.imageUrl ? (
                          <img
                            src={resolveMediaUrl(item.imageUrl)}
                            alt={item.titleFr}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <BanknoteIcon size={32} />
                          </div>
                        )}
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-md shadow-xs">
                          {item.valueAriary.toLocaleString()} Ariary
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                          <span className="font-mono">{item.series}</span>
                          <span>{item.period}</span>
                        </div>
                        <h4 className="font-bold text-stone-900 dark:text-white text-base">
                          {item.titleFr}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          🇲🇬 {item.titleMg}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 mt-1">
                          Recto : {item.obverseDescriptionFr}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: item.id, name: item.titleFr })}
                          className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* ======================================================== */}
            {/* 5. ONGLET NATURE & TRÉSORS */}
            {/* ======================================================== */}
            {activeTab === 'nature' &&
              (filteredNature.length === 0 ? (
                <EmptyState
                  title="Aucune espèce trouvée"
                  description="Ajoutez une espèce emblématique de Madagascar."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNature.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative h-44 bg-stone-100 dark:bg-stone-800">
                        {item.imageUrl ? (
                          <img
                            src={resolveMediaUrl(item.imageUrl)}
                            alt={item.nameFr}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <TreePine size={32} />
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded-md">
                          {item.type === 'FLORA' ? '🌿 Flore' : '🐾 Faune'}
                        </span>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-stone-900 dark:text-white text-base">
                            {item.nameFr}
                          </h4>
                          <span className="text-xs text-stone-500 font-medium">🇲🇬 {item.nameMg}</span>
                        </div>
                        <p className="text-xs italic font-serif text-emerald-700 dark:text-emerald-400">
                          {item.scientificName}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 mt-2">
                          {item.descriptionFr}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 p-3 border-t border-stone-100 dark:border-stone-800">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: item.id, name: item.nameFr })}
                          className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* ======================================================== */}
            {/* 6. ONGLET GRANDES DATES */}
            {/* ======================================================== */}
            {activeTab === 'dates' &&
              (filteredDates.length === 0 ? (
                <EmptyState
                  title="Aucune date trouvée"
                  description="Ajoutez une date clé de l'histoire malgache."
                />
              ) : (
                <div className="space-y-3">
                  {filteredDates.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-4"
                    >
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex flex-col items-center justify-center flex-shrink-0 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs">
                          <span className="text-lg leading-none">{item.year}</span>
                          <span className="text-xs font-normal mt-0.5">Année</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                              {item.exactDate}
                            </span>
                            <span className="text-xs text-stone-400 font-mono">#{item.orderIndex}</span>
                          </div>
                          <h4 className="font-bold text-stone-900 dark:text-white text-base">
                            {item.titleFr}
                          </h4>
                          <p className="text-xs text-stone-600 dark:text-stone-300 max-w-3xl">
                            {item.summaryFr}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: item.id, name: item.titleFr })}
                          className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* ======================================================== */}
            {/* 7. ONGLET THÉMATIQUES / RUBRIQUES */}
            {/* ======================================================== */}
            {activeTab === 'lessons' &&
              (filteredLessons.length === 0 ? (
                <EmptyState
                  title="Aucune thématique trouvée"
                  description="Ajoutez une thématique civique ou historique."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLessons.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative h-36 bg-stone-100 dark:bg-stone-800">
                        {item.imageUrl ? (
                          <img
                            src={resolveMediaUrl(item.imageUrl)}
                            alt={item.titleFr}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <Layers size={32} />
                          </div>
                        )}
                        <span
                          className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-xs font-semibold rounded-md ${
                            item.status ? 'bg-emerald-500 text-white' : 'bg-stone-500 text-white'
                          }`}
                        >
                          {item.status ? 'Disponible' : 'Désactivé'}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {item.category?.map((c) => (
                            <span
                              key={c}
                              className="text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                        <h4 className="font-bold text-stone-900 dark:text-white text-base">
                          {item.titleFr}
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          🇲🇬 {item.titleMg}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                          {item.descriptionFr}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 p-3 border-t border-stone-100 dark:border-stone-800">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingItem({ id: item.id, name: item.titleFr })}
                          className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODALE D'AJOUT / MODIFICATION AVEC FORMULAIRES ENRICHIS */}
        {/* ======================================================== */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={
            editingItem
              ? `Modifier : ${
                  formValues.name ||
                  formValues.province ||
                  formValues.titleFr ||
                  formValues.government ||
                  'Élément'
                }`
              : `Nouveau : ${
                  activeTab === 'presidents'
                    ? 'Président de la République'
                    : activeTab === 'emblems'
                    ? 'Emblème & Sceau d’État'
                    : activeTab === 'provinces'
                    ? 'Blason de Province'
                    : activeTab === 'banknotes'
                    ? 'Billet Malgache'
                    : activeTab === 'nature'
                    ? 'Espèce Naturelle'
                    : activeTab === 'dates'
                    ? 'Date Historique'
                    : 'Rubrique Thématique'
                }`
          }
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-4 max-h-[78vh] overflow-y-auto px-1">
            {/* Zone de Dropzone / Illustration */}
            <Field label="Illustration / Photo / Sceau officiel">
              <ImageUploadDropzone
                value={formValues.imageUrl}
                onChange={(url) => setFormValues((prev) => ({ ...prev, imageUrl: url }))}
                uploadEndpoint="/admin/history/upload-image"
              />
            </Field>

            {/* Statut & Ordre d'affichage communs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800">
              <Field label="Ordre d'affichage (index)">
                <Input
                  type="number"
                  value={formValues.orderIndex ?? 0}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, orderIndex: Number(e.target.value) }))
                  }
                />
              </Field>
              <Field label="Statut de publication">
                <select
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-medium"
                  value={formValues.status || 'PUBLISHED'}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, status: e.target.value as ContentStatus }))
                  }
                >
                  <option value="PUBLISHED">Publié (Visible dans l&apos;application)</option>
                  <option value="DRAFT">Brouillon (Non visible)</option>
                  <option value="ARCHIVED">Archivé</option>
                </select>
              </Field>
            </div>

            {/* ======================================================== */}
            {/* FORMULAIRE PRÉSIDENTS */}
            {/* ======================================================== */}
            {activeTab === 'presidents' && (
              <>
                {!editingItem && (
                  <Field label="Identifiant unique (slug, ex: tsiranana)" required>
                    <Input
                      value={formValues.id || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                      placeholder="tsiranana, ramanantsoa, ratsiraka..."
                      required
                    />
                  </Field>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nom complet du Président" required>
                    <Input
                      value={formValues.name || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Philibert Tsiranana"
                      required
                    />
                  </Field>
                  <Field label="Mandat / Période (ex: 1959 - 1972)" required>
                    <Input
                      value={formValues.period || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, period: e.target.value }))}
                      placeholder="1959 - 1972"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="République (FR)" required>
                    <Input
                      value={formValues.republic || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, republic: e.target.value }))}
                      placeholder="1ère République"
                      required
                    />
                  </Field>
                  <Field label="République (MG)" required>
                    <Input
                      value={formValues.republicMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, republicMg: e.target.value }))
                      }
                      placeholder="Repoblika Voalohany"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Titre honorifique (FR)" required>
                    <Input
                      value={formValues.titleFr || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                      placeholder="Père de l'Indépendance"
                      required
                    />
                  </Field>
                  <Field label="Titre honorifique (MG)" required>
                    <Input
                      value={formValues.titleMg || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                      placeholder="Rain'ny Fahaleovantena"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <Field label="Couleur Badge">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formValues.badgeColor || '#2A6B3D'}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, badgeColor: e.target.value }))
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border border-stone-200 dark:border-stone-700"
                        />
                        <Input
                          value={formValues.badgeColor || '#2A6B3D'}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, badgeColor: e.target.value }))
                          }
                          className="font-mono text-xs"
                        />
                      </div>
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Citation célèbre (FR)">
                      <Input
                        value={formValues.quoteFr || ''}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, quoteFr: e.target.value }))}
                        placeholder="« La paix est le premier capital d'une nation. »"
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Citation célèbre (MG)">
                  <Input
                    value={formValues.quoteMg || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, quoteMg: e.target.value }))}
                    placeholder="« Ny fandriampahalemana no fototry ny fampandrosoana. »"
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Biographie détaillée (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formValues.bioFr || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, bioFr: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Biographie détaillée (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formValues.bioMg || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, bioMg: e.target.value }))}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Grandes Réalisations (FR - 1 ligne par réalisation)">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                      rows={3}
                      value={formValues.achievementsFrRaw ?? ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, achievementsFrRaw: e.target.value }))
                      }
                      placeholder="Proclamation de l'Indépendance (26 Juin 1960)&#10;Création des universités provinciales"
                    />
                  </Field>
                  <Field label="Grandes Réalisations (MG - 1 ligne par réalisation)">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                      rows={3}
                      value={formValues.achievementsMgRaw ?? ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, achievementsMgRaw: e.target.value }))
                      }
                      placeholder="Fanambarana ny Fahaleovantena (26 Jona 1960)&#10;Fananganana oniversite sy sekoly"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* FORMULAIRE EMBLÈMES & SCEAUX D'ÉTAT */}
            {/* ======================================================== */}
            {activeTab === 'emblems' && (
              <>
                {!editingItem && (
                  <Field label="Identifiant (optionnel, slug)">
                    <Input
                      value={formValues.id || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                      placeholder="embleme-quatrieme-republique"
                    />
                  </Field>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Période historique (ex: 2010 - Présent)" required>
                    <Input
                      value={formValues.period || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, period: e.target.value }))}
                      placeholder="1960 - 1972 ou 2010 - Présent"
                      required
                    />
                  </Field>
                  <Field label="Gouvernement / Régime" required>
                    <Input
                      value={formValues.government || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, government: e.target.value }))
                      }
                      placeholder="Quatrième République de Madagascar"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Description du sceau (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formValues.descriptionFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, descriptionFr: e.target.value }))
                      }
                      placeholder="Sceau officiel : disque d'argent avec le Ravinala au centre..."
                      required
                    />
                  </Field>
                  <Field label="Description du sceau (MG)">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formValues.descriptionMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, descriptionMg: e.target.value }))
                      }
                      placeholder="Tombo-kase ofisialy : diska volafotsy ahitana ny Ravinala..."
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Notes historiques & Contexte (FR)">
                    <Input
                      value={formValues.notesFr || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, notesFr: e.target.value }))}
                      placeholder="Adopté lors de la Constitution de 2010"
                    />
                  </Field>
                  <Field label="Notes historiques & Contexte (MG)">
                    <Input
                      value={formValues.notesMg || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, notesMg: e.target.value }))}
                      placeholder="Nolaniana tamin'ny Lalàmpanorenana 2010"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* FORMULAIRE 6 PROVINCES & BLASONS */}
            {/* ======================================================== */}
            {activeTab === 'provinces' && (
              <>
                {!editingItem && (
                  <Field label="Identifiant unique (slug, ex: province-antananarivo)" required>
                    <Input
                      value={formValues.id || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                      placeholder="province-antananarivo"
                      required
                    />
                  </Field>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nom de la Province" required>
                    <Input
                      value={formValues.province || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, province: e.target.value }))}
                      placeholder="Antananarivo, Fianarantsoa..."
                      required
                    />
                  </Field>
                  <Field label="Chef-lieu de Province" required>
                    <Input
                      value={formValues.chefLieu || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, chefLieu: e.target.value }))}
                      placeholder="Antananarivo-Renivohitra"
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Titre honorifique (FR)" required>
                    <Input
                      value={formValues.titleFr || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                      placeholder="Le Cœur de l'Imerina"
                      required
                    />
                  </Field>
                  <Field label="Titre honorifique (MG)" required>
                    <Input
                      value={formValues.titleMg || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                      placeholder="Imerina Enin-toko"
                      required
                    />
                  </Field>
                </div>

                {/* Couleurs héraldiques et palettes */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette size={14} className="text-emerald-600" />
                      <span>Palette héraldique de la Province</span>
                    </span>
                    <span className="text-[11px] text-stone-500">Harmonie visuelle</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleApplyColorPreset(p)}
                        className="px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 border transition-transform hover:scale-105"
                        style={{ backgroundColor: p.bg, borderColor: p.border, color: p.hex }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <Field label="Couleur principale (Hex)" required>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formValues.color || '#2B6CB0'}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, color: e.target.value }))
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer border"
                        />
                        <Input
                          value={formValues.color || '#2B6CB0'}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, color: e.target.value }))
                          }
                          required
                          className="font-mono text-xs"
                        />
                      </div>
                    </Field>
                    <Field label="Fond pastel clair" required>
                      <Input
                        value={formValues.bgLight || '#EBF8FF'}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, bgLight: e.target.value }))
                        }
                        required
                        className="font-mono text-xs"
                      />
                    </Field>
                    <Field label="Bordure claire" required>
                      <Input
                        value={formValues.borderLight || '#BEE3F8'}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, borderLight: e.target.value }))
                        }
                        required
                        className="font-mono text-xs"
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Description historique & culturelle (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formValues.descriptionFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, descriptionFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Description historique & culturelle (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formValues.descriptionMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, descriptionMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>

                {/* Constructeur dynamique de symboles héraldiques */}
                <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={14} className="text-emerald-600" />
                      <span>Symboles armoriaux & éléments du blason</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSymbol}
                      className="text-xs px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Plus size={14} />
                      <span>Ajouter un symbole</span>
                    </button>
                  </div>

                  {(!formValues.symbols || formValues.symbols.length === 0) && (
                    <p className="text-xs text-stone-400 italic">
                      Aucun symbole défini. Cliquez sur &quot;Ajouter un symbole&quot;.
                    </p>
                  )}

                  {Array.isArray(formValues.symbols) &&
                    formValues.symbols.map((sym: ProvinceSymbol, sIdx: number) => (
                      <div
                        key={sIdx}
                        className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2 relative"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-stone-100 dark:border-stone-800">
                          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                            Symbole #{sIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSymbol(sIdx)}
                            className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                            title="Supprimer ce symbole"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            placeholder="Élément / Symbole (FR, ex: Le Rova)"
                            value={sym.labelFr || ''}
                            onChange={(e) => handleUpdateSymbol(sIdx, 'labelFr', e.target.value)}
                          />
                          <Input
                            placeholder="Élément / Symbole (MG, ex: Lapan'i Manjakamiadana)"
                            value={sym.labelMg || ''}
                            onChange={(e) => handleUpdateSymbol(sIdx, 'labelMg', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            placeholder="Signification (FR, ex: Souveraineté nationale)"
                            value={sym.meaningFr || ''}
                            onChange={(e) => handleUpdateSymbol(sIdx, 'meaningFr', e.target.value)}
                          />
                          <Input
                            placeholder="Signification (MG, ex: Fiandrianam-pirenena)"
                            value={sym.meaningMg || ''}
                            onChange={(e) => handleUpdateSymbol(sIdx, 'meaningMg', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                {/* Faits marquants bilingues */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Faits marquants (FR - 1 ligne par fait)">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                      rows={3}
                      value={formValues.keyFactsFrRaw ?? ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, keyFactsFrRaw: e.target.value }))
                      }
                      placeholder="Altitude moyenne : 1 280 m&#10;Site patrimonial : Rova d'Ambohimanga"
                    />
                  </Field>
                  <Field label="Faits marquants (MG - 1 ligne par fait)">
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                      rows={3}
                      value={formValues.keyFactsMgRaw ?? ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, keyFactsMgRaw: e.target.value }))
                      }
                      placeholder="Haavo ambonin'ny ranomasina : 1 280 m&#10;Rovan'Ambohimanga lova maneran-tany"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* FORMULAIRE BILLETS MALGACHES */}
            {/* ======================================================== */}
            {activeTab === 'banknotes' && (
              <>
                {!editingItem && (
                  <Field label="Identifiant (slug, ex: billet-20000)" required>
                    <Input
                      value={formValues.id || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                      required
                    />
                  </Field>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Valeur en Ariary" required>
                    <Input
                      type="number"
                      value={formValues.valueAriary || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, valueAriary: Number(e.target.value) }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Valeur en FMG" required>
                    <Input
                      type="number"
                      value={formValues.valueFmg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, valueFmg: Number(e.target.value) }))
                      }
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Titre (FR)" required>
                    <Input
                      value={formValues.titleFr || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Titre (MG)" required>
                    <Input
                      value={formValues.titleMg || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Série (ex: SERIE_2017)" required>
                    <Input
                      value={formValues.series || 'SERIE_2017'}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, series: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Période (ex: 2017 - Présent)" required>
                    <Input
                      value={formValues.period || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, period: e.target.value }))}
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Libellé Série (FR)" required>
                    <Input
                      value={formValues.seriesLabelFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, seriesLabelFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Libellé Série (MG)" required>
                    <Input
                      value={formValues.seriesLabelMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, seriesLabelMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Couleur Dominante Claire" required>
                    <Input
                      value={formValues.colorLight || '#2E7D32'}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, colorLight: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Couleur Dominante Sombre" required>
                    <Input
                      value={formValues.colorDark || '#1B5E20'}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, colorDark: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Description Recto (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.obverseDescriptionFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, obverseDescriptionFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Description Recto (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.obverseDescriptionMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, obverseDescriptionMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Description Verso (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.reverseDescriptionFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, reverseDescriptionFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Description Verso (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.reverseDescriptionMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, reverseDescriptionMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Symbolisme & Portée (FR)" required>
                    <Input
                      value={formValues.symbolismFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, symbolismFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Symbolisme & Portée (MG)" required>
                    <Input
                      value={formValues.symbolismMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, symbolismMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>

                <Field label="Éléments de sécurité (1 par ligne)">
                  <textarea
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                    rows={2}
                    value={formValues.securityFeaturesRaw ?? ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, securityFeaturesRaw: e.target.value }))
                    }
                    placeholder="Fil de sécurité à fenêtre scintillante&#10;Motif tactile pour malvoyants"
                  />
                </Field>
              </>
            )}

            {/* ======================================================== */}
            {/* FORMULAIRE NATURE & TRÉSORS */}
            {/* ======================================================== */}
            {activeTab === 'nature' && (
              <>
                {!editingItem && (
                  <Field label="Identifiant (slug, ex: ravinala)" required>
                    <Input
                      value={formValues.id || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                      required
                    />
                  </Field>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nom commun (FR)" required>
                    <Input
                      value={formValues.nameFr || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, nameFr: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Nom en malgache" required>
                    <Input
                      value={formValues.nameMg || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, nameMg: e.target.value }))}
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Nom scientifique" required>
                    <Input
                      value={formValues.scientificName || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, scientificName: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Règne (Faune ou Flore)" required>
                    <select
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      value={formValues.type || 'FLORA'}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="FLORA">🌿 Flore (Zavamaniry)</option>
                      <option value="FAUNA">🐾 Faune (Biby)</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Statut de conservation (FR)" required>
                    <Input
                      value={formValues.statusFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, statusFr: e.target.value }))
                      }
                      placeholder="Endémique, Vulnérable, Symbole national..."
                      required
                    />
                  </Field>
                  <Field label="Statut de conservation (MG)" required>
                    <Input
                      value={formValues.statusMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, statusMg: e.target.value }))
                      }
                      placeholder="Harena voaaro manokana..."
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Description (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.descriptionFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, descriptionFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Description (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.descriptionMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, descriptionMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Rôle culturel & symbolique (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.culturalRoleFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, culturalRoleFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Rôle culturel & symbolique (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.culturalRoleMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, culturalRoleMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* FORMULAIRE GRANDES DATES */}
            {/* ======================================================== */}
            {activeTab === 'dates' && (
              <>
                {!editingItem && (
                  <Field label="Identifiant (slug, ex: date-1960-06-26)" required>
                    <Input
                      value={formValues.id || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                      required
                    />
                  </Field>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Année (ex: 1960)" required>
                    <Input
                      value={formValues.year || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, year: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Date exacte (ex: 26 Juin 1960)" required>
                    <Input
                      value={formValues.exactDate || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, exactDate: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Époque / Période" required>
                    <Input
                      value={formValues.era || 'Époque contemporaine'}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, era: e.target.value }))}
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Titre de l'événement (FR)" required>
                    <Input
                      value={formValues.titleFr || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Titre de l'événement (MG)" required>
                    <Input
                      value={formValues.titleMg || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Résumé historique (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formValues.summaryFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, summaryFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Résumé historique (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={3}
                      value={formValues.summaryMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, summaryMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Impact & Portée historique (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.impactFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, impactFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Impact & Portée historique (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.impactMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, impactMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* FORMULAIRE RUBRIQUES & LEÇONS */}
            {/* ======================================================== */}
            {activeTab === 'lessons' && (
              <>
                {!editingItem && (
                  <Field label="Identifiant (slug, ex: billets-monnaies)" required>
                    <Input
                      value={formValues.id || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, id: e.target.value }))}
                      required
                    />
                  </Field>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Titre (FR)" required>
                    <Input
                      value={formValues.titleFr || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleFr: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Titre (MG)" required>
                    <Input
                      value={formValues.titleMg || ''}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, titleMg: e.target.value }))}
                      required
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Description (FR)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.descriptionFr || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, descriptionFr: e.target.value }))
                      }
                      required
                    />
                  </Field>
                  <Field label="Description (MG)" required>
                    <textarea
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      value={formValues.descriptionMg || ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, descriptionMg: e.target.value }))
                      }
                      required
                    />
                  </Field>
                </div>
                <Field label="Catégories (séparées par virgule, ex: histoire, politique, republique)">
                  <Input
                    value={formValues.categoryRaw || ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, categoryRaw: e.target.value }))
                    }
                  />
                </Field>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                    <input
                      type="checkbox"
                      checked={formValues.lessonStatus ?? true}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, lessonStatus: e.target.checked }))
                      }
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Thématique active et disponible dans l&apos;application</span>
                  </label>
                </div>
              </>
            )}

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>
                  {isSubmitting
                    ? 'Enregistrement en cours...'
                    : editingItem
                    ? 'Mettre à jour'
                    : 'Enregistrer'}
                </span>
              </button>
            </div>
          </form>
        </Modal>

        {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
        <ConfirmModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleConfirmDelete}
          title="Confirmer la suppression"
          description={`Êtes-vous sûr de vouloir supprimer définitivement "${deletingItem?.name}" ? Cette action est irréversible.`}
          confirmText={isSubmitting ? 'Suppression...' : 'Supprimer définitivement'}
          isLoading={isSubmitting}
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
