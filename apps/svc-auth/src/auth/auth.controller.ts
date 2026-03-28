import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Patch, Post, Query } from '@nestjs/common';
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
  UserPreferences,
} from '@smartboard/shared';
import {
  LogoutSessionSchema,
  LogoutAllSessionsSchema,
  OidcCallbackQuerySchema,
  OidcLogoutQuerySchema,
  OidcStartQuerySchema,
  RefreshSessionSchema,
  UserPreferencesSchema,
} from '@smartboard/shared';
import { ZodValidationPipe } from '@smartboard/nest-common';
import type { User } from '@prisma/client';
import type { LoginResult } from './auth.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('session')
  @HttpCode(200)
  async createSession(
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<ApiOk<LoginResult>> {
    // Backend-owned dev bootstrap path. In production this should be replaced
    // by an interactive OIDC flow that ends with normal session issuance.
    const result = await this.authService.createSession({
      ipAddress: forwardedFor?.split(',')[0]?.trim(),
      userAgent,
    });
    return { ok: true, data: result };
  }

  @Get('oidc/logout')
  async startOidcLogout(
    @Query(new ZodValidationPipe(OidcLogoutQuerySchema)) query: OidcLogoutQuery,
  ): Promise<ApiOk<OidcLogoutResult>> {
    const result = this.authService.startOidcLogout(query.returnTo);
    return { ok: true, data: result };
  }

  @Get('oidc/start')
  async startOidc(
    @Query(new ZodValidationPipe(OidcStartQuerySchema)) query: OidcStartQuery,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<ApiOk<OidcStartResult<User>>> {
    const result = await this.authService.startOidc(query.returnTo, {
      ipAddress: forwardedFor?.split(',')[0]?.trim(),
      userAgent,
    });
    return { ok: true, data: result };
  }

  @Get('oidc/callback')
  async completeOidcCallback(
    @Query(new ZodValidationPipe(OidcCallbackQuerySchema)) query: OidcCallbackQuery,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<ApiOk<OidcCallbackResult<User>>> {
    const result = await this.authService.completeOidcCallback(query, {
      ipAddress: forwardedFor?.split(',')[0]?.trim(),
      userAgent,
    });
    return { ok: true, data: result };
  }

  @Post('session/refresh')
  @HttpCode(200)
  async refreshSession(
    @Body(new ZodValidationPipe(RefreshSessionSchema)) body: RefreshSession,
  ): Promise<ApiOk<LoginResult>> {
    const result = await this.authService.refreshSession(body.refreshToken ?? '');
    return { ok: true, data: result };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Body(new ZodValidationPipe(LogoutSessionSchema)) body: LogoutSession,
  ): Promise<ApiOk<{ success: true }>> {
    await this.authService.logout(body.sessionId);
    return { ok: true, data: { success: true } };
  }

  @Post('logout-all')
  @HttpCode(200)
  async logoutAll(
    @Headers('x-user-id') userId: string,
    @Body(new ZodValidationPipe(LogoutAllSessionsSchema)) _body: LogoutAllSessions,
  ): Promise<ApiOk<{ success: true; sessionsRevoked: number }>> {
    const result = await this.authService.logoutAll(userId);
    return { ok: true, data: { success: true, sessionsRevoked: result.sessionsRevoked } };
  }

  @Get('me')
  async me(@Headers('x-user-id') userId: string): Promise<ApiOk<User>> {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    const user = await this.authService.me(userId);
    return { ok: true, data: user };
  }

  @Patch('me/preferences')
  async updatePreferences(
    @Headers('x-user-id') userId: string,
    @Body(new ZodValidationPipe(UserPreferencesSchema)) body: UserPreferences,
  ): Promise<ApiOk<User>> {
    if (!userId) throw new BadRequestException('Missing x-user-id header');
    const user = await this.authService.updatePreferences(userId, body);
    return { ok: true, data: user };
  }
}
