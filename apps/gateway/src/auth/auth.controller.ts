import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { Throttle, minutes, hours } from '@nestjs/throttler';
import type { ApiOk } from '@smartboard/shared';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.authService.post<ApiOk<unknown>>('/auth/login', body);
  }

  @Get('me')
  async me(): Promise<ApiOk<unknown>> {
    return this.authService.get<ApiOk<unknown>>('/auth/me');
  }

  @Patch('me/preferences')
  async updatePreferences(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.authService.patch<ApiOk<unknown>>('/auth/me/preferences', body);
  }
}
