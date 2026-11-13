import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  SINGLE_ROW_LIMIT,
  USER_OAUTH_ACCOUNTS_PROVIDER_USER_UNIQUE,
} from '@/common/constants/database.constants';
import { getUniqueViolationConstraint } from '@/common/database/pg-errors';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { userOauthAccounts } from '@/database/schema';
import { UsersService } from '@/modules/users/services/users.service';
import type { UserWithRole } from '@/modules/users/types/users.types';
import { OAUTH_ERROR_MESSAGES } from '../constants/oauth.constants';
import { InvitePendingException } from '../errors/invite-pending.exception';
import type { OAuthProfile } from '../types/auth.types';
import { isInvitedStaff } from '../utils/invited-staff';
import { TokensService } from './tokens.service';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async resolveUser(profile: OAuthProfile): Promise<UserWithRole> {
    const linkedUser = await this.findLinkedUser(profile);

    if (linkedUser) {
      this.ensureNotInvited(linkedUser);

      return linkedUser;
    }

    return this.linkOrCreateUser(profile);
  }

  private ensureNotInvited(user: UserWithRole): void {
    if (isInvitedStaff(user)) {
      this.logger.warn(`OAuth sign-in of invited user ${user.userId} refused`);
      throw new InvitePendingException();
    }
  }

  private async findLinkedUser(profile: OAuthProfile): Promise<UserWithRole | null> {
    const [account] = await this.db
      .select({ userId: userOauthAccounts.userId })
      .from(userOauthAccounts)
      .where(
        and(
          eq(userOauthAccounts.provider, profile.provider),
          eq(userOauthAccounts.providerUserId, profile.providerUserId),
        ),
      )
      .limit(SINGLE_ROW_LIMIT);

    return account ? this.usersService.findById(account.userId) : null;
  }

  private async linkOrCreateUser(profile: OAuthProfile): Promise<UserWithRole> {
    if (!profile.emailVerified) {
      throw new UnauthorizedException(OAUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
    }

    const existingUser = await this.usersService.findByEmail(profile.email);

    if (existingUser) {
      this.ensureNotInvited(existingUser);
    }

    try {
      return await this.db.transaction(async (tx) => {
        const user = existingUser
          ? await this.claimIfUnverified(existingUser, tx)
          : await this.createClient(profile, tx);

        await this.linkAccount(tx, user.userId, profile);

        return user;
      });
    } catch (error) {
      if (getUniqueViolationConstraint(error) === USER_OAUTH_ACCOUNTS_PROVIDER_USER_UNIQUE) {
        this.logger.warn(`OAuth account of ${profile.provider} is linked to another account`);
        throw new UnauthorizedException(OAUTH_ERROR_MESSAGES.LOGIN_FAILED);
      }

      throw error;
    }
  }

  // The provider has proven ownership of the address, so credentials set earlier by anyone else are revoked.
  private async claimIfUnverified(user: UserWithRole, tx: Transaction): Promise<UserWithRole> {
    if (user.emailVerifiedAt === null) {
      await this.usersService.verifyEmailAndClearPassword(user.userId, tx);
      await this.tokensService.revokeAllForUser(user.userId, tx);
    }

    return user;
  }

  private async createClient(profile: OAuthProfile, tx: Transaction): Promise<UserWithRole> {
    const createdUser = await this.usersService.create(
      {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: null,
        passwordHash: null,
        emailVerifiedAt: new Date(),
        roleName: ROLE.CLIENT,
      },
      tx,
    );

    return { ...createdUser, roleName: ROLE.CLIENT };
  }

  private async linkAccount(tx: Transaction, userId: number, profile: OAuthProfile): Promise<void> {
    await tx.insert(userOauthAccounts).values({
      userId,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
    });
  }
}
