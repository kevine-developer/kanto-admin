'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toastMethods = {
    success: (msg: string, dur?: number) => addToast('success', msg, dur),
    error: (msg: string, dur?: number) => addToast('error', msg, dur),
    warning: (msg: string, dur?: number) => addToast('warning', msg, dur),
    info: (msg: string, dur?: number) => addToast('info', msg, dur),
  };

  const typeConfig: Record<
    ToastType,
    { icon: React.ReactNode; border: string; bg: string; text: string }
  > = {
    success: {
      icon: <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />,
      border: 'border-emerald-500/20 dark:border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-700 dark:text-emerald-300',
    },
    error: {
      icon: <AlertCircle size={16} className="text-rose-500 shrink-0" />,
      border: 'border-rose-500/20 dark:border-rose-500/30',
      bg: 'bg-rose-500/10',
      text: 'text-rose-700 dark:text-rose-300',
    },
    warning: {
      icon: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
      border: 'border-amber-500/20 dark:border-amber-500/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-700 dark:text-amber-300',
    },
    info: {
      icon: <Info size={16} className="text-blue-500 shrink-0" />,
      border: 'border-blue-500/20 dark:border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-700 dark:text-blue-300',
    },
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods, removeToast }}>
      {children}

      {/* Conteneur de Toasts flottant */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((item) => {
          const cfg = typeConfig[item.type];
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start justify-between gap-2.5 p-3 rounded-xl border ${cfg.border} bg-[var(--card)] shadow-lg animate-in slide-in-from-bottom-3 fade-in duration-150`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`p-1 rounded-md ${cfg.bg}`}>{cfg.icon}</div>
                <p className="text-xs font-medium text-[var(--foreground)] pt-0.5 leading-snug">
                  {item.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(item.id)}
                className="text-[var(--text-muted)] hover:text-[var(--foreground)] p-0.5 rounded cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToastContext doit être utilisé dans un ToastProvider');
  }
  return ctx;
}
