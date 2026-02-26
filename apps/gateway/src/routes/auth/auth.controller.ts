import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import { Public } from '../../common/decorators/public.decorator';
import { AuthClient } from '../../services/clients/auth.client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authClient: AuthClient) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.authClient.post<ApiOk<unknown>>('/auth/login', body);
  }

  @Get('me')
  async me(): Promise<ApiOk<unknown>> {
    return this.authClient.get<ApiOk<unknown>>('/auth/me');
  }

  @Patch('me/preferences')
  async updatePreferences(@Body() body: unknown): Promise<ApiOk<unknown>> {
    return this.authClient.patch<ApiOk<unknown>>('/auth/me/preferences', body);
  }
}
