import type { OrderTransaction } from '@/common/database/order-status-transition';
import type { OfferNotifierService } from '@/modules/assignment/services/offer-notifier.service';
import type { CourierProfilesService } from '@/modules/couriers/services/courier-profiles.service';
import { ManagerCourierLockService } from '@/modules/manager/services/manager-courier-lock.service';
import type { OrderTransactionsService } from '@/modules/tracking/services/order-transactions.service';
import { queueDatabase } from './queue-database';

export const FAKE_PARCEL = {
  weightKg: 2.5,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 10,
  isFragile: false,
};

export const FAKE_CHECKS = {
  onShift: true,
  freshLocation: true,
  free: true,
  hasVehicle: true,
  vehicleFits: true,
};

export const FAKE_COURIER_ROW = {
  courierId: 3,
  firstName: 'Дмитрий',
  lastName: 'Соколов',
  vehicleType: 'car',
  pickupDistanceM: 900,
  positionAgeMs: 1000,
  hasOpenOffer: true,
  ...FAKE_CHECKS,
};

export function fakeOrderRow(status: string, courierId: number | null = null, round = 1) {
  return {
    orderId: 42,
    status,
    courierId,
    round,
    pickup: { latitude: 53.9, longitude: 27.55 },
    parcel: FAKE_PARCEL,
  };
}

export function fakeAssignment(results: unknown[][], failure?: Error) {
  const fake = queueDatabase(results);
  const log: string[] = [];
  const orderTxs: OrderTransaction[] = [];
  const run = jest.fn(async (work: (orderTx: OrderTransaction) => Promise<unknown>) => {
    const orderTx = { tx: fake.tx, statusChanges: [], courierChanges: [] };
    orderTxs.push(orderTx);
    const result = await work(orderTx);

    if (failure) {
      throw failure;
    }

    log.push('commit');

    return result;
  });
  const notifier = {
    withdraw: jest.fn((offerId: number) => log.push(`offer:closed ${offerId}`)),
    assigned: jest.fn((orderId: number, courierId: number) =>
      log.push(`order:assigned ${orderId} to ${courierId}`),
    ),
    unassigned: jest.fn((orderId: number, courierId: number) =>
      log.push(`order:unassigned ${orderId} from ${courierId}`),
    ),
  };
  const lockIsAvailable = jest.fn(() => {
    log.push('lock courier');

    return Promise.resolve(true);
  });
  const locks = new ManagerCourierLockService(
    fake.db,
    { run } as unknown as OrderTransactionsService,
    { lockIsAvailable } as unknown as CourierProfilesService,
    notifier as unknown as OfferNotifierService,
  );

  return {
    locks,
    notifier,
    notifierService: notifier as unknown as OfferNotifierService,
    log,
    fake,
    orderTxs,
  };
}

export function setCalls(fake: ReturnType<typeof queueDatabase>): unknown[] {
  return fake.calls.filter((call) => call.method === 'set').map((call) => call.args[0]);
}

export function insertCalls(fake: ReturnType<typeof queueDatabase>): unknown[] {
  return fake.calls.filter((call) => call.method === 'values').map((call) => call.args[0]);
}
