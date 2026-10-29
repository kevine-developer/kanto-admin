import { test, expect } from '@playwright/test';

test.describe('Parcours E2E - Authentification Administrateur', () => {
  test('Affiche le formulaire de connexion avec les champs obligatoires', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Connexion Administrateur')).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Accéder au Conservatoire/i })).toBeVisible();
  });

  test('Permet de basculer la visibilité du mot de passe en clair', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = page.getByRole('button', { name: /Afficher le mot de passe/i });
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = page.getByRole('button', { name: /Masquer le mot de passe/i });
    await hideBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Bascule vers le mode Récupération de compte au clic sur Mot de passe oublié', async ({ page }) => {
    await page.goto('/login');

    const forgotBtn = page.getByRole('button', { name: /Mot de passe oublié \?/i });
    await forgotBtn.click();

    await expect(page.getByText('Récupération de compte')).toBeVisible();
    await expect(page.getByRole('button', { name: /Envoyer les instructions/i })).toBeVisible();

    // Retour à la page de connexion
    const backBtn = page.getByRole('button', { name: /Retour à la page de connexion/i });
    await backBtn.click();
    await expect(page.getByText('Connexion Administrateur')).toBeVisible();
  });
});

