import type { AuthProvider, Session, User } from '@prisma/client';

export interface ExternalIdentity {
  provider: AuthProvider;
  externalId: string;
  email: string;
  name?: string;
}

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionResult {
  user: User;
  session: Session;
  accessToken: string;
  refreshToken: string;
}
