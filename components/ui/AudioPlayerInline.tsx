'use client';

import React, { useRef, useState, useEffect } from 'react';
import { resolveMediaUrl } from '@/lib/utils/media';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';

interface AudioPlayerInlineProps {
  url?: string | null;
  label?: string;
  lang?: 'MG' | 'FR';
  className?: string;
}

export function AudioPlayerInline({
  url,
  label,
  lang,
  className = '',
}: AudioPlayerInlineProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const fullUrl = resolveMediaUrl(url);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
  }, [fullUrl]);

  if (!url) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--input-bg)] ${className}`}
    >
      <audio
        ref={audioRef}
        src={fullUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center cursor-pointer hover:opacity-90 transition shrink-0"
        title={isPlaying ? 'Pause' : 'Écouter'}
      >
        {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
      </button>

      <button
        type="button"
        onClick={handleRestart}
        className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--foreground)] transition cursor-pointer"
        title="Recommencer"
      >
        <RotateCcw size={12} />
      </button>

      {lang && (
        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[var(--card)] border border-[var(--card-border)] text-[var(--text-muted)]">
          {lang}
        </span>
      )}

      {label && (
        <span className="text-xs font-medium text-[var(--foreground)] truncate max-w-[140px]">
          {label}
        </span>
      )}

      <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-subtle)] ml-auto shrink-0">
        <Volume2 size={11} />
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
