'use client';

import React, { useState, useRef } from 'react';
import { resolveMediaUrl } from '@/lib/utils/media';
import { Upload, Image as ImageIcon, X, Loader2, Cloud } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

interface ImageUploadDropzoneProps {
  value?: string | null;
  onChange: (url: string) => void;
  maxSizeBytes?: number; // Défaut 10Mo
  uploadEndpoint?: string;
  className?: string;
  subfolder?: string;
}

export function ImageUploadDropzone({
  value,
  onChange,
  maxSizeBytes = 10 * 1024 * 1024,
  uploadEndpoint = '/admin/locks/upload-image',
  className = '',
  subfolder,
}: ImageUploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (PNG, JPG, WebP, SVG).');
      return;
    }

    if (file.size > maxSizeBytes) {
      setError(`L'image est trop volumineuse (max: ${Math.round(maxSizeBytes / (1024 * 1024))} Mo).`);
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await fetchApi<{ url: string; provider?: string }>(uploadEndpoint, {
          method: 'POST',
          body: JSON.stringify({
            imageBase64: base64,
            fileName: file.name,
            subfolder,
          }),
        });

        if (res?.url) {
          onChange(res.url);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Échec de l'hébergement";
        setError(msg);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void processFile(file);
          e.target.value = '';
        }}
      />

      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)] group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveMediaUrl(value)}
            alt="Illustration"
            className="w-full h-36 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white/90 text-neutral-900 text-xs font-semibold hover:bg-white transition cursor-pointer flex items-center gap-1"
            >
              <Upload size={12} />
              <span>Changer</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
              title="Supprimer l'image"
            >
              <X size={14} />
            </button>
          </div>

          {value.includes('cloudinary.com') && (
            <span
              className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500/90 text-white text-[9px] font-mono flex items-center gap-1 shadow-xs"
              title="Hébergé sur Cloudinary"
            >
              <Cloud size={10} />
              CDN
            </span>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragOver
              ? 'border-[var(--accent)] bg-[var(--accent-light)]/50'
              : 'border-[var(--card-border)] hover:border-[var(--text-subtle)] bg-[var(--input-bg)]'
          }`}
        >
          {isUploading ? (
            <div className="py-3 flex flex-col items-center gap-2 text-xs text-[var(--text-muted)]">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
              <span>Upload en cours...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-[var(--card)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] shadow-2xs">
                <ImageIcon size={16} />
              </div>
              <div className="text-xs font-medium text-[var(--foreground)]">
                Glissez une image ici ou <span className="text-[var(--accent-text)] underline">parcourez</span>
              </div>
              <div className="text-[10px] text-[var(--text-subtle)]">
                PNG, JPG, WebP jusqu&apos;à 10 Mo
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
