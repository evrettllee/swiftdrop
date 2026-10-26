import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ROLE, type RoleName } from '@/common/enums/role.enum';
import { UsersService } from '@/modules/users/services/users.service';
import type { User, UserWithRole } from '@/modules/users/types/users.types';
import { AUTH_ERROR_MESSAGES } from '../constants/access.constants';
import { toAuthUser } from '../mappers/auth-user.mapper';
import type { AuthResult, OAuthProfile } from '../types/auth.types';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';
import { OAuthService } from './oauth.service';
import { PasswordService } from './password.service';
import { TokensService } from './tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokensService: TokensService,
    private readonly oauthService: OAuthService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      roleName: ROLE.CLIENT,
    });

    return this.buildAuthResult(user, ROLE.CLIENT);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(dto.email);
    const isPasswordValid = await this.passwordService.verify(
      user?.passwordHash ?? null,
      dto.password,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    this.ensureNotBlocked(user);

    return this.buildAuthResult(user, user.roleName);
  }

  async loginWithOAuth(profile: OAuthProfile): Promise<AuthResult> {
    const user = await this.oauthService.resolveUser(profile);

    this.ensureNotBlocked(user);

    return this.buildAuthResult(user, user.roleName);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    const userId = refreshToken ? await this.tokensService.consumeRefreshToken(refreshToken) : null;
    const user = userId === null ? null : await this.usersService.findById(userId);

    if (!user || user.isBlocked) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_SESSION);
    }

    return this.buildAuthResult(user, user.roleName);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.tokensService.revokeRefreshToken(refreshToken);
    }
  }

  private ensureNotBlocked(user: UserWithRole): void {
    if (user.isBlocked) {
      throw new ForbiddenException(AUTH_ERROR_MESSAGES.ACCOUNT_BLOCKED);
    }
  }

  private async buildAuthResult(user: User, role: RoleName): Promise<AuthResult> {
    const accessToken = await this.tokensService.signAccessToken({
      sub: String(user.userId),
      role,
    });
    const refreshToken = await this.tokensService.createRefreshToken(user.userId);

    return { user: toAuthUser(user, role), accessToken, refreshToken };
  }
}
