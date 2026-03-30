import { expect, test, type APIRequestContext } from '@playwright/test';

const apiBaseURL = process.env['PLAYWRIGHT_API_BASE_URL'] ?? 'http://127.0.0.1';

function setCookieHeaders(headers: { name: string; value: string }[]): string[] {
  return headers.filter((header) => header.name.toLowerCase() === 'set-cookie').map((header) => header.value);
}

async function bootstrapSession(api: APIRequestContext) {
  const response = await api.post('/api/auth/session', {
    data: {},
  });

  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    ok: boolean;
    data: { user: { id: string; email: string | null } };
  };

  expect(body.ok).toBe(true);
  expect(body.data.user.id).toBeTruthy();

  const cookies = setCookieHeaders(await response.headersArray());
  expect(cookies.some((cookie) => cookie.includes('sb_access_token='))).toBe(true);
  expect(cookies.some((cookie) => cookie.includes('sb_refresh_token='))).toBe(true);

  return body.data.user;
}

test.describe('auth api flow', () => {
  test('oidc start redirects and callback rejects missing code/state', async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL: apiBaseURL });
    const startResponse = await request.get('/api/auth/oidc/start', {
      params: {
        returnTo: 'http://127.0.0.1:3000/',
      },
      maxRedirects: 0,
    });

    expect(startResponse.status()).toBe(302);
    expect(startResponse.headers()['location']).toContain('http://127.0.0.1:3000/');

    const callbackResponse = await request.get('/api/auth/oidc/callback', {
      maxRedirects: 0,
    });
    expect(callbackResponse.status()).toBe(400);
    await request.dispose();
  });

  test('session bootstrap, refresh, and logout keep the session lifecycle correct', async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL: apiBaseURL });
    const user = await bootstrapSession(request);

    const meAfterRefreshResponse = await request.get('/api/auth/me');
    expect(meAfterRefreshResponse.status()).toBe(200);

    const meBody = (await meAfterRefreshResponse.json()) as {
      ok: boolean;
      data: { id: string; email: string | null };
    };

    expect(meBody.ok).toBe(true);
    expect(meBody.data.id).toBe(user.id);

    const refreshResponse = await request.post('/api/auth/session/refresh', {
      data: {},
    });
    expect(refreshResponse.status()).toBe(200);

    const refreshCookies = setCookieHeaders(await refreshResponse.headersArray());
    expect(refreshCookies.some((cookie) => cookie.includes('sb_access_token='))).toBe(true);
    expect(refreshCookies.some((cookie) => cookie.includes('sb_refresh_token='))).toBe(true);

    const meResponse = await request.get('/api/auth/me');
    expect(meResponse.status()).toBe(200);

    const logoutResponse = await request.get('/api/auth/oidc/logout', {
      params: {
        returnTo: 'http://127.0.0.1:3000/signed-out',
      },
      maxRedirects: 0,
    });

    expect(logoutResponse.status()).toBe(302);
    const logoutCookies = setCookieHeaders(await logoutResponse.headersArray());
    expect(logoutCookies.some((cookie) => cookie.includes('sb_access_token=;'))).toBe(true);
    expect(logoutCookies.some((cookie) => cookie.includes('sb_refresh_token=;'))).toBe(true);

    const meAfterLogoutResponse = await request.get('/api/auth/me');
    expect(meAfterLogoutResponse.status()).toBe(401);
    await request.dispose();
  });

  test('logout-all revokes sibling sessions immediately', async ({ playwright }) => {
    const first = await playwright.request.newContext({ baseURL: apiBaseURL });
    const second = await playwright.request.newContext({ baseURL: apiBaseURL });

    await bootstrapSession(first);
    await bootstrapSession(second);

    const logoutAllResponse = await first.post('/api/auth/logout-all', {
      data: {},
    });
    expect(logoutAllResponse.status()).toBe(200);

    const firstMe = await first.get('/api/auth/me');
    const secondMe = await second.get('/api/auth/me');
    expect(firstMe.status()).toBe(401);
    expect(secondMe.status()).toBe(401);

    await first.dispose();
    await second.dispose();
  });
});
