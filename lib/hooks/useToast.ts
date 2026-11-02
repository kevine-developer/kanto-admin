'use client';

import { useToastContext } from '@/components/feedback/ToastContext';

export function useToast() {
  return useToastContext();
}
