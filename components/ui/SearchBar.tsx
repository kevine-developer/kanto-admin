'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  totalCount?: number;
  filters?: React.ReactNode;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher...',
  totalCount,
  filters,
  className = '',
}: SearchBarProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] ${className}`}
    >
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
        />
        {value.length > 0 && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)] p-0.5 rounded cursor-pointer transition-colors"
            title="Effacer la recherche"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {(filters || totalCount !== undefined) && (
        <div className="flex items-center gap-3 flex-wrap">
          {filters}
          {totalCount !== undefined && (
            <span className="text-xs text-[var(--text-muted)] font-medium shrink-0">
              {totalCount} résultat{totalCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
