import { ORDER_ACTOR } from '../constants/manager-orders.constants';
import type { ManagerOrderDetails, ManagerOrderTicket } from '../dto/manager-order-details.dto';
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

function fullName({ firstName, lastName }: PersonName): string {
  return `${firstName} ${lastName}`;
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
    history: rows.history.map(({ status, changedAt, changedBy, role, comment }) => ({
      status,
      changedAt,
      actor: toActor(changedBy, role),
      comment,
    })),
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
