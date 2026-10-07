import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq, gt, isNotNull, isNull } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../common/constants/database.constants';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.module';
import { refreshTokens } from '../db/schema';
import {
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_ENCODING,
  REFRESH_TOKEN_TTL_MS,
  TOKEN_HASH_ALGORITHM,
  TOKEN_HASH_ENCODING,
} from './constants/tokens.constants';
import type { AccessTokenPayload } from './auth.types';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(DRIZZLE) private readonly db: Database,
  ) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async createRefreshToken(userId: number): Promise<string> {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString(REFRESH_TOKEN_ENCODING);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return token;
  }

  // Revokes the token in a single atomic UPDATE; returns the owner, or null if the token is not usable.
  async consumeRefreshToken(token: string): Promise<number | null> {
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const [consumed] = await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .returning({ userId: refreshTokens.userId });

    if (!consumed) {
      await this.revokeAllIfReused(tokenHash);
    }

    return consumed?.userId ?? null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.tokenHash, this.hashToken(token)), isNull(refreshTokens.revokedAt)),
      );
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }

  hashToken(token: string): string {
    return createHash(TOKEN_HASH_ALGORITHM).update(token).digest(TOKEN_HASH_ENCODING);
  }

  // A revoked token showing up again means it was used twice: treat the whole account as compromised.
  private async revokeAllIfReused(tokenHash: string): Promise<void> {
    const [reused] = await this.db
      .select({ userId: refreshTokens.userId })
      .from(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNotNull(refreshTokens.revokedAt)))
      .limit(SINGLE_ROW_LIMIT);

    if (reused) {
      await this.revokeAllForUser(reused.userId);
    }
  }
}
