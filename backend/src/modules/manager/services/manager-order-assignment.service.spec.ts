import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseError } from 'pg';
import {
  FAKE_CHECKS,
  FAKE_COURIER_ROW,
  fakeAssignment,
  fakeOrderRow,
} from '@test/support/manager-assignment-fakes';
import { ManagerOrderAssignmentService } from './manager-order-assignment.service';

const ORDER = fakeOrderRow('confirmed');
const COURIER = FAKE_COURIER_ROW;
const CHECKS = FAKE_CHECKS;
const CHANGED = {
  orderId: 42,
  status: 'courier_assigned',
  estimatedDeliveryAt: null,
  statusChangedAt: new Date(),
  courierId: 3,
};

function setUp(results: unknown[][], failure?: Error) {
  const fakes = fakeAssignment(results, failure);
  const service = new ManagerOrderAssignmentService(fakes.locks, fakes.notifierService);

  return { ...fakes, service };
}

const rejection = async (promise: Promise<unknown>) =>
  (await promise.catch((caught: unknown) => caught)) as ConflictException;

describe('ManagerOrderAssignmentService', () => {
  it('should assign, then tell the revoked couriers and the assigned one after the commit', async () => {
    const { service, log, fake } = setUp([
      [ORDER],
      [{ offerId: 5, courierId: 9 }],
      [{ offerId: 6, courierId: 3 }],
      [{ ...COURIER, ...CHECKS }],
      [CHANGED],
      [],
    ]);

    await expect(service.assign(7, 42, 3)).resolves.toEqual({ orderId: 42, courierId: 3 });

    expect(log).toEqual([
      'lock courier',
      'commit',
      'offer:closed 5',
      'offer:closed 6',
      'order:assigned 42 to 3',
    ]);
    expect(fake.calls.find((call) => call.method === 'for')?.args[0]).toBe('update');
    expect(fake.calls.filter((call) => call.method === 'set').map((call) => call.args[0])).toEqual([
      { status: 'revoked' },
      { status: 'revoked' },
      expect.objectContaining({ status: 'courier_assigned', courierId: 3 }),
    ]);
  });

  it('should refuse an order that cannot be assigned with ORDER_NOT_ASSIGNABLE and tell nobody', async () => {
    const { service, notifier } = setUp([[{ ...ORDER, status: 'courier_assigned' }]]);

    const error = await rejection(service.assign(7, 42, 3));

    expect(error.getResponse()).toMatchObject({ statusCode: 409, code: 'ORDER_NOT_ASSIGNABLE' });
    expect(notifier.withdraw).not.toHaveBeenCalled();
    expect(notifier.assigned).not.toHaveBeenCalled();
  });

  it.each([
    [{ onShift: false }, 'offline'],
    [{ freshLocation: false }, 'stale_location'],
    [{ free: false }, 'busy'],
    [{ vehicleFits: false }, 'vehicle_mismatch'],
    [{ hasVehicle: false, vehicleFits: false }, 'no_vehicle'],
  ])(
    'should refuse a courier with %j as COURIER_NOT_AVAILABLE %s and roll back',
    async (failed, reason) => {
      const { service, notifier } = setUp([
        [ORDER],
        [{ offerId: 5, courierId: 9 }],
        [],
        [{ ...COURIER, ...CHECKS, ...failed }],
      ]);

      const error = await rejection(service.assign(7, 42, 3));

      expect(error.getResponse()).toMatchObject({ code: 'COURIER_NOT_AVAILABLE', reason });
      expect(notifier.withdraw).not.toHaveBeenCalled();
      expect(notifier.assigned).not.toHaveBeenCalled();
    },
  );

  it('should answer 404 for a missing order and for an unknown courier', async () => {
    await expect(setUp([[]]).service.assign(7, 42, 3)).rejects.toThrow(NotFoundException);
    await expect(setUp([[ORDER], [], [], []]).service.assign(7, 42, 3)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should send nothing when the transaction rolls back after the change', async () => {
    const { service, notifier, log } = setUp(
      [[ORDER], [{ offerId: 5, courierId: 9 }], [], [{ ...COURIER, ...CHECKS }], [CHANGED], []],
      new Error('rolled back'),
    );

    await expect(service.assign(7, 42, 3)).rejects.toThrow('rolled back');

    expect(log).toEqual(['lock courier']);
    expect(notifier.withdraw).not.toHaveBeenCalled();
    expect(notifier.assigned).not.toHaveBeenCalled();
  });

  it('should report a second active order of the courier as busy', async () => {
    const violation = Object.assign(new DatabaseError('duplicate key', 0, 'error'), {
      code: '23505',
      constraint: 'orders_one_active_per_courier_uidx',
    });
    const { service } = setUp(
      [[ORDER], [], [], [{ ...COURIER, ...CHECKS }], [CHANGED], []],
      violation,
    );

    const error = await rejection(service.assign(7, 42, 3));

    expect(error.getResponse()).toMatchObject({ code: 'COURIER_NOT_AVAILABLE', reason: 'busy' });
  });
});
