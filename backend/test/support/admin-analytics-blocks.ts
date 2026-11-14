import { eq } from 'drizzle-orm';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import type { ServiceName } from '@/common/enums/service-name.enum';
import {
  SUPPORT_TICKET_STATUS,
  TICKET_TOPIC,
  type TicketTopic,
} from '@/common/enums/support-ticket.enum';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, serviceFailures, supportTickets } from '@/database/schema';
import { insertUser } from './admin';

export type TicketSeed = {
  userId: number;
  topic: TicketTopic;
  createdAt: string;
  respondedAfterMin?: number;
  closed?: boolean;
};

export type FailureSeed = {
  service: ServiceName;
  code: string;
  lastAt: string;
  firstAt?: string;
  repeats?: number;
  message?: string;
};

export type CourierSeed = {
  email: string;
  onShift?: boolean;
  isBlocked?: boolean;
  deleted?: boolean;
  invited?: boolean;
};

const MINUTE_MS = 60_000;

export async function insertCourier(db: Database, seed: CourierSeed): Promise<number> {
  const userId = await insertUser(db, {
    role: ROLE.COURIER,
    email: seed.email,
    isBlocked: seed.isBlocked ?? false,
    deletedAt: seed.deleted ? new Date('2026-09-01T00:00:00Z') : null,
    ...(seed.invited ? { passwordHash: null } : {}),
  });
  const [profile] = await db
    .insert(courierProfiles)
    .values({ userId, isAvailable: seed.onShift ?? false })
    .returning({ courierProfileId: courierProfiles.courierProfileId });

  return profile.courierProfileId;
}

export async function insertTickets(db: Database, seeds: TicketSeed[]): Promise<void> {
  await db.insert(supportTickets).values(
    seeds.map((seed) => {
      const createdAt = new Date(seed.createdAt);
      const respondedAt =
        seed.respondedAfterMin === undefined
          ? null
          : new Date(createdAt.getTime() + seed.respondedAfterMin * MINUTE_MS);

      return {
        userId: seed.userId,
        topic: seed.topic,
        subject: seed.topic === TICKET_TOPIC.OTHER ? 'Вопрос по доставке' : null,
        status: seed.closed ? SUPPORT_TICKET_STATUS.CLOSED : SUPPORT_TICKET_STATUS.OPEN,
        closedAt: seed.closed ? new Date(createdAt.getTime() + 120 * MINUTE_MS) : null,
        createdAt,
        lastMessageAt: createdAt,
        firstResponseAt: respondedAt,
      };
    }),
  );
}

export async function insertFailures(db: Database, seeds: FailureSeed[]): Promise<void> {
  await db.insert(serviceFailures).values(
    seeds.map((seed) => ({
      service: seed.service,
      code: seed.code,
      message: seed.message ?? 'Connection timed out',
      firstAt: new Date(seed.firstAt ?? seed.lastAt),
      lastAt: new Date(seed.lastAt),
      repeats: seed.repeats ?? 1,
    })),
  );
}

export type OrderSeed = {
  clientId: number;
  createdAt: string;
  status?: OrderStatus;
  finishedAt?: string;
  courierId?: number;
};

export async function shapeOrders(db: Database, ids: number[], seeds: OrderSeed[]) {
  for (const [index, seed] of seeds.entries()) {
    await db
      .update(orders)
      .set({
        clientId: seed.clientId,
        createdAt: new Date(seed.createdAt),
        ...(seed.status ? { status: seed.status } : {}),
        finishedAt: seed.finishedAt ? new Date(seed.finishedAt) : null,
        courierId: seed.courierId ?? null,
      })
      .where(eq(orders.orderId, ids[index]));
  }
}
