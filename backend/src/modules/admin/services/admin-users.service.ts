import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, max, type SQL, sql } from 'drizzle-orm';
import { type ListFetch, paginate } from '@/common/database/paginate';
import { ROLE } from '@/common/enums/role.enum';
import type { ListPage, Page } from '@/common/types/page.types';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { roles, users } from '@/database/schema';
import { ADMIN_USER_SORT } from '../constants/admin-users.constants';
import type { AdminUserCountsDto, AdminUsersDto } from '../dto/admin-users.dto';
import type {
  AdminUserCounts,
  AdminUserListItem,
  AdminUsersPage,
  ManagedRole,
} from '../types/admin-users.types';
import { managedRole, USER_ROW_COLUMNS } from '../utils/admin-user-columns';
import { clientOrderCounts, courierPageStats } from '../utils/admin-user-stats';
import { ADMIN_USERS_SORT_SPEC, NAME_ORDER } from '../utils/admin-users-sort';
import { userSearchCondition } from '../utils/user-search';
import { deriveUserStatus, statusCondition } from '../utils/user-status';

function fetchUserRows(db: Database, options: ListFetch) {
  return db
    .select({ ...USER_ROW_COLUMNS, sortValue: options.sortValue })
    .from(users)
    .innerJoin(roles, eq(roles.roleId, users.roleId))
    .where(options.where)
    .orderBy(...options.orderBy)
    .limit(options.limit)
    .offset(options.offset);
}

type UserRow = Awaited<ReturnType<typeof fetchUserRows>>[number];

function asPage<T>(page: ListPage<T>): Page<T> {
  if (!('page' in page)) {
    throw new Error('The admin users list is paged by number only');
  }

  return page;
}

function roleCount(role: ManagedRole): SQL<number> {
  return sql<number>`(count(*) filter (where ${eq(roles.name, role)}))::int`;
}

function toItem(row: UserRow): AdminUserListItem {
  return {
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    status: deriveUserStatus(row),
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
  };
}

@Injectable()
export class AdminUsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(query: AdminUsersDto): Promise<AdminUsersPage> {
    const where = and(
      eq(roles.name, query.role),
      statusCondition(query.statuses),
      userSearchCondition(query.search),
    );
    const page = asPage(
      await paginate(query, {
        whitelist: ADMIN_USERS_SORT_SPEC.whitelist,
        idColumn: users.userId,
        where,
        orderBy: query.sortName === ADMIN_USER_SORT.NAME ? NAME_ORDER : undefined,
        fetch: (options) => fetchUserRows(this.db, options),
        count: (countWhere) => this.countWhere(countWhere),
        maxId: (maxWhere) => this.maxIdWhere(maxWhere),
        idOf: (row: UserRow) => row.userId,
      }),
    );

    return { ...page, items: await this.withStats(query.role, page.items.map(toItem)) };
  }

  async counts(query: AdminUserCountsDto): Promise<AdminUserCounts> {
    const [row] = await this.db
      .select({
        client: roleCount(ROLE.CLIENT),
        courier: roleCount(ROLE.COURIER),
        manager: roleCount(ROLE.MANAGER),
      })
      .from(users)
      .innerJoin(roles, eq(roles.roleId, users.roleId))
      .where(and(managedRole, statusCondition(query.statuses), userSearchCondition(query.search)));

    return { client: row.client, courier: row.courier, manager: row.manager };
  }

  private async withStats(
    role: ManagedRole,
    items: AdminUserListItem[],
  ): Promise<AdminUserListItem[]> {
    const ids = items.map((item) => item.userId);

    if (role === ROLE.CLIENT) {
      const totals = await clientOrderCounts(this.db, ids);

      return items.map((item) => ({ ...item, ordersCount: totals.get(item.userId) ?? 0 }));
    }

    if (role === ROLE.COURIER) {
      const stats = await courierPageStats(this.db, ids);

      return items.map((item) => ({
        ...item,
        vehicleType: stats.get(item.userId)?.vehicleType ?? null,
        deliveredCount: stats.get(item.userId)?.deliveredCount ?? 0,
      }));
    }

    return items;
  }

  private async countWhere(where: SQL | undefined): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(users)
      .innerJoin(roles, eq(roles.roleId, users.roleId))
      .where(where);

    return row.total;
  }

  private async maxIdWhere(where: SQL | undefined): Promise<number | null> {
    const [row] = await this.db
      .select({ maxId: max(users.userId) })
      .from(users)
      .innerJoin(roles, eq(roles.roleId, users.roleId))
      .where(where);

    return row.maxId;
  }
}
