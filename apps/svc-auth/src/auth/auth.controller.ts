import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Patch, Post } from '@nestjs/common';
import type { ApiOk, UserPreferences } from '@smartboard/shared';
import { DevLoginSchema, UserPreferencesSchema } from '@smartboard/shared';
import { ZodValidationPipe } from '@smartboard/nest-common';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown): Promise<ApiOk<User>> {
    // Lenient — defaults to 'dev@local' if body is missing or invalid
    const parsed = DevLoginSchema.safeParse(body);
    const email = parsed.success ? parsed.data.email : 'dev@local';
    const user = await this.authService.login(email);
    return { ok: true, data: user };
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
