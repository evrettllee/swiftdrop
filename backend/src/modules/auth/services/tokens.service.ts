import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { and, eq, gt, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { refreshTokens } from '@/database/schema';
import {
  REFRESH_TOKEN_BYTES,
  REFRESH_REUSE_GRACE_MS,
  REFRESH_TOKEN_ENCODING,
  REFRESH_TOKEN_TTL_MS,
  TOKEN_HASH_ALGORITHM,
  TOKEN_HASH_ENCODING,
} from '../constants/tokens.constants';
import type { AccessTokenPayload } from '../types/auth.types';

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

  // Rotates the token in a single atomic UPDATE; returns the owner, or null if the token is not
  // usable. A token rotated a moment ago is accepted once more: two tabs refreshed at the same time.
  async consumeRefreshToken(token: string): Promise<number | null> {
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const [consumed] = await this.db
      .update(refreshTokens)
      .set({ revokedAt: now, rotatedAt: now })
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .returning({ userId: refreshTokens.userId });
    let userId: number | null = consumed?.userId ?? null;

    if (userId === null) {
      userId = await this.findRecentlyRotatedOwner(tokenHash, now);
    }

    if (userId === null) {
      await this.revokeAllIfReused(tokenHash);
    }

    return userId;
  }

  // A logout: the token is revoked without a rotation time, so it gets no grace window, and the
  // tokens it replaced a moment ago lose theirs, so none of them opens a session after the logout.
  async revokeRefreshToken(token: string): Promise<void> {
    const [revoked] = await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.tokenHash, this.hashToken(token)), isNull(refreshTokens.revokedAt)),
      )
      .returning({ userId: refreshTokens.userId });

    if (revoked) {
      await this.db
        .update(refreshTokens)
        .set({ rotatedAt: null })
        .where(and(eq(refreshTokens.userId, revoked.userId), isNotNull(refreshTokens.rotatedAt)));
    }
  }

  // Also takes the grace window away from tokens rotated a moment ago: after a theft is noticed,
  // none of the old tokens may open a session again.
  async revokeAllForUser(userId: number): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: sql`coalesce(${refreshTokens.revokedAt}, ${new Date()})`, rotatedAt: null })
      .where(
        and(
          eq(refreshTokens.userId, userId),
          or(isNull(refreshTokens.revokedAt), isNotNull(refreshTokens.rotatedAt)),
        ),
      );
  }

  hashToken(token: string): string {
    return createHash(TOKEN_HASH_ALGORITHM).update(token).digest(TOKEN_HASH_ENCODING);
  }

  // The owner of a token replaced by a rotation within the grace window, still unexpired. A token
  // revoked by a logout has no rotation time, so it never gets here.
  private async findRecentlyRotatedOwner(tokenHash: string, now: Date): Promise<number | null> {
    const graceStart = new Date(now.getTime() - REFRESH_REUSE_GRACE_MS);
    const [rotated] = await this.db
      .select({ userId: refreshTokens.userId })
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          gt(refreshTokens.rotatedAt, graceStart),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .limit(SINGLE_ROW_LIMIT);

    return rotated?.userId ?? null;
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
