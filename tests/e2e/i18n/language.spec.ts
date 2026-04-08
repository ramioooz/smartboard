import { expect, test } from '@playwright/test';

test('saved French preference applies across the core app shell and pages', async ({ page }) => {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');

  const languageSelect = page.locator('select').last();
  await languageSelect.selectOption('fr');
  await page
    .getByRole('button', {
      name: /Save preferences|Saving…|Saved|Enregistrer les préférences|Enregistrement…|Enregistré/,
    })
    .click();

  await page.waitForTimeout(1200);
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Aperçu')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paramètres');

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bon retour, dev');
  await expect(page.getByRole('link', { name: /Jeux de données \d/ })).toBeVisible();

  await page.goto('/datasets', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jeux de données');

  await page.goto('/dashboards', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tableaux de bord');
});
