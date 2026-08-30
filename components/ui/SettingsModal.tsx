'use client';

import { Modal } from './Modal';
import { ThemeToggle } from './ThemeToggle';
import { ZoomControl } from './ZoomControl';
import { useTheme } from '@/lib/theme-context';
import { Sliders, SunMoon, ZoomIn, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { zoomLevel, resetZoom } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <Sliders size={22} className="text-[var(--accent)]" />
          <span>Paramètres d&apos;Affichage &amp; Confort</span>
        </div>
      }
      subtitle="Personnalisez le thème de couleur et la taille de lecture de l'interface"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={resetZoom}
            className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] underline cursor-pointer"
          >
            Réinitialiser l&apos;affichage par défaut
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-bold shadow-soft transition-all cursor-pointer flex items-center gap-2"
          >
            <Check size={16} />
            <span>Appliquer &amp; Fermer</span>
          </button>
        </div>
      }
    >
      <div className="space-y-7">
        {/* Section 1 : Thème */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
            <SunMoon size={16} className="text-[var(--accent)]" />
            <span>Thème Visuel</span>
          </div>
          <ThemeToggle variant="pills" />
        </div>

        {/* Section 2 : Zoom & Échelle de lecture */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              <ZoomIn size={16} className="text-[var(--accent)]" />
              <span>Échelle Typographique &amp; Zoom</span>
            </div>
            <span className="text-xs font-bold font-mono text-[var(--accent-text)]">
              Actuel : {zoomLevel}%
            </span>
          </div>
          <ZoomControl showPresets={true} />
        </div>

        {/* Aperçu en direct */}
        <div className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">
            Aperçu de la lisibilité
          </div>
          <div className="text-xs font-semibold text-[var(--foreground)]">
            « Ny fahaizana toy ny ketsa : kolokoloy mba haniry »
          </div>
          <div className="text-[11px] text-[var(--text-muted)] italic">
            Le savoir est comme le plant de riz : cultivez-le pour qu&apos;il grandisse.
          </div>
        </div>
      </div>
    </Modal>
  );
}
