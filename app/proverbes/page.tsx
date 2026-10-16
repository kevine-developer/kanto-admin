'use client';

import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '@/components/layout/AdminShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Pagination, ConfirmModal } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { fetchApi } from '@/lib/api-client';
import {
  ScrollText,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Bookmark,
  X,
  Loader2,
  Search,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface MalagasyItem {
  id: string;
  slug: string;
  malagasy: string;
  french: string;
  meaning: string;
  example?: string | null;
  category: 'PROVERBE' | 'EXPRESSION' | 'DICTON';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: string;
  isFeatured: boolean;
  viewCount: number;
  likesCount: number;
  shareCount: number;
  reportCount: number;
  audioUrl?: string | null;
  themes?: Array<{
    theme: {
      nameMg: string;
      nameFr: string;
      color?: string;
    };
  }>;
  dialectVariants?: Array<{
    id: string;
    dialectName: string;
    text: string;
    notes?: string | null;
  }>;
}

const inputCls =
  'w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition placeholder:text-[var(--text-subtle)]';

export default function ProverbesAdminPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<MalagasyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [difficulty, setDifficulty] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<MalagasyItem | null>(null);

  // Modal Création / Édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Confirmation Suppression
  const [deletingItem, setDeletingItem] = useState<MalagasyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formItem, setFormItem] = useState({
    malagasy: '',
    french: '',
    meaning: '',
    example: '',
    category: 'PROVERBE' as 'PROVERBE' | 'EXPRESSION' | 'DICTON',
    difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD',
    isFeatured: false,
    dialectName: '',
    dialectText: '',
  });

  // Modal Import / Export CSV & Excel
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importResult, setImportResult] = useState<{
    totalReceived: number;
    importedCount: number;
    duplicatesSkipped: number;
    errorsCount: number;
    errors: Array<{ row: number; text: string; reason: string }>;
  } | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (category !== 'ALL') params.append('category', category);
      if (difficulty !== 'ALL') params.append('difficulty', difficulty);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetchApi<{
        data: MalagasyItem[];
        meta: { total: number; totalPages: number };
      }>(`/items?${params.toString()}`);

      setItems(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalCount(res.meta?.total || 0);
    } catch (err: unknown) {
      console.error('Erreur chargement proverbes :', err);
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des proverbes';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, category, difficulty, search, toast]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormItem({
      malagasy: '',
      french: '',
      meaning: '',
      example: '',
      category: 'PROVERBE',
      difficulty: 'EASY',
      isFeatured: false,
      dialectName: '',
      dialectText: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MalagasyItem) => {
    setEditingId(item.id);
    setFormItem({
      malagasy: item.malagasy,
      french: item.french,
      meaning: item.meaning,
      example: item.example || '',
      category: item.category,
      difficulty: item.difficulty,
      isFeatured: item.isFeatured,
      dialectName: item.dialectVariants?.[0]?.dialectName || '',
      dialectText: item.dialectVariants?.[0]?.text || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formItem.malagasy.trim() || !formItem.french.trim() || !formItem.meaning.trim()) {
      toast.error('Veuillez renseigner le texte en malgache, la traduction et le sens.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        malagasy: formItem.malagasy.trim(),
        french: formItem.french.trim(),
        meaning: formItem.meaning.trim(),
        example: formItem.example.trim() || undefined,
        category: formItem.category,
        difficulty: formItem.difficulty,
        isFeatured: formItem.isFeatured,
        dialectName: formItem.dialectName.trim() || undefined,
        dialectText: formItem.dialectText.trim() || undefined,
      };

      if (editingId) {
        await fetchApi(`/items/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Proverbe mis à jour avec succès !');
      } else {
        await fetchApi('/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Nouveau proverbe ajouté avec succès !');
      }

      setIsModalOpen(false);
      void loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’enregistrement';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      await fetchApi(`/items/${deletingItem.id}`, {
        method: 'DELETE',
      });

      toast.success('Proverbe supprimé avec succès.');
      setDeletingItem(null);
      void loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async (item: MalagasyItem) => {
    try {
      const updated = !item.isFeatured;
      await fetchApi(`/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isFeatured: updated }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isFeatured: updated } : i))
      );
      toast.success(updated ? 'Mis en avant !' : 'Retiré de la mise en avant');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise en avant';
      toast.error(msg);
    }
  };

  // Exporter en CSV
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (category !== 'ALL') params.append('category', category);
      if (difficulty !== 'ALL') params.append('difficulty', difficulty);

      const res = await fetchApi<string>(`/items/export-csv?${params.toString()}`);
      if (!res) {
        toast.error('Aucune donnée à exporter');
        return;
      }
      const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `proverbes-kanto-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Fichier CSV exporté avec succès !');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’export CSV';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  // Télécharger le modèle de CSV type (Template)
  const downloadTemplateCsv = () => {
    const templateContent =
      '\uFEFFMalagasy,Traduction Francaise,Signification,Exemple,Categorie,Difficulte,Dialecte,Variante Dialectale\r\n' +
      '"Ny fihavanana toy ny ketsa, raha fafy tsy maniry fa raha afindra vao vanona","La fraternité est comme de jeunes plants de riz...","La vraie fraternité se cultive et se consolide par les actes d entraide.","Rehefa misy fahoriana...","PROVERBE","EASY","",""\r\n' +
      '"Aza manao lamban-tsomonda","Ne fais pas comme le vêtement de deuil porté à l envers","Ne sois pas hypocrite dans tes attitudes et paroles.","","PROVERBE","MEDIUM","",""';

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele-import-proverbes-kanto.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Analyseur CSV côté client avec support des guillemets
  const parseCsvText = (text: string) => {
    const firstLine = text.split(/\r\n|\n|\r/)[0] || '';
    const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    if (rows.length < 2) return [];

    const rawHeaders = rows[0].map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    const mappedItems: any[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const record: Record<string, string> = {};
      for (let c = 0; c < rawHeaders.length; c++) {
        record[rawHeaders[c]] = row[c] || '';
      }

      const malagasy =
        record['malagasy'] || record['texte'] || record['proverbe'] || record['textemalagasy'] || '';
      const french =
        record['traductionfrancaise'] || record['traduction'] || record['francais'] || record['french'] || '';
      const meaning =
        record['signification'] || record['sens'] || record['explication'] || record['meaning'] || '';
      const example = record['exemple'] || record['example'] || '';
      const catRaw = (record['categorie'] || record['category'] || 'PROVERBE').toUpperCase();
      const category = ['PROVERBE', 'EXPRESSION', 'DICTON'].includes(catRaw) ? catRaw : 'PROVERBE';
      const diffRaw = (record['difficulte'] || record['difficulty'] || 'EASY').toUpperCase();
      const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(diffRaw) ? diffRaw : 'EASY';
      const dialectName = record['dialecte'] || record['dialectname'] || '';
      const dialectText = record['variante'] || record['variantedialectale'] || record['dialecttext'] || '';

      if (malagasy || french || meaning) {
        mappedItems.push({
          malagasy,
          french,
          meaning,
          example,
          category,
          difficulty,
          dialectName,
          dialectText,
          isValid: Boolean(malagasy.trim() && french.trim() && meaning.trim()),
        });
      }
    }
    return mappedItems;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setIsParsing(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const items = parseCsvText(text);
        setParsedRows(items);
      } catch (err) {
        console.error('Erreur lecture CSV', err);
        toast.error('Impossible de lire le fichier CSV.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('Aucune ligne valide à importer');
      return;
    }

    try {
      setIsImporting(true);
      const res = await fetchApi<{
        totalReceived: number;
        importedCount: number;
        duplicatesSkipped: number;
        errorsCount: number;
        errors: Array<{ row: number; text: string; reason: string }>;
      }>('/items/import-csv', {
        method: 'POST',
        body: JSON.stringify({
          items: validRows,
          skipDuplicates,
        }),
      });

      setImportResult(res);
      toast.success(`${res.importedCount} proverbe(s) importé(s) avec succès !`);
      void loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’importation';
      toast.error(msg);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminShell>
      <div className="w-full space-y-4 max-w-6xl mx-auto pb-12">
        {/* En-tête standardisé */}
        <PageHeader
          title="Proverbes & Fady (Ohabolana)"
          description="Corpus des traditions orales et sagesses ancestrales de Madagascar."
          icon={ScrollText}
          badge={
            <span className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs">
              {totalCount} proverbe{totalCount !== 1 ? 's' : ''}
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadItems()}
                disabled={isLoading}
                className="p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition cursor-pointer shadow-xs disabled:opacity-50"
                title="Actualiser"
              >
                <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={handleExportCsv}
                disabled={isExporting}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--card-hover)] transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs disabled:opacity-50"
                title="Exporter la sélection en CSV (UTF-8 pour Excel)"
              >
                {isExporting ? (
                  <Loader2 size={13} className="animate-spin text-[var(--accent)]" />
                ) : (
                  <Download size={13} />
                )}
                <span className="hidden sm:inline">Exporter</span>
              </button>

              <button
                onClick={() => {
                  setImportFile(null);
                  setParsedRows([]);
                  setImportResult(null);
                  setIsImportModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--card-hover)] transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                title="Importer des proverbes par lot (CSV / Excel)"
              >
                <Upload size={13} />
                <span className="hidden sm:inline">Importer</span>
              </button>

              <button
                onClick={openCreateModal}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              >
                <Plus size={14} />
                <span>Nouveau proverbe</span>
              </button>
            </div>
          }
        />

        {/* Barre d'outils (Recherche + Filtres) */}
        <div className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Recherche */}
          <div className="relative flex-1">
            <label htmlFor="search-proverbes" className="sr-only">
              Rechercher par texte malgache, traduction ou sens
            </label>
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
            <input
              id="search-proverbes"
              name="search"
              type="search"
              placeholder="Rechercher par texte malgache, traduction ou sens..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--accent)]"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--foreground)] p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pastilles Catégories */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)]">
              {[
                { label: 'Tous', value: 'ALL' },
                { label: 'Ohabolana', value: 'PROVERBE' },
                { label: 'Expressions', value: 'EXPRESSION' },
                { label: 'Dictons & Fady', value: 'DICTON' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setCategory(tab.value);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    category === tab.value
                      ? 'bg-[var(--card)] text-[var(--foreground)] font-semibold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Difficulté */}
            <label htmlFor="filter-proverbes-difficulty" className="sr-only">
              Filtrer par niveau de difficulté
            </label>
            <select
              id="filter-proverbes-difficulty"
              name="difficultyFilter"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 text-xs rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] font-medium text-[var(--foreground)] cursor-pointer focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="ALL">Difficulté : Toutes</option>
              <option value="EASY">Tsotra (Courant)</option>
              <option value="MEDIUM">Antoniny (Moyen)</option>
              <option value="HARD">Sarotra (Littéraire)</option>
            </select>
          </div>
        </div>

        {/* Liste des Proverbes */}
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              <span className="text-xs text-[var(--text-muted)]">Chargement des proverbes...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              Aucune sagesse ne correspond à vos critères de recherche.
            </div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col md:flex-row items-start justify-between gap-3 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)]">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)]">
                        {item.difficulty === 'EASY'
                          ? 'Courant'
                          : item.difficulty === 'MEDIUM'
                          ? 'Intermédiaire'
                          : 'Littéraire'}
                      </span>
                      {item.isFeatured && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Bookmark size={10} fill="currentColor" />
                          <span>À la une</span>
                        </span>
                      )}
                      {item.dialectVariants && item.dialectVariants.length > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--input-border)] flex items-center gap-1">
                          <MapPin size={10} />
                          <span>{item.dialectVariants.length} variante(s)</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-xs font-semibold text-[var(--foreground)] leading-snug">
                        « {item.malagasy} »
                      </h3>
                      <div className="text-[11px] text-[var(--text-muted)] italic leading-relaxed">
                        {item.french}
                      </div>
                    </div>

                    <div className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed pt-0.5">
                      {item.meaning}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleToggleFeatured(item)}
                      title={item.isFeatured ? 'Retirer de la Une' : 'Mettre à la Une'}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        item.isFeatured
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'border-[var(--card-border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-amber-500'
                      }`}
                    >
                      <Bookmark size={13} fill={item.isFeatured ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={() => setSelectedItem(item)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--foreground)] text-xs font-medium transition cursor-pointer shadow-xs"
                    >
                      Détails
                    </button>

                    <button
                      onClick={() => openEditModal(item)}
                      title="Modifier ce proverbe"
                      className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--accent)] transition cursor-pointer"
                    >
                      <Edit size={13} />
                    </button>

                    <button
                      onClick={() => setDeletingItem(item)}
                      title="Supprimer ce proverbe"
                      className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="p-3 border-t border-[var(--card-border)] bg-[var(--input-bg)]">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={15}
              onPageChange={setPage}
              isLoading={isLoading}
              itemLabel="proverbes"
            />
          </div>
        </div>

        {/* Modal Confirmation de Suppression */}
        <ConfirmModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={executeDelete}
          title="Supprimer le proverbe"
          description={`Êtes-vous sûr de vouloir supprimer définitivement le proverbe « ${deletingItem?.malagasy} » ? Cette action est irréversible.`}
          confirmText="Supprimer"
          isLoading={isDeleting}
          variant="danger"
        />

        {/* Modal Création / Édition Proverbe */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 animate-in fade-in duration-150">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-2xl max-w-lg w-full max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                    {editingId ? 'Modifier la sagesse' : 'Ajouter une nouvelle sagesse'}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {editingId ? 'Mise à jour du proverbe ou dicton' : 'Enregistrer une sagesse ancestrale'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="proverbe-category" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Catégorie *
                    </label>
                    <select
                      id="proverbe-category"
                      name="category"
                      value={formItem.category}
                      onChange={(e) =>
                        setFormItem({ ...formItem, category: e.target.value as MalagasyItem['category'] })
                      }
                      className={inputCls}
                    >
                      <option value="PROVERBE">Ohabolana (Proverbe)</option>
                      <option value="EXPRESSION">Oha-pitenenana (Expression)</option>
                      <option value="DICTON">Fomba fiteny / Fady (Dicton)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="proverbe-difficulty" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Niveau de difficulté *
                    </label>
                    <select
                      id="proverbe-difficulty"
                      name="difficulty"
                      value={formItem.difficulty}
                      onChange={(e) =>
                        setFormItem({ ...formItem, difficulty: e.target.value as MalagasyItem['difficulty'] })
                      }
                      className={inputCls}
                    >
                      <option value="EASY">Tsotra (Courant / Populaire)</option>
                      <option value="MEDIUM">Antoniny (Intermédiaire)</option>
                      <option value="HARD">Sarotra (Littéraire / Ancien)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="proverbe-malagasy" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Texte en Malagasy *
                  </label>
                  <textarea
                    id="proverbe-malagasy"
                    name="malagasy"
                    rows={2}
                    value={formItem.malagasy}
                    onChange={(e) => setFormItem({ ...formItem, malagasy: e.target.value })}
                    placeholder="Ex: Ny fihavanana toy ny ketsa..."
                    required
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="proverbe-french" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Traduction en Français *
                  </label>
                  <textarea
                    id="proverbe-french"
                    name="french"
                    rows={2}
                    value={formItem.french}
                    onChange={(e) => setFormItem({ ...formItem, french: e.target.value })}
                    placeholder="Ex: La parenté est comme de jeunes plants de riz..."
                    required
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="proverbe-meaning" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Sens culturel &amp; Explication *
                  </label>
                  <textarea
                    id="proverbe-meaning"
                    name="meaning"
                    rows={3}
                    value={formItem.meaning}
                    onChange={(e) => setFormItem({ ...formItem, meaning: e.target.value })}
                    placeholder="Explication du contexte, de la morale et des enseignements traditionnels..."
                    required
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label htmlFor="proverbe-example" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Exemple d&apos;usage (optionnel)
                    </label>
                    <input
                      id="proverbe-example"
                      name="example"
                      type="text"
                      value={formItem.example}
                      onChange={(e) => setFormItem({ ...formItem, example: e.target.value })}
                      placeholder="Ex: Ampiasaina rehefa..."
                      className={inputCls}
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label htmlFor="proverbe-is-featured" className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        id="proverbe-is-featured"
                        name="isFeatured"
                        type="checkbox"
                        checked={formItem.isFeatured}
                        onChange={(e) => setFormItem({ ...formItem, isFeatured: e.target.checked })}
                        className="w-4 h-4 rounded text-[var(--accent)]"
                      />
                      <span className="font-semibold text-xs text-[var(--foreground)]">
                        Mettre en avant sur l&apos;accueil
                      </span>
                    </label>
                  </div>
                </div>

                {/* Variante dialectale */}
                <div className="pt-3 border-t border-[var(--card-border)] space-y-2">
                  <div className="text-[11px] font-semibold uppercase text-[var(--text-muted)] font-mono">
                    Variante dialectale régionale (optionnel)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      id="proverbe-dialect-name"
                      name="dialectName"
                      type="text"
                      aria-label="Nom du dialecte"
                      value={formItem.dialectName}
                      onChange={(e) => setFormItem({ ...formItem, dialectName: e.target.value })}
                      placeholder="Dialecte (ex: Betsimisaraka)"
                      className={inputCls}
                    />
                    <input
                      id="proverbe-dialect-text"
                      name="dialectText"
                      type="text"
                      aria-label="Texte dans le dialecte"
                      value={formItem.dialectText}
                      onChange={(e) => setFormItem({ ...formItem, dialectText: e.target.value })}
                      placeholder="Texte dans le dialecte"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-[var(--foreground)] transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Enregistrer' : 'Publier'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Détails Proverbe */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 animate-in fade-in duration-150">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-2xl max-w-lg w-full max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--foreground)]">Détails de la sagesse</span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Texte Malagasy
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                    « {selectedItem.malagasy} »
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Traduction Française
                  </div>
                  <div className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                    « {selectedItem.french} »
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                    Sens &amp; Enseignement
                  </div>
                  <div className="text-xs text-[var(--foreground)] leading-relaxed">
                    {selectedItem.meaning}
                  </div>
                </div>

                {selectedItem.example && (
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                      Exemple d&apos;usage
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {selectedItem.example}
                    </div>
                  </div>
                )}

                {selectedItem.dialectVariants && selectedItem.dialectVariants.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                      Variantes régionales
                    </div>
                    <div className="space-y-1.5">
                      {selectedItem.dialectVariants.map((v) => (
                        <div key={v.id} className="p-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] text-xs">
                          <div className="font-semibold text-[var(--accent)] text-[11px]">{v.dialectName}</div>
                          <div className="text-xs mt-0.5">« {v.text} »</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-[var(--card-border)] bg-[var(--input-bg)] flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-xs font-semibold text-[var(--foreground)] transition cursor-pointer shadow-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Import CSV & Excel */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 pt-8 md:pt-12 animate-in fade-in duration-150">
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-2xl max-w-xl w-full max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-[var(--accent)]" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    Importation par lot (CSV / Excel)
                  </span>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-[var(--card-hover)] text-[var(--text-muted)] transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Guide & Template */}
                <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[var(--foreground)]">Modèle CSV standard</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      Colonnes requises : <code>Malagasy</code>, <code>Traduction Francaise</code>, <code>Signification</code>.
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplateCsv}
                    className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] font-medium text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                  >
                    <Download size={12} />
                    <span>Télécharger modèle</span>
                  </button>
                </div>

                {/* Sélecteur de fichier */}
                <div>
                  <label htmlFor="csv-file-input" className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Sélectionner un fichier CSV (*.csv)
                  </label>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="w-full text-xs text-[var(--text-muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--accent)] file:text-white hover:file:opacity-90 cursor-pointer"
                  />
                </div>

                {/* Option Doublons */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--accent)]"
                  />
                  <span className="text-xs text-[var(--foreground)]">
                    Ignorer automatiquement les proverbes déjà existants en base
                  </span>
                </label>

                {/* État de chargement du parsing */}
                {isParsing && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Loader2 size={13} className="animate-spin text-[var(--accent)]" />
                    <span>Analyse des lignes du fichier en cours...</span>
                  </div>
                )}

                {/* Aperçu des lignes détectées */}
                {parsedRows.length > 0 && !importResult && (
                  <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--foreground)]">
                        {parsedRows.filter((r) => r.isValid).length} ligne(s) valide(s) détectée(s)
                      </span>
                      {parsedRows.some((r) => !r.isValid) && (
                        <span className="text-amber-500 font-medium">
                          {parsedRows.filter((r) => !r.isValid).length} ligne(s) incomplète(s) ignorée(s)
                        </span>
                      )}
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] p-2 space-y-1.5">
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-[11px] border ${
                            row.isValid
                              ? 'border-[var(--card-border)] bg-[var(--card)]'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          <div className="font-semibold">« {row.malagasy || '(Texte manquant)'} »</div>
                          <div className="text-[var(--text-muted)] truncate">{row.french}</div>
                        </div>
                      ))}
                      {parsedRows.length > 5 && (
                        <div className="text-[10px] text-center text-[var(--text-muted)] pt-1">
                          + {parsedRows.length - 5} autre(s) proverbe(s)...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rapport post-importation */}
                {importResult && (
                  <div className="p-3.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
                      <CheckCircle2 size={15} />
                      <span>Importation terminée avec succès !</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
                        <div className="text-lg font-bold text-emerald-600">{importResult.importedCount}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Importés</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
                        <div className="text-lg font-bold text-amber-500">{importResult.duplicatesSkipped}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Doublons évités</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
                        <div className="text-lg font-bold text-red-500">{importResult.errorsCount}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">Erreurs</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-[var(--card-border)] bg-[var(--input-bg)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--card-border)] hover:bg-[var(--card-hover)] text-xs text-[var(--foreground)] transition cursor-pointer"
                >
                  {importResult ? 'Fermer' : 'Annuler'}
                </button>
                {!importResult && (
                  <button
                    type="button"
                    disabled={isImporting || parsedRows.filter((r) => r.isValid).length === 0}
                    onClick={handleExecuteImport}
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Importation en cours...</span>
                      </>
                    ) : (
                      <span>
                        Importer {parsedRows.filter((r) => r.isValid).length} proverbe(s)
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
