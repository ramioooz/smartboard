import { BadRequestException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => jest.fn()),
  jwtVerify: jest.fn(),
}));

import { OidcService } from '../src/auth/oidc.service';

describe('OidcService', () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...env,
      SESSION_SECRET: 'session-secret',
      MICROSOFT_TENANT_ID: 'tenant-id',
      MICROSOFT_CLIENT_ID: 'client-id',
      MICROSOFT_REDIRECT_URI: 'http://localhost/api/auth/oidc/callback',
      MICROSOFT_CLIENT_SECRET: 'client-secret',
      MICROSOFT_POST_LOGOUT_REDIRECT_URI: 'http://localhost/api/auth/oidc/logout/callback',
    };
  });

  afterAll(() => {
    process.env = env;
  });

  it('normalizes unsafe return paths back to root', () => {
    const service = new OidcService();

    expect(service.normalizeReturnTo(undefined)).toBe('/');
    expect(service.normalizeReturnTo('https://evil.test')).toBe('/');
    expect(service.normalizeReturnTo('//evil.test')).toBe('/');
    expect(service.normalizeReturnTo('/dashboards')).toBe('/dashboards');
  });

  it('builds a Microsoft authorization URL with signed state and nonce', () => {
    const service = new OidcService();

    const url = new URL(service.buildAuthorizationUrl('/datasets'));
    const state = verify(url.searchParams.get('state') as string, process.env.SESSION_SECRET as string) as {
      type: string;
      nonce: string;
      returnTo: string;
    };

    expect(url.origin).toBe('https://login.microsoftonline.com');
    expect(url.pathname).toContain('/oauth2/v2.0/authorize');
    expect(url.searchParams.get('client_id')).toBe('client-id');
    expect(url.searchParams.get('redirect_uri')).toBe(process.env.MICROSOFT_REDIRECT_URI);
    expect(url.searchParams.get('nonce')).toBeTruthy();
    expect(state.type).toBe('oidc-state');
    expect(state.returnTo).toBe('/datasets');
    expect(state.nonce).toBe(url.searchParams.get('nonce'));
  });

  it('rejects callback queries without code or state', async () => {
    const service = new OidcService();

    await expect(service.exchangeCodeForIdentity({ code: 'only-code' })).rejects.toThrow(
      new BadRequestException('Missing code or state'),
    );
    await expect(service.exchangeCodeForIdentity({ state: 'only-state' })).rejects.toThrow(
      new BadRequestException('Missing code or state'),
    );
  });
});
