'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 15,
  onPageChange,
  isLoading = false,
  itemLabel = 'éléments',
}: PaginationProps) {
  if (totalPages <= 1 && totalCount === 0) return null;

  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[var(--card-border)] text-xs text-[var(--text-muted)]">
      <div>
        {totalCount > 0 ? (
          <span>
            Affichage de <span className="font-semibold text-[var(--foreground)]">{startItem}</span> à{' '}
            <span className="font-semibold text-[var(--foreground)]">{endItem}</span> sur{' '}
            <span className="font-semibold text-[var(--foreground)]">{totalCount}</span> {itemLabel}
          </span>
        ) : (
          <span>Aucun résultat</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="px-3 py-1 rounded-lg bg-[var(--card)] border border-[var(--card-border)] font-medium text-[var(--foreground)]">
          Page {currentPage} / {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          className="p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
