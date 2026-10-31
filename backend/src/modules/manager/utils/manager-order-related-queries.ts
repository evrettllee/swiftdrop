import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import type { Database } from '@/database/database.module';
import {
  courierProfiles,
  orderOffers,
  orderStatusHistory,
  payments,
  roles,
  supportTickets,
  users,
  vehicles,
} from '@/database/schema';

export function findSettledPayments(db: Database, orderId: number) {
  return db
    .select({ status: payments.status, paidAt: payments.paidAt, refundedAt: payments.refundedAt })
    .from(payments)
    .where(
      and(
        eq(payments.orderId, orderId),
        inArray(payments.status, [PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUNDED]),
      ),
    )
    .orderBy(asc(payments.paymentId));
}

export function findHistory(db: Database, orderId: number) {
  return db
    .select({
      status: orderStatusHistory.status,
      changedAt: orderStatusHistory.changedAt,
      changedBy: orderStatusHistory.changedBy,
      role: roles.name,
      comment: orderStatusHistory.comment,
    })
    .from(orderStatusHistory)
    .leftJoin(users, eq(users.userId, orderStatusHistory.changedBy))
    .leftJoin(roles, eq(roles.roleId, users.roleId))
    .where(eq(orderStatusHistory.orderId, orderId))
    .orderBy(asc(orderStatusHistory.changedAt), asc(orderStatusHistory.statusHistoryId));
}

export function findOffers(db: Database, orderId: number) {
  return db
    .select({
      round: orderOffers.round,
      courierId: orderOffers.courierId,
      firstName: users.firstName,
      lastName: users.lastName,
      vehicleType: vehicles.type,
      status: orderOffers.status,
      pickupEtaSec: orderOffers.pickupEtaSec,
      offeredAt: orderOffers.offeredAt,
      respondedAt: orderOffers.respondedAt,
    })
    .from(orderOffers)
    .innerJoin(courierProfiles, eq(courierProfiles.courierProfileId, orderOffers.courierId))
    .innerJoin(users, eq(users.userId, courierProfiles.userId))
    .leftJoin(vehicles, eq(vehicles.courierProfileId, orderOffers.courierId))
    .where(eq(orderOffers.orderId, orderId))
    .orderBy(asc(orderOffers.round), asc(orderOffers.offeredAt), asc(orderOffers.offerId));
}

export function findTickets(db: Database, orderId: number) {
  return db
    .select({
      id: supportTickets.ticketId,
      topic: supportTickets.topic,
      subject: supportTickets.subject,
      status: supportTickets.status,
      awaitingStaff: supportTickets.awaitingStaff,
      lastMessageAt: supportTickets.lastMessageAt,
      userId: supportTickets.userId,
    })
    .from(supportTickets)
    .where(eq(supportTickets.orderId, orderId))
    .orderBy(
      desc(supportTickets.awaitingStaff),
      desc(supportTickets.lastMessageAt),
      desc(supportTickets.ticketId),
    );
}

export type SettledPaymentRow = Awaited<ReturnType<typeof findSettledPayments>>[number];
export type HistoryRow = Awaited<ReturnType<typeof findHistory>>[number];
export type OfferRow = Awaited<ReturnType<typeof findOffers>>[number];
export type TicketRow = Awaited<ReturnType<typeof findTickets>>[number];
