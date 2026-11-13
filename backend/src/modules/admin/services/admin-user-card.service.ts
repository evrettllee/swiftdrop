import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, type SQL } from 'drizzle-orm';
import { ADMIN_ACTION, type AdminAction } from '@/common/enums/admin-action.enum';
import { OAUTH_PROVIDER } from '@/common/enums/oauth-provider.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import {
  MANAGED_ROLES,
  USER_NOT_FOUND_MESSAGE,
  USER_STATUS,
} from '../constants/admin-users.constants';
import { parseActionDetails } from '../schemas/admin-action-details.schema';
import type {
  AdminUserCard,
  AdminUserCourier,
  AdminUserHistoryEntry,
  AdminUserOrders,
  PersonName,
} from '../types/admin-users.types';
import {
  countOrders,
  findActiveInvite,
  findActiveOrderId,
  findCardUser,
  findHistory,
  findLatestAction,
  findProviders,
  findRecentOrders,
} from '../utils/admin-user-card-queries';
import { deriveUserStatus } from '../utils/user-status';

type CardUser = NonNullable<Awaited<ReturnType<typeof findCardUser>>>;
type ActionRow = NonNullable<Awaited<ReturnType<typeof findLatestAction>>>;
type HistoryRow = Awaited<ReturnType<typeof findHistory>>[number];

const EMPTY_ORDERS: AdminUserOrders = { total: 0, delivered: 0, cancelled: 0, recent: [] };

function personOf(row: PersonName): PersonName {
  return { firstName: row.firstName, lastName: row.lastName };
}

function blockOf(row: ActionRow | null): AdminUserCard['block'] {
  if (!row) {
    return null;
  }

  const details = parseActionDetails(ADMIN_ACTION.USER_BLOCKED, row.details);

  return {
    reason: 'reason' in details ? details.reason : null,
    at: row.at,
    by: personOf(row),
  };
}

function courierOf(
  user: CardUser,
  stats: AdminUserOrders,
  activeOrderId: number | null,
): AdminUserCourier {
  return {
    vehicleType: user.vehicleType,
    deliveredCount: stats.delivered,
    cancelledCount: stats.cancelled,
    isAvailable: user.isAvailable ?? false,
    activeOrderId,
  };
}

function historyEntryOf(row: HistoryRow): AdminUserHistoryEntry {
  return {
    action: row.action,
    at: row.at,
    actor: personOf(row),
    details: parseActionDetails(row.action, row.details),
  };
}

function orderOwner(user: CardUser): SQL | null {
  if (user.roleName === ROLE.CLIENT) {
    return eq(orders.clientId, user.userId);
  }

  return user.roleName === ROLE.COURIER && user.courierProfileId !== null
    ? eq(orders.courierId, user.courierProfileId)
    : null;
}

@Injectable()
export class AdminUserCardService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async get(userId: number): Promise<AdminUserCard> {
    const user = await findCardUser(this.db, userId);
    const role = MANAGED_ROLES.find((managed) => managed === user?.roleName);

    if (!user || !role) {
      throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    }

    const status = deriveUserStatus(user);
    const [providers, block, deletion, invite, orderStats, activeOrderId, history] =
      await Promise.all([
        findProviders(this.db, userId),
        this.latestIf(user.isBlocked && user.deletedAt === null, userId, ADMIN_ACTION.USER_BLOCKED),
        this.latestIf(user.deletedAt !== null, userId, ADMIN_ACTION.USER_DELETED),
        status === USER_STATUS.INVITED ? findActiveInvite(this.db, userId) : null,
        this.ordersOf(user),
        user.courierProfileId === null ? null : findActiveOrderId(this.db, user.courierProfileId),
        findHistory(this.db, userId),
      ]);
    const providerSet = new Set(providers.map((row) => row.provider));

    return {
      userId: user.userId,
      role,
      status,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      login: {
        password: user.hasPassword,
        google: providerSet.has(OAUTH_PROVIDER.GOOGLE),
        yandex: providerSet.has(OAUTH_PROVIDER.YANDEX),
      },
      block: blockOf(block),
      invite,
      deletion: deletion ? { at: deletion.at, by: personOf(deletion) } : null,
      courier: role === ROLE.COURIER ? courierOf(user, orderStats, activeOrderId) : null,
      orders: orderStats,
      history: history.map(historyEntryOf),
    };
  }

  private latestIf(condition: boolean, userId: number, action: AdminAction) {
    return condition ? findLatestAction(this.db, userId, action) : Promise.resolve(null);
  }

  private async ordersOf(user: CardUser): Promise<AdminUserOrders> {
    const owner = orderOwner(user);

    if (owner === null) {
      return EMPTY_ORDERS;
    }

    const isClient = user.roleName === ROLE.CLIENT;
    const [totals, recent] = await Promise.all([
      countOrders(this.db, owner),
      findRecentOrders(this.db, owner),
    ]);

    return {
      ...totals,
      recent: recent.map((row) => ({
        orderId: row.orderId,
        createdAt: row.createdAt,
        from: `${row.fromStreet}, ${row.fromHouse}`,
        to: `${row.toStreet}, ${row.toHouse}`,
        price: isClient ? Number(row.price) : null,
        status: row.status,
      })),
    };
  }
}
