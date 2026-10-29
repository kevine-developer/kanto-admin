import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import * as authClientModule from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';

vi.mock('@/lib/auth-client', () => ({
  signIn: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
  useSession: vi.fn(),
  getSession: vi.fn(),
  authClient: {
    requestPasswordReset: vi.fn(),
  },
}));

describe('app/login/page - Page de Connexion & Authentification', () => {
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

    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );
    vi.mocked(authClientModule.useSession).mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof authClientModule.useSession>);
  });

  it('affiche le formulaire avec les champs email, mot de passe et le bouton de connexion', () => {
    render(<LoginPage />);

    expect(screen.getByText('Connexion Administrateur')).toBeInTheDocument();
    expect(screen.getByLabelText(/Adresse Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de Passe$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Accéder au Conservatoire/i })
    ).toBeInTheDocument();
  });

  it('permet de basculer la visibilité du mot de passe', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/^Mot de Passe$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /Afficher le mot de passe/i });
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /Masquer le mot de passe/i });
    await user.click(hideBtn);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('affiche une erreur explicite si les identifiants sont invalides', async () => {
    const user = userEvent.setup();
    vi.mocked(authClientModule.signIn.email).mockResolvedValue({
      error: { message: 'Identifiants invalides' },
    } as unknown as Awaited<ReturnType<typeof authClientModule.signIn.email>>);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/Adresse Email/i);
    const passwordInput = screen.getByLabelText(/^Mot de Passe$/i);
    const submitBtn = screen.getByRole('button', { name: /Accéder au Conservatoire/i });

    await user.type(emailInput, 'wrong@kanto.mg');
    await user.type(passwordInput, 'badpassword');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('rejette la connexion et déconnecte si l\'utilisateur n\'a pas le rôle ADMIN', async () => {
    const user = userEvent.setup();
    vi.mocked(authClientModule.signIn.email).mockResolvedValue({
      data: {
        user: { id: 'usr-1', email: 'user@kanto.mg', role: 'USER' },
      },
    } as unknown as Awaited<ReturnType<typeof authClientModule.signIn.email>>);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/Adresse Email/i);
    const passwordInput = screen.getByLabelText(/^Mot de Passe$/i);
    const submitBtn = screen.getByRole('button', { name: /Accéder au Conservatoire/i });

    await user.type(emailInput, 'user@kanto.mg');
    await user.type(passwordInput, 'secret123');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(authClientModule.signOut).toHaveBeenCalled();
      expect(screen.getByText(/Accès restreint/i)).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('connecte l\'administrateur et redirige vers / lors d\'une authentification ADMIN valide', async () => {
    const user = userEvent.setup();
    vi.mocked(authClientModule.signIn.email).mockResolvedValue({
      data: {
        user: { id: 'admin-1', email: 'admin@kanto.mg', role: 'ADMIN' },
      },
    } as unknown as Awaited<ReturnType<typeof authClientModule.signIn.email>>);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/Adresse Email/i);
    const passwordInput = screen.getByLabelText(/^Mot de Passe$/i);
    const submitBtn = screen.getByRole('button', { name: /Accéder au Conservatoire/i });

    await user.type(emailInput, 'admin@kanto.mg');
    await user.type(passwordInput, 'SuperAdminPassword2026!');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('bascule en mode récupération de compte au clic sur Mot de passe oublié', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const forgotBtn = screen.getByRole('button', { name: /Mot de passe oublié \?/i });
    await user.click(forgotBtn);

    expect(screen.getByText('Récupération de compte')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Envoyer les instructions de réinitialisation/i })
    ).toBeInTheDocument();
  });

  it('redirige automatiquement vers / si une session ADMIN est déjà active', () => {
    vi.mocked(authClientModule.useSession).mockReturnValue({
      data: {
        user: { id: 'admin-1', role: 'ADMIN' },
      },
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof authClientModule.useSession>);

    render(<LoginPage />);

    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
