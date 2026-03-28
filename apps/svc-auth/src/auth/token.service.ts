import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { requireEnv } from '@smartboard/shared';

@Injectable()
export class TokenService {
  issueAccessToken(params: { userId: string; sessionId: string }): string {
    const expiresIn = (process.env['JWT_EXPIRES_IN'] ?? '15m') as SignOptions['expiresIn'];
    const issuer = process.env['JWT_ISSUER'] ?? 'smartboard-auth';
    const audience = process.env['JWT_AUDIENCE'] ?? 'smartboard-web';

    return sign(
      {
        sub: params.userId,
        sid: params.sessionId,
      },
      requireEnv('JWT_SECRET'),
      {
        expiresIn,
        issuer,
        audience,
      },
    );
  }

  issueRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
