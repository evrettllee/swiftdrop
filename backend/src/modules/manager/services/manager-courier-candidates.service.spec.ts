import { ConflictException, NotFoundException } from '@nestjs/common';
import { queueDatabase } from '@test/support/queue-database';
import { courierCandidatesSchema } from '../dto/manager-assignment.dto';
import { ManagerCourierCandidatesService } from './manager-courier-candidates.service';

const PARCEL = { weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 10, isFragile: false };
const ORDER = {
  orderId: 42,
  status: 'confirmed',
  pickup: { latitude: 53.9, longitude: 27.55 },
  parcel: PARCEL,
};
const CHECKS = {
  onShift: true,
  freshLocation: true,
  free: true,
  hasVehicle: true,
  vehicleFits: true,
};
const COURIER = {
  courierId: 3,
  firstName: 'Дмитрий',
  lastName: 'Соколов',
  vehicleType: 'car',
  pickupDistanceM: 900,
  positionAgeMs: 12_000,
  hasOpenOffer: false,
};

function limitsOf(calls: { method: string; args: unknown[] }[]): unknown[] {
  return calls.filter((call) => call.method === 'limit').map((call) => call.args[0]);
}

describe('ManagerCourierCandidatesService', () => {
  const query = courierCandidatesSchema.parse({});

  it('should give the suitable couriers and the unsuitable ones with their reasons', async () => {
    const fake = queueDatabase([
      [ORDER],
      [{ ...COURIER, ...CHECKS }],
      [{ ...COURIER, courierId: 4, ...CHECKS, onShift: false, free: false }],
    ]);

    const result = await new ManagerCourierCandidatesService(fake.db).find(42, query);

    expect(result.suitable).toEqual([
      {
        courierId: 3,
        name: 'Дмитрий Соколов',
        vehicleType: 'car',
        pickupDistanceM: 900,
        positionAgeSec: 12,
        hasOpenOffer: false,
      },
    ]);
    expect(result.unsuitable).toMatchObject([{ courierId: 4, reasons: ['offline', 'busy'] }]);
    expect(limitsOf(fake.calls)).toEqual([1, 50, 20]);
  });

  it('should answer 404 for a missing order', async () => {
    const fake = queueDatabase([[]]);

    await expect(new ManagerCourierCandidatesService(fake.db).find(42, query)).rejects.toThrow(
      NotFoundException,
    );
  });

  it.each(['pending', 'courier_assigned', 'delivered', 'cancelled'])(
    'should answer 409 ORDER_NOT_ASSIGNABLE for an order in %s',
    async (status) => {
      const fake = queueDatabase([[{ ...ORDER, status }]]);
      const error: unknown = await new ManagerCourierCandidatesService(fake.db)
        .find(42, query)
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: 'ORDER_NOT_ASSIGNABLE',
      });
      expect(fake.consumed()).toBe(1);
    },
  );

  it('should take the order in confirmed and in awaiting_manual_assignment', async () => {
    for (const status of ['confirmed', 'awaiting_manual_assignment']) {
      const fake = queueDatabase([[{ ...ORDER, status }], [], []]);

      await expect(new ManagerCourierCandidatesService(fake.db).find(42, query)).resolves.toEqual({
        suitable: [],
        unsuitable: [],
      });
    }
  });
});
