'use client';

import { useTheme } from '@/lib/theme-context';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function ZoomControl({ showPresets = true }: { showPresets?: boolean }) {
  const { zoomLevel, setZoomLevel, resetZoom } = useTheme();

  const presets = [
    { label: '90%', value: 90, desc: 'Compact' },
    { label: '100%', value: 100, desc: 'Standard' },
    { label: '115%', value: 115, desc: 'Confort' },
    { label: '130%', value: 130, desc: 'Grand' },
  ];

  return (
    <div className="space-y-3">
      {/* Zoom Stepper + Slider */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setZoomLevel(zoomLevel - 5)}
          disabled={zoomLevel <= 80}
          title="Diminuer le zoom"
          className="p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-40 transition-all cursor-pointer shadow-xs"
        >
          <ZoomOut size={18} />
        </button>

        <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)]">
          <input
            type="range"
            min="80"
            max="140"
            step="5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseInt(e.target.value, 10))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
          <span className="font-mono text-sm font-extrabold text-[var(--foreground)] w-14 text-right">
            {zoomLevel}%
          </span>
        </div>

        <button
          onClick={() => setZoomLevel(zoomLevel + 5)}
          disabled={zoomLevel >= 140}
          title="Augmenter le zoom"
          className="p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--foreground)] disabled:opacity-40 transition-all cursor-pointer shadow-xs"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={resetZoom}
          title="Réinitialiser à 100%"
          className="p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Preset Pills */}
      {showPresets && (
        <div className="grid grid-cols-4 gap-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => setZoomLevel(p.value)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                zoomLevel === p.value
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                  : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)] hover:bg-[var(--card-hover)]'
              }`}
            >
              <div className="font-extrabold">{p.label}</div>
              <div className="text-[10px] opacity-80">{p.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
