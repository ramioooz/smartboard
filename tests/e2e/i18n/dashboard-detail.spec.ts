import { expect, test } from '@playwright/test';

test('French preference applies to datasets and dashboard builder details', async ({ page }) => {
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

  await page.goto('/datasets', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Jeux de données');
  await page.getByRole('button', { name: /Téléverser un jeu de données/i }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Téléverser un jeu de données' })).toBeVisible();
  await expect(page.getByText('Type de fichier')).toBeVisible();
  await page.getByRole('button', { name: 'Annuler' }).click();

  await page.goto('/dashboards', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tableaux de bord');

  await page.getByRole('button', { name: /Nouveau tableau de bord/i }).click();
  await page.getByPlaceholder('Mon tableau de bord').fill(`Rapport langue ${Date.now()}`);
  await page.getByRole('button', { name: /^Créer$/ }).click();

  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('button', { name: /Ajouter un panneau/i })).toBeVisible();

  const addPanelButton = page.getByRole('button', { name: /Ajouter un panneau/i });
  await addPanelButton.click();
  await page.getByRole('button', { name: /^Texte$/ }).click();
  await addPanelButton.click();
  await page.getByRole('button', { name: /^Série temporelle$/ }).click();

  const editButtons = page.getByRole('button', { name: 'Modifier le panneau' });
  await editButtons.last().click();

  await expect(page.getByText('Modifier le panneau')).toBeVisible();
  await expect(page.getByText('Titre')).toBeVisible();
  await expect(page.getByText('Intervalle')).toBeVisible();
  await expect(page.locator('select').nth(2)).toContainText(/Heure|Jour|Semaine|Mois/);
  await page.getByRole('button', { name: 'Annuler' }).click();

  await editButtons.first().click();
  await expect(page.getByText('Contenu')).toBeVisible();
  await page.getByRole('button', { name: 'Annuler' }).click();
});
