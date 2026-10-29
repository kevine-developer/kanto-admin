import { test, expect } from '@playwright/test';

test.describe('Parcours E2E - Sécurité & Contrôle d\'Accès (RBAC)', () => {
  test('L\'accès direct à une route protégée sans session redirige vers /login ou affiche Accès Refusé', async ({ page }) => {
    // Tentative d'accès direct au tableau de bord sans cookie de session
    await page.goto('/');

    // Doit soit rediriger vers /login, soit afficher l'écran d'accès refusé / ouverture
    await page.waitForTimeout(1000);
    const url = page.url();
    const isLoginPage = url.includes('/login');
    const isDeniedPage = await page.getByText(/Accès Refusé/i).isVisible().catch(() => false);
    const isVerifying = await page.getByText(/Ouverture du Conservatoire/i).isVisible().catch(() => false);

    expect(isLoginPage || isDeniedPage || isVerifying).toBe(true);
  });

  test('L\'accès direct aux événements sans droits administrateur est bloqué', async ({ page }) => {
    await page.goto('/events');
    await page.waitForTimeout(1000);

    const url = page.url();
    const isLoginPage = url.includes('/login');
    const isDeniedPage = await page.getByText(/Accès Refusé/i).isVisible().catch(() => false);
    const isVerifying = await page.getByText(/Ouverture du Conservatoire/i).isVisible().catch(() => false);

    expect(isLoginPage || isDeniedPage || isVerifying).toBe(true);
  });
});

