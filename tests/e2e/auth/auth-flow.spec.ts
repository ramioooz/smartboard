import { expect, test, type Page, type Response } from '@playwright/test';

interface RecordedResponse {
  url: string;
  status: number;
  method: string;
}

function trackAuthTraffic(page: Page): RecordedResponse[] {
  const events: RecordedResponse[] = [];
  page.on('response', (response: Response) => {
    const url = response.url();
    if (url.includes('/api/auth/') || url.includes('/api/tenants')) {
      events.push({
        url,
        status: response.status(),
        method: response.request().method(),
      });
    }
  });
  return events;
}

async function signInFromSignedOut(page: Page): Promise<RecordedResponse[]> {
  const events = trackAuthTraffic(page);
  await page.goto('/signed-out', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByText(/Welcome back/i)).toBeVisible();
  return events;
}

test.describe('browser auth flow', () => {
  test('signed-out route stays public on refresh', async ({ page }) => {
    const events = trackAuthTraffic(page);
    await page.goto('/signed-out', { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.getByText('You are signed out')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    expect(events).toEqual([]);
  });

  test('sign in from signed-out uses auth entrypoint and avoids initial me 401', async ({ page }) => {
    const events = await signInFromSignedOut(page);

    expect(events.some((event) => event.url.includes('/api/auth/oidc/start') && event.status === 302)).toBe(true);
    expect(events.some((event) => event.url.includes('/api/auth/me') && event.status === 401)).toBe(false);
    expect(events.some((event) => event.url.includes('/api/auth/me') && event.status === 200)).toBe(true);
    expect(events.some((event) => event.url.includes('/api/tenants') && event.status === 200)).toBe(true);
  });

  test('one-click sign out lands on signed-out page', async ({ page }) => {
    await signInFromSignedOut(page);

    const events = trackAuthTraffic(page);
    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(/\/signed-out$/);
    await expect(page.getByText('You are signed out')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    expect(events.some((event) => event.url.includes('/api/auth/oidc/logout') && event.status === 302)).toBe(true);
  });

  test('refresh after sign in stays authenticated', async ({ page }) => {
    await signInFromSignedOut(page);

    const events = trackAuthTraffic(page);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByText(/Welcome back/i)).toBeVisible();

    expect(events.some((event) => event.url.includes('/api/auth/me') && event.status === 200)).toBe(true);
    expect(events.some((event) => event.url.includes('/api/auth/me') && event.status === 401)).toBe(false);
  });
});
