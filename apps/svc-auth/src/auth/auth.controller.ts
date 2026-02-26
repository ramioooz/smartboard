import { BadRequestException, Body, Controller, Get, Headers, HttpCode, Post } from '@nestjs/common';
import type { ApiOk } from '@smartboard/shared';
import { DevLoginSchema } from '@smartboard/shared';
import type { User } from '@prisma/client';
import type { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown): Promise<ApiOk<User>> {
    const parsed = DevLoginSchema.safeParse(body);
    const email = parsed.success ? parsed.data.email : 'dev@local';
    const user = await this.authService.login(email);
    return { ok: true, data: user };
  }

  @Get('me')
  async me(@Headers('x-user-id') userId: string): Promise<ApiOk<User>> {
    if (!userId) {
      throw new BadRequestException('Missing x-user-id header');
    }
    const user = await this.authService.me(userId);
    return { ok: true, data: user };
  }
}
