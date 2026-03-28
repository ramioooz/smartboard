import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionRevocationService } from './session-revocation.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionRevocationService],
  exports: [SessionRevocationService],
})
export class AuthModule {}
