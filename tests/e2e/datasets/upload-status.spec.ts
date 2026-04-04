import { expect, test } from '@playwright/test';

test('dataset status updates in place after upload', async ({ page }) => {
  const name = `pw_ds_${Date.now()}`;

  await page.goto('http://127.0.0.1:3000/signed-out', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('http://127.0.0.1:3000/datasets', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

  await page.getByRole('button', { name: '+ Upload Dataset' }).click();
  await expect(page.getByRole('heading', { name: 'Upload Dataset' })).toBeVisible();
  await page.getByRole('textbox', { name: 'My Sales Data' }).fill(name);
  await page.locator('input[type="file"]').setInputFiles('/Users/rami/Documents/Projects/smartboard/sample-dataset.csv');
  await page.locator('button[type="submit"]').click();

  await expect(page.getByText(name)).toBeVisible();
  await expect(page.getByText('Uploaded').last()).toBeVisible();
  await expect(page.getByText('Ready').last()).toBeVisible({ timeout: 45_000 });
});
