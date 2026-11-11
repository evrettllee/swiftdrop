import { staffName } from '@/modules/support/mappers/support.mapper';
import type { MessageViewer } from '@/modules/support/types/support.types';
import { ORDER_ACTOR } from '../constants/manager-orders.constants';
import type {
  ManagerOrderDetails,
  ManagerOrderHistoryEntry,
  ManagerOrderTicket,
} from '../dto/manager-order-details.dto';
import type {
  HistoryRow,
  OfferRow,
  SettledPaymentRow,
  TicketRow,
} from '../utils/manager-order-related-queries';
import type { OrderDetailsRow } from '../utils/manager-order-row-query';
import { toActions, toActor, toPayment } from '../utils/order-detail-rules';

export type ManagerOrderDetailsRows = {
  order: OrderDetailsRow;
  payments: readonly SettledPaymentRow[];
  history: readonly HistoryRow[];
  offers: readonly OfferRow[];
  tickets: readonly TicketRow[];
};

type PersonName = { firstName: string; lastName: string };

const STAFF_VIEWER: MessageViewer = 'staff';

function fullName({ firstName, lastName }: PersonName): string {
  return `${firstName} ${lastName}`;
}

function toHistoryEntry(row: HistoryRow): ManagerOrderHistoryEntry {
  const { status, changedAt, changedBy, role, firstName, lastName, comment } = row;
  const actor = toActor(changedBy, role);
  const actorName =
    actor === ORDER_ACTOR.STAFF && firstName !== null && lastName !== null
      ? staffName(firstName, lastName, STAFF_VIEWER)
      : null;

  return { status, changedAt, actor, actorName, comment };
}

function toTicket({ userId, ...ticket }: TicketRow, clientId: number): ManagerOrderTicket {
  return { ...ticket, author: userId === clientId ? ORDER_ACTOR.CLIENT : ORDER_ACTOR.COURIER };
}

function toCourier(order: OrderDetailsRow): ManagerOrderDetails['courier'] {
  const { courierId, courier, vehicle } = order;

  return courierId === null || courier === null
    ? null
    : { id: courierId, name: fullName(courier), phone: courier.phone, vehicle };
}

export function toManagerOrderDetails(rows: ManagerOrderDetailsRows): ManagerOrderDetails {
  const { order } = rows;
  const { client } = order;

  return {
    id: order.orderId,
    status: order.status,
    createdAt: order.createdAt,
    statusChangedAt: order.statusChangedAt,
    finishedAt: order.finishedAt,
    estimatedDeliveryAt: order.estimatedDeliveryAt,
    client: { id: client.id, name: fullName(client), phone: client.phone, email: client.email },
    courier: toCourier(order),
    recipient: order.recipient,
    route: { from: order.pickup, to: order.delivery },
    parcel: order.parcel,
    pricing: {
      price: Number(order.price),
      coefficient: order.coefficient,
      distanceKm: order.distanceKm,
      estimatedMinutes: order.estimatedMinutes,
      tariffName: order.tariffName,
    },
    payment: toPayment(rows.payments),
    history: rows.history.map(toHistoryEntry),
    offers: rows.offers.map(({ courierId, vehicleType, ...offer }) => ({
      round: offer.round,
      courier: { id: courierId, name: fullName(offer), vehicleType },
      status: offer.status,
      pickupEtaSec: offer.pickupEtaSec,
      offeredAt: offer.offeredAt,
      respondedAt: offer.respondedAt,
    })),
    tickets: rows.tickets.map((ticket) => toTicket(ticket, client.id)),
    actions: toActions(order.status),
  };
}
