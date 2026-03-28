import { Body, Controller, Get, HttpCode, Patch, Post, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Throttle, minutes, hours } from '@nestjs/throttler';
import type {
  ApiOk,
  LogoutAllSessions,
  LogoutSession,
  OidcCallbackQuery,
  OidcCallbackResult,
  OidcLogoutQuery,
  OidcLogoutResult,
  OidcStartQuery,
  OidcStartResult,
  RefreshSession,
} from '@smartboard/shared';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearCookie,
  getAccessTokenCookieTtlSeconds,
  getRefreshTokenCookieTtlSeconds,
  serializeCookie,
  shouldUseSecureCookies,
} from './auth.constants';
import { RequestContextService } from '../context/request-context.service';

interface SessionResponse {
  user: unknown;
  sessionId: string;
  refreshToken: string;
  token: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rcs: RequestContextService,
  ) {}

  private setSessionCookies(reply: FastifyReply, data: SessionResponse): void {
    const secure = shouldUseSecureCookies();
    reply.header('Set-Cookie', [
      serializeCookie(ACCESS_TOKEN_COOKIE, data.token, {
        path: '/',
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        maxAge: getAccessTokenCookieTtlSeconds(),
      }),
      serializeCookie(REFRESH_TOKEN_COOKIE, data.refreshToken, {
        path: '/',
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        maxAge: getRefreshTokenCookieTtlSeconds(),
      }),
    ]);
  }

  private clearSessionCookies(reply: FastifyReply): void {
    const secure = shouldUseSecureCookies();
    reply.header('Set-Cookie', [
      clearCookie(ACCESS_TOKEN_COOKIE, secure),
      clearCookie(REFRESH_TOKEN_COOKIE, secure),
    ]);
  }

  private normalizeReturnTo(returnTo?: string): string {
    if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
      return '/';
    }

    return returnTo;
  }

  // Override all three global throttlers with brute-force-resistant limits:
  //   short  — 5  attempts per 15 minutes  (~20/hr)
  //   medium — 10 attempts per 15 minutes  (less restrictive safety net)
  //   long   — 30 attempts per 24 hours    (daily hard cap)
  //
  // This is enforced at the NestJS layer (per IP, Redis-backed).
  // Nginx also enforces 10 req/min at the edge before requests reach the app.
  @Throttle({
    short:  { limit: 5,  ttl: minutes(15) },
    medium: { limit: 10, ttl: minutes(15) },
    long:   { limit: 30, ttl: hours(24)   },
  })
  @Public()
  @Post('session')
  @HttpCode(200)
  async createSession(
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ApiOk<SessionResponse>> {
    const response = await this.authService.post<ApiOk<SessionResponse>>('/auth/session', {});
    this.setSessionCookies(reply, response.data);
    return response;
  }

  @Throttle({
    short:  { limit: 5,  ttl: minutes(15) },
    medium: { limit: 10, ttl: minutes(15) },
    long:   { limit: 30, ttl: hours(24)   },
  })
  @Public()
  @Get('oidc/start')
  async startOidc(
    @Query() query: OidcStartQuery,
    @Res() reply: FastifyReply,
  ): Promise<FastifyReply> {
    const path = query.returnTo
      ? `/auth/oidc/start?returnTo=${encodeURIComponent(query.returnTo)}`
      : '/auth/oidc/start';
    const response = await this.authService.get<ApiOk<OidcStartResult<unknown>>>(path);

    if (response.data.mode === 'session') {
      this.setSessionCookies(reply, response.data);
      return reply.redirect(302, response.data.redirectTo);
    }

    return reply.redirect(302, response.data.authorizationUrl);
  }

  @Public()
  @Get('oidc/callback')
  async completeOidcCallback(
    @Query() query: OidcCallbackQuery,
    @Res() reply: FastifyReply,
  ): Promise<FastifyReply> {
    const params = new URLSearchParams();
    if (query.code) params.set('code', query.code);
    if (query.state) params.set('state', query.state);
    if (query.error) params.set('error', query.error);
    if (query.error_description) params.set('error_description', query.error_description);

    const response = await this.authService.get<ApiOk<OidcCallbackResult<unknown>>>(
      `/auth/oidc/callback?${params.toString()}`,
    );

    this.setSessionCookies(reply, response.data);
    return reply.redirect(302, response.data.redirectTo);
  }

  @Public()
  @Get('oidc/logout')
  async startOidcLogout(
    @Query() query: OidcLogoutQuery,
    @Res() reply: FastifyReply,
  ): Promise<FastifyReply> {
    const path = query.returnTo
      ? `/auth/oidc/logout?returnTo=${encodeURIComponent(query.returnTo)}`
      : '/auth/oidc/logout';
    const response = await this.authService.get<ApiOk<OidcLogoutResult>>(path);
    this.clearSessionCookies(reply);
    return reply.redirect(302, response.data.redirectTo);
  }

  @Public()
  @Get('oidc/logout/callback')
  async completeOidcLogout(
    @Query() query: OidcLogoutQuery,
    @Res() reply: FastifyReply,
  ): Promise<FastifyReply> {
    this.clearSessionCookies(reply);
    return reply.redirect(302, this.normalizeReturnTo(query.returnTo));
  }

  @Throttle({
    short:  { limit: 10, ttl: minutes(15) },
    medium: { limit: 20, ttl: minutes(15) },
    long:   { limit: 60, ttl: hours(24)   },
  })
  @Public()
  @Post('session/refresh')
  @HttpCode(200)
  async refreshSession(
    @Body() body: Partial<RefreshSession>,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ApiOk<SessionResponse>> {
    const refreshToken = body.refreshToken ?? this.readCookie(reply.request.headers.cookie, REFRESH_TOKEN_COOKIE);
    const response = await this.authService.post<ApiOk<SessionResponse>>('/auth/session/refresh', {
      refreshToken,
    });
    this.setSessionCookies(reply, response.data);
    return response;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Body() body: Partial<LogoutSession>,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ApiOk<{ success: true }>> {
    const sessionId = body.sessionId ?? this.rcs.getOrUndefined()?.sessionId;
    const response = await this.authService.post<ApiOk<{ success: true }>>('/auth/logout', {
      sessionId,
    });
    this.clearSessionCookies(reply);
    return response;
  }

  @Post('logout-all')
  @HttpCode(200)
  async logoutAll(
    @Body() body: LogoutAllSessions,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ApiOk<{ success: true; sessionsRevoked: number }>> {
    const response = await this.authService.post<ApiOk<{ success: true; sessionsRevoked: number }>>(
      '/auth/logout-all',
      body,
    );
    this.clearSessionCookies(reply);
    return response;
  }

  @Get('me')
  async me(): Promise<ApiOk<unknown>> {
    return this.authService.get<ApiOk<unknown>>('/auth/me');
  }

  @Patch('me/preferences')
  async updatePreferences(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.authService.patch<ApiOk<unknown>>('/auth/me/preferences', body);
  }

  private readCookie(header: string | undefined, name: string): string | undefined {
    if (!header) return undefined;

    for (const pair of header.split(';')) {
      const [rawKey, ...rawValue] = pair.trim().split('=');
      if (rawKey === name) {
        return decodeURIComponent(rawValue.join('='));
      }
    }

    return undefined;
  }
}
