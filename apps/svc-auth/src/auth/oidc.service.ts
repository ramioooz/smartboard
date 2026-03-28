import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { decode, sign, verify } from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { requireEnv } from '@smartboard/shared';
import type { OidcCallbackQuery } from '@smartboard/shared';
import type { AuthProvider } from '@prisma/client';
import type { ExternalIdentity } from './identity.types';

interface OidcStatePayload {
  type: 'oidc-state';
  nonce: string;
  returnTo: string;
}

interface MicrosoftIdTokenClaims {
  aud?: string;
  iss?: string;
  nonce?: string;
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
}

interface MicrosoftUserInfo {
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
}

@Injectable()
export class OidcService {
  buildAuthorizationUrl(returnTo?: string): string {
    const tenantId = requireEnv('MICROSOFT_TENANT_ID');
    const clientId = requireEnv('MICROSOFT_CLIENT_ID');
    const redirectUri = requireEnv('MICROSOFT_REDIRECT_URI');
    const nonce = randomBytes(16).toString('base64url');
    const state = this.signState({
      type: 'oidc-state',
      nonce,
      returnTo: this.normalizeReturnTo(returnTo),
    });

    const url = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_mode', 'query');
    url.searchParams.set('scope', 'openid profile email offline_access');
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);

    return url.toString();
  }

  async exchangeCodeForIdentity(query: OidcCallbackQuery): Promise<{
    identity: ExternalIdentity;
    returnTo: string;
  }> {
    if (query.error) {
      throw new UnauthorizedException(query.error_description ?? query.error);
    }
    if (!query.code || !query.state) {
      throw new BadRequestException('Missing code or state');
    }

    const state = this.verifyState(query.state);
    const tokenResponse = await this.exchangeCodeForTokens(query.code);
    const claims = this.extractIdTokenClaims(tokenResponse.id_token);

    const clientId = requireEnv('MICROSOFT_CLIENT_ID');
    const tenantId = requireEnv('MICROSOFT_TENANT_ID');
    const expectedIssuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    if (claims.aud !== clientId) {
      throw new UnauthorizedException('OIDC audience mismatch');
    }
    if (claims.iss !== expectedIssuer) {
      throw new UnauthorizedException('OIDC issuer mismatch');
    }
    if (claims.nonce !== state.nonce) {
      throw new UnauthorizedException('OIDC nonce mismatch');
    }

    const userInfo = await this.fetchUserInfo(tokenResponse.access_token);
    const externalId = claims.sub ?? userInfo.sub;
    const email = claims.email ?? claims.preferred_username ?? userInfo.email ?? userInfo.preferred_username;
    const name = claims.name ?? userInfo.name ?? email?.split('@')[0];

    if (!externalId || !email) {
      throw new UnauthorizedException('OIDC profile is missing required claims');
    }

    return {
      identity: {
        provider: 'MICROSOFT' as AuthProvider,
        externalId,
        email,
        name,
      },
      returnTo: state.returnTo,
    };
  }

  normalizeReturnTo(returnTo?: string): string {
    if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
      return '/';
    }

    return returnTo;
  }

  private signState(payload: OidcStatePayload): string {
    return sign(payload, requireEnv('SESSION_SECRET'), {
      expiresIn: '10m',
    });
  }

  private verifyState(rawState: string): OidcStatePayload {
    const payload = verify(rawState, requireEnv('SESSION_SECRET')) as OidcStatePayload;
    if (payload.type !== 'oidc-state') {
      throw new UnauthorizedException('Invalid OIDC state');
    }

    return payload;
  }

  private async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    id_token: string;
  }> {
    const tenantId = requireEnv('MICROSOFT_TENANT_ID');
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: requireEnv('MICROSOFT_CLIENT_ID'),
      client_secret: requireEnv('MICROSOFT_CLIENT_SECRET'),
      grant_type: 'authorization_code',
      code,
      redirect_uri: requireEnv('MICROSOFT_REDIRECT_URI'),
      scope: 'openid profile email offline_access',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new UnauthorizedException(`OIDC token exchange failed: ${text}`);
    }

    const body = (await response.json()) as { access_token?: string; id_token?: string };
    if (!body.access_token || !body.id_token) {
      throw new UnauthorizedException('OIDC token exchange returned incomplete tokens');
    }

    return {
      access_token: body.access_token,
      id_token: body.id_token,
    };
  }

  private extractIdTokenClaims(idToken: string): MicrosoftIdTokenClaims {
    const payload = decode(idToken);
    if (!payload || typeof payload !== 'object') {
      throw new UnauthorizedException('Unable to decode OIDC id_token');
    }

    return payload as MicrosoftIdTokenClaims;
  }

  private async fetchUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
    const response = await fetch('https://graph.microsoft.com/oidc/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {};
    }

    return (await response.json()) as MicrosoftUserInfo;
  }
}
