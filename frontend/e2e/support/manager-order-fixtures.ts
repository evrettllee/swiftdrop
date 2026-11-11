import { ORDER_STATUS, type OrderStatus } from '../../src/shared/api/endpoints/order';
import type { ManagerOrderActions } from '../../src/shared/staff-api/manager-order';
import { fromFixedNow } from './clock';

export const MANAGER_ORDER_ID = 48231;
export const COURIER_ID = 12;
export const COURIER_POINT = { latitude: 53.905, longitude: 27.54 };

const MINUTE = 60_000;

function minutesAgo(minutes: number): string {
  return fromFixedNow(-minutes * MINUTE).toISOString();
}

export function minutesAhead(minutes: number): string {
  return fromFixedNow(minutes * MINUTE).toISOString();
}

const POINT = { city: 'Минск', house: '120', apartment: null };

type HistoryEntry = {
  status: OrderStatus;
  changedAt: string;
  actor: string;
  actorName: string | null;
  comment: string | null;
};

function entry(status: OrderStatus, minutes: number, actor = 'system'): HistoryEntry {
  return { status, changedAt: minutesAgo(minutes), actor, actorName: null, comment: null };
}

function offer(courierId: number, name: string, status: string, minutes: number) {
  return {
    round: 1,
    courier: { id: courierId, name, vehicleType: 'car' },
    status,
    pickupEtaSec: 6 * 60,
    offeredAt: minutesAgo(minutes),
    respondedAt: null,
  };
}

const NO_ACTIONS: ManagerOrderActions = {
  canAssign: false,
  canReassign: false,
  canRestartAutoAssign: false,
  canCancel: false,
};

export function awaitingOrder() {
  return {
    id: MANAGER_ORDER_ID,
    status: ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT as OrderStatus,
    createdAt: minutesAgo(41),
    statusChangedAt: minutesAgo(35),
    finishedAt: null as string | null,
    estimatedDeliveryAt: null as string | null,
    client: { id: 7, name: 'Виктор Шуляк', phone: '+375259041162', email: 'v.shulyak@mail.by' },
    courier: null as object | null,
    recipient: { name: 'Светлана Шуляк', phone: '+375294056318' },
    route: {
      from: { ...POINT, street: 'ул. Богдановича', latitude: 53.9201, longitude: 27.5753 },
      to: { ...POINT, street: 'ул. Кирова', latitude: 53.8962, longitude: 27.5519 },
    },
    parcel: { weight: 2.5, length: 35, width: 25, height: 15, fragile: false },
    pricing: {
      price: 12.3,
      coefficient: 1,
      distanceKm: 9.41,
      estimatedMinutes: 27,
      tariffName: 'Минск, стандарт',
    },
    payment: {
      state: 'paid',
      paidAt: minutesAgo(40) as string | null,
      refundedAt: null as string | null,
    },
    history: [
      entry(ORDER_STATUS.PENDING, 41, 'client'),
      entry(ORDER_STATUS.CONFIRMED, 40),
      entry(ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT, 35),
    ],
    offers: [
      offer(1, 'Дмитрий Соколов', 'expired', 40),
      offer(2, 'Алина Гордей', 'declined', 39),
      offer(3, 'Никита Волчек', 'revoked', 38),
    ],
    tickets: [] as object[],
    actions: { ...NO_ACTIONS, canAssign: true, canRestartAutoAssign: true, canCancel: true },
  };
}

export type RawManagerOrder = ReturnType<typeof awaitingOrder>;

export function assignedOrder(): RawManagerOrder {
  const order = awaitingOrder();

  return {
    ...order,
    status: ORDER_STATUS.COURIER_ASSIGNED,
    statusChangedAt: minutesAgo(3),
    estimatedDeliveryAt: minutesAhead(40),
    courier: {
      id: COURIER_ID,
      name: 'Андрей Король',
      phone: '+375293771290',
      vehicle: { type: 'car', brand: 'Renault', model: 'Logan', plate: '4521 KE-7' },
    },
    history: [
      ...order.history,
      { ...entry(ORDER_STATUS.COURIER_ASSIGNED, 3, 'staff'), actorName: 'Ольга М.' },
    ],
    tickets: [
      {
        id: 91,
        topic: 'order_problem',
        subject: 'Курьер не может найти подъезд',
        status: 'open',
        awaitingStaff: true,
        lastMessageAt: minutesAgo(4),
        author: 'client',
      },
    ],
    actions: { ...NO_ACTIONS, canReassign: true, canRestartAutoAssign: true, canCancel: true },
  };
}

export function deliveredOrder(): RawManagerOrder {
  const order = assignedOrder();

  return {
    ...order,
    status: ORDER_STATUS.DELIVERED,
    finishedAt: minutesAgo(1),
    statusChangedAt: minutesAgo(1),
    history: [...order.history, entry(ORDER_STATUS.DELIVERED, 1, 'courier')],
    tickets: [],
    actions: NO_ACTIONS,
  };
}

export function cancelledOrder(): RawManagerOrder {
  const order = awaitingOrder();

  return {
    ...order,
    status: ORDER_STATUS.CANCELLED,
    statusChangedAt: minutesAgo(2),
    payment: { state: 'refunded', paidAt: minutesAgo(40), refundedAt: minutesAgo(2) },
    history: [
      ...order.history,
      {
        ...entry(ORDER_STATUS.CANCELLED, 2, 'staff'),
        actorName: 'Ольга М.',
        comment: 'Адрес доставки вне зоны',
      },
    ],
    actions: NO_ACTIONS,
  };
}
