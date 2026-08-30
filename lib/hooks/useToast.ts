'use client';

import { useToastContext } from '@/components/feedback/ToastContext';

export function useToast() {
  const { toast } = useToastContext();
  return { toast };
}
