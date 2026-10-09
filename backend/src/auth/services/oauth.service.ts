import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../common/constants/database.constants';
import { ROLE } from '../../common/enums/role.enum';
import { DRIZZLE } from '../../database/database.constants';
import type { Database } from '../../database/database.module';
import { userOauthAccounts } from '../../db/schema';
import { UsersService } from '../../users/users.service';
import type { UserWithRole } from '../../users/users.types';
import { OAUTH_ERROR_MESSAGES } from '../constants/oauth.constants';
import type { OAuthProfile } from '../auth.types';
import { TokensService } from './tokens.service';

@Injectable()
export class OAuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {}

  async resolveUser(profile: OAuthProfile): Promise<UserWithRole> {
    const linkedUser = await this.findLinkedUser(profile);

    return linkedUser ?? (await this.linkOrCreateUser(profile));
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
    const user = existingUser
      ? await this.claimIfUnverified(existingUser)
      : await this.createClient(profile);

    await this.linkAccount(user.userId, profile);

    return user;
  }

  // The provider has proven ownership of the address, so credentials set earlier by anyone else are revoked.
  private async claimIfUnverified(user: UserWithRole): Promise<UserWithRole> {
    if (user.emailVerifiedAt === null) {
      await this.usersService.verifyEmailAndClearPassword(user.userId);
      await this.tokensService.revokeAllForUser(user.userId);
    }

    return user;
  }

  private async createClient(profile: OAuthProfile): Promise<UserWithRole> {
    const createdUser = await this.usersService.create({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: null,
      passwordHash: null,
      emailVerifiedAt: new Date(),
      roleName: ROLE.CLIENT,
    });

    return { ...createdUser, roleName: ROLE.CLIENT };
  }

  private async linkAccount(userId: number, profile: OAuthProfile): Promise<void> {
    await this.db.insert(userOauthAccounts).values({
      userId,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
    });
  }
}
