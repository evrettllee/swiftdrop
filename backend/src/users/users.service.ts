import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { and, eq, isNull, type SQL } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../common/constants/database.constants';
import { getUniqueViolationConstraint } from '../common/database/pg-errors';
import type { RoleName } from '../common/enums/role.enum';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.module';
import { roles, users } from '../db/schema';
import { USERS_CONFLICT_MESSAGES, USERS_ERROR_MESSAGES } from './users.constants';
import type { CreateUserInput, User, UserWithRole } from './users.types';

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findByEmail(email: string): Promise<UserWithRole | null> {
    return this.findActiveWithRole(eq(users.email, email));
  }

  async findById(userId: number): Promise<UserWithRole | null> {
    return this.findActiveWithRole(eq(users.userId, userId));
  }

  async create(input: CreateUserInput): Promise<User> {
    const { roleName, ...fields } = input;
    const roleId = await this.findRoleId(roleName);
    const createdUser = await this.insertUser({ ...fields, roleId });

    return createdUser;
  }

  // Used when an unverified account is claimed through a verified provider email:
  // the password may belong to someone who only knew the address, so it is dropped.
  async verifyEmailAndClearPassword(userId: number): Promise<void> {
    await this.db
      .update(users)
      .set({ emailVerifiedAt: new Date(), passwordHash: null })
      .where(eq(users.userId, userId));
  }

  private async findActiveWithRole(condition: SQL): Promise<UserWithRole | null> {
    const [row] = await this.db
      .select({ user: users, roleName: roles.name })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.roleId))
      .where(and(condition, isNull(users.deletedAt)))
      .limit(SINGLE_ROW_LIMIT);

    return row ? { ...row.user, roleName: row.roleName } : null;
  }

  private async insertUser(values: typeof users.$inferInsert): Promise<User> {
    try {
      const [createdUser] = await this.db.insert(users).values(values).returning();

      return createdUser;
    } catch (error) {
      throw this.toConflictException(error);
    }
  }

  // Unique violations become 409 with a field-specific message; other errors pass through.
  private toConflictException(error: unknown): unknown {
    const constraint = getUniqueViolationConstraint(error);
    const message = constraint === null ? undefined : USERS_CONFLICT_MESSAGES[constraint];

    return message === undefined ? error : new ConflictException(message);
  }

  private async findRoleId(roleName: RoleName): Promise<number> {
    const [role] = await this.db
      .select({ roleId: roles.roleId })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(SINGLE_ROW_LIMIT);

    if (!role) {
      throw new InternalServerErrorException(USERS_ERROR_MESSAGES.ROLE_NOT_FOUND);
    }

    return role.roleId;
  }
}
