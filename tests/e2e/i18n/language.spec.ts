import { expect, test, type Page } from '@playwright/test';

async function saveLanguage(page: Page, language: 'en' | 'fr' | 'ar') {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');

  await page.locator('select').last().selectOption(language);
  await page
    .getByRole('button', {
      name: /Save preferences|Saving…|Saved|Enregistrer les préférences|Enregistrement…|Enregistré|حفظ التفضيلات|جار الحفظ…|تم الحفظ/,
    })
    .click();

  await page.waitForLoadState('networkidle');
  await expect(page.locator('select').last()).toHaveValue(language);
}

test('saved French preference applies across the core app shell and pages', async ({ page }) => {
  await saveLanguage(page, 'fr');

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

test('language preference can switch back to English after French is saved', async ({ page }) => {
  await saveLanguage(page, 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Paramètres');

  await saveLanguage(page, 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
  await expect(page.getByRole('link', { name: /Overview/ })).toBeVisible();

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome back, dev');

  await page.goto('/datasets', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Datasets');

  await saveLanguage(page, 'ar');

  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('الإعدادات');
  await expect(page.getByRole('link', { name: /نظرة عامة/ })).toBeVisible();

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('مرحباً بعودتك، dev');

  await saveLanguage(page, 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});
