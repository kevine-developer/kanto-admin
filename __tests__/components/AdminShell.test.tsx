import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminShell } from '@/components/layout/AdminShell';
import * as authClientModule from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
  getSession: vi.fn(),
  authClient: {},
}));

// Mock de Header et Sidebar pour isoler le test du Shell
vi.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="mock-header">Header Navigation</div>,
}));

vi.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="mock-sidebar">Sidebar Menu</div>,
}));

describe('components/layout/AdminShell - Sécurité & Contrôle d\'accès (RBAC)', () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  it('affiche un écran de chargement pendant la résolution de session', () => {
    vi.mocked(authClientModule.useSession).mockReturnValue({
      data: null,
      isPending: true,
      error: null,
    } as unknown as ReturnType<typeof authClientModule.useSession>);

    render(
      <AdminShell>
        <div>Contenu Protégé</div>
      </AdminShell>
    );

    expect(screen.getByText('Ouverture du Conservatoire...')).toBeInTheDocument();
    expect(screen.queryByText('Contenu Protégé')).not.toBeInTheDocument();
  });

  it('refuse l\'accès et redirige vers /login si l\'utilisateur n\'a pas le rôle ADMIN', async () => {
    vi.mocked(authClientModule.useSession).mockReturnValue({
      data: {
        user: { id: 'usr-2', name: 'User Standard', email: 'user@kanto.mg', role: 'USER' },
      },
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof authClientModule.useSession>);
    vi.mocked(authClientModule.getSession).mockResolvedValue({
      data: {
        user: { id: 'usr-2', name: 'User Standard', email: 'user@kanto.mg', role: 'USER' },
      },
    } as unknown as Awaited<ReturnType<typeof authClientModule.getSession>>);

    render(
      <AdminShell>
        <div>Contenu Protégé</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
      expect(
        screen.getByText(/Vous devez posséder les privilèges/i)
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('Contenu Protégé')).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('refuse l\'accès si aucune session n\'est trouvée', async () => {
    vi.mocked(authClientModule.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof authClientModule.useSession>);
    vi.mocked(authClientModule.getSession).mockResolvedValue({
      data: null,
    } as unknown as Awaited<ReturnType<typeof authClientModule.getSession>>);

    render(
      <AdminShell>
        <div>Contenu Secret</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(screen.getByText('Accès Refusé')).toBeInTheDocument();
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByText('Contenu Secret')).not.toBeInTheDocument();
  });

  it('autorise et rend les enfants lorsque l\'utilisateur possède le rôle ADMIN', async () => {
    vi.mocked(authClientModule.useSession).mockReturnValue({
      data: {
        user: { id: 'admin-1', name: 'Super Admin', email: 'admin@kanto.mg', role: 'ADMIN' },
      },
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof authClientModule.useSession>);

    render(
      <AdminShell>
        <div data-testid="protected-content">Tableau de bord sécurisé</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByText('Accès Refusé')).not.toBeInTheDocument();
  });
});
