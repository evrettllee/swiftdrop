import { ORDER_STATUS } from '@/shared/api';
import type { ManagerOrderDetails } from '@/shared/staff-api';

export const START_MS = Date.parse('2026-10-26T11:47:00Z');
export const MINUTE = 60_000;

export function at(minutes: number): Date {
  return new Date(START_MS + minutes * MINUTE);
}

const POINT = {
  city: 'Минск',
  street: 'ул. Кирова',
  house: '8',
  apartment: null,
  latitude: 53.9,
  longitude: 27.55,
};

export const BASE_HISTORY: ManagerOrderDetails['history'] = [
  {
    status: ORDER_STATUS.PENDING,
    changedAt: at(0),
    actor: 'client',
    actorName: null,
    comment: null,
  },
  {
    status: ORDER_STATUS.CONFIRMED,
    changedAt: at(1),
    actor: 'system',
    actorName: null,
    comment: null,
  },
];

export function managerOrder(patch: Partial<ManagerOrderDetails> = {}): ManagerOrderDetails {
  return {
    id: 48231,
    status: ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
    createdAt: at(0),
    statusChangedAt: at(6),
    finishedAt: null,
    estimatedDeliveryAt: null,
    client: { id: 7, name: 'Виктор Шуляк', phone: '+375259041162', email: 'v@mail.by' },
    courier: null,
    recipient: { name: 'Светлана Шуляк', phone: '+375294056318' },
    route: { from: POINT, to: POINT },
    parcel: { weight: 2.5, length: 35, width: 25, height: 15, fragile: false },
    pricing: {
      price: 12.3,
      coefficient: 1,
      distanceKm: 9.41,
      estimatedMinutes: 27,
      tariffName: 'Минск, стандарт',
    },
    payment: { state: 'paid', paidAt: at(1), refundedAt: null },
    history: [
      ...BASE_HISTORY,
      {
        status: ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
        changedAt: at(6),
        actor: 'system',
        actorName: null,
        comment: null,
      },
    ],
    offers: [],
    tickets: [],
    actions: { canAssign: true, canReassign: false, canRestartAutoAssign: true, canCancel: true },
    ...patch,
  };
}
