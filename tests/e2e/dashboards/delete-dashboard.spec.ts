import { expect, test, type Page } from '@playwright/test';

async function useEnglish(page: Page) {
  await page.goto('/settings', { waitUntil: 'networkidle' });
  await page.locator('select').last().selectOption('en');
  await page
    .getByRole('button', {
      name: /Save preferences|Saving…|Saved|Enregistrer les préférences|Enregistrement…|Enregistré|حفظ التفضيلات|جار الحفظ…|تم الحفظ/,
    })
    .click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
}

async function createDashboard(page: Page, name: string) {
  await page.goto('/dashboards', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /New Dashboard/ }).click();
  await page.getByPlaceholder('My Dashboard').fill(name);
  await page.getByRole('button', { name: /^Create$/ }).click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await useEnglish(page);
});

test('deletes a dashboard from the dashboards list', async ({ page }) => {
  const name = `delete_list_${Date.now()}`;
  await createDashboard(page, name);

  await page.goto('/dashboards', { waitUntil: 'networkidle' });
  await expect(page.getByRole('button', { name, exact: true })).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain(name);
    await dialog.accept();
  });
  await page.getByRole('button', { name: `Delete ${name}` }).click();

  await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
});

test('deletes a dashboard from the dashboard detail page', async ({ page }) => {
  const name = `delete_detail_${Date.now()}`;
  await createDashboard(page, name);
  const deletedDashboardPath = new URL(page.url()).pathname;
  const staleDetailRequests: string[] = [];

  page.on('response', (response) => {
    const request = response.request();
    if (
      request.method() === 'GET' &&
      response.status() === 404 &&
      response.url().includes(`/api${deletedDashboardPath}`)
    ) {
      staleDetailRequests.push(response.url());
    }
  });

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain(name);
    await dialog.accept();
  });
  await page.getByRole('button', { name: /^Delete$/ }).click();

  await expect(page).toHaveURL(/\/dashboards$/);
  await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  expect(staleDetailRequests).toEqual([]);
});
