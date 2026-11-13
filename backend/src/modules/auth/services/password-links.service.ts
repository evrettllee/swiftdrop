import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import { ROW_LOCK_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { passwordResetTokens, roles, users } from '@/database/schema';
import type { UserWithRole } from '@/modules/users/types/users.types';
import {
  PASSWORD_LINK_LOG_MESSAGES as LOG,
  PASSWORD_LINK_ROLES,
  PASSWORD_LINK_TOKEN_BYTES,
  PASSWORD_LINK_TOKEN_PATTERN,
  PASSWORD_LINK_TTL_MS,
} from '../constants/password-links.constants';
import type {
  IssuedPasswordLink,
  IssuePasswordLinkInput,
  PasswordLinkInfo,
} from '../types/password-links.types';
import { generateOpaqueToken, hashOpaqueToken } from '../utils/opaque-token';
import { TokensService } from './tokens.service';

const NOW = sql`now()`;

export function isWellFormedLinkToken(token: string): boolean {
  return PASSWORD_LINK_TOKEN_PATTERN.test(token);
}

function usableLink(token: string): SQL | undefined {
  return and(
    eq(passwordResetTokens.tokenHash, hashOpaqueToken(token)),
    isNull(passwordResetTokens.usedAt),
    gt(passwordResetTokens.expiresAt, NOW),
    isNull(users.deletedAt),
    eq(users.isBlocked, false),
    inArray(roles.name, PASSWORD_LINK_ROLES),
  );
}

@Injectable()
export class PasswordLinksService {
  private readonly logger = new Logger(PasswordLinksService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly tokens: TokensService,
  ) {}

  async issue(tx: Transaction, input: IssuePasswordLinkInput): Promise<IssuedPasswordLink> {
    const token = generateOpaqueToken(PASSWORD_LINK_TOKEN_BYTES);
    const expiresAt = new Date(Date.now() + PASSWORD_LINK_TTL_MS[input.kind]);

    await this.invalidateAll(tx, input.userId);
    await tx.insert(passwordResetTokens).values({
      userId: input.userId,
      kind: input.kind,
      createdBy: input.createdBy,
      tokenHash: hashOpaqueToken(token),
      expiresAt,
    });
    this.logger.log(`${LOG.ISSUED}: user ${input.userId}, ${input.kind}`);

    return { token, expiresAt };
  }

  async findActive(token: string): Promise<PasswordLinkInfo | null> {
    if (!isWellFormedLinkToken(token)) {
      return null;
    }

    const [row] = await this.db
      .select({
        kind: passwordResetTokens.kind,
        firstName: users.firstName,
        email: users.email,
        role: roles.name,
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(users.userId, passwordResetTokens.userId))
      .innerJoin(roles, eq(roles.roleId, users.roleId))
      .where(usableLink(token))
      .limit(SINGLE_ROW_LIMIT);

    const role = PASSWORD_LINK_ROLES.find((allowed) => allowed === row?.role);

    return row && role
      ? { kind: row.kind, firstName: row.firstName, email: row.email, role }
      : null;
  }

  async setPassword(token: string, passwordHash: string): Promise<UserWithRole | null> {
    if (!isWellFormedLinkToken(token)) {
      return null;
    }

    const user = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .select({ user: users, roleName: roles.name })
        .from(passwordResetTokens)
        .innerJoin(users, eq(users.userId, passwordResetTokens.userId))
        .innerJoin(roles, eq(roles.roleId, users.roleId))
        .where(usableLink(token))
        .limit(SINGLE_ROW_LIMIT)
        .for(ROW_LOCK_UPDATE, { of: passwordResetTokens });

      if (!row) {
        return null;
      }

      const { userId } = row.user;

      await tx
        .update(users)
        .set({ passwordHash, emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())` })
        .where(eq(users.userId, userId));
      await this.invalidateAll(tx, userId);
      await this.tokens.revokeAllForUser(userId, tx);

      return { ...row.user, passwordHash, roleName: row.roleName };
    });

    this.logger.log(user ? `${LOG.USED}: user ${user.userId}` : LOG.REJECTED);

    return user;
  }

  async invalidateAll(tx: Transaction, userId: number): Promise<void> {
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: NOW })
      .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
  }
}
