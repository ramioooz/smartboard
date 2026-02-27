import { Module } from '@nestjs/common';
import { AuthClient } from '../../services/clients/auth.client';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [AuthClient],
})
export class AuthModule {}
