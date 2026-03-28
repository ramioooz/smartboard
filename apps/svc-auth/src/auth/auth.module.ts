import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OidcService } from './oidc.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, OidcService, SessionService, TokenService],
})
export class AuthModule {}
