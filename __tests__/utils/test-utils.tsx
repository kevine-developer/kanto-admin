import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ToastProvider } from '@/components/feedback/ToastContext';
import { ThemeProvider } from '@/lib/theme-context';

type ExtendedRenderOptions = Omit<RenderOptions, 'queries'>;

/**
 * Wrapper de test complet fournissant ToastProvider et ThemeProvider
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: ExtendedRenderOptions
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
