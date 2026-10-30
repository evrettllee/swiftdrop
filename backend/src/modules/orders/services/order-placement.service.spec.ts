import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { Database } from '@/database/database.module';
import type { PricingService } from '@/modules/pricing/services/pricing.service';
import type { OrderEventsService } from '@/modules/tracking/services/order-events.service';
import type { CreateOrderDto } from '../dto/create-order.dto';
import { OrderPlacementService } from './order-placement.service';

const CHANGED_AT = new Date('2026-10-30T09:00:00Z');
const ADDRESS = {
  city: 'Минск',
  street: 'ул. Свердлова',
  house: '13а',
  latitude: 53.9,
  longitude: 27.55,
};
const DTO = {
  pickup: ADDRESS,
  delivery: { ...ADDRESS, house: '83' },
  recipient: { name: 'Ирина Козлова', phone: '+375291234567' },
  package: { weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 10, isFragile: false },
} as CreateOrderDto;
const CREATED = {
  orderId: 42,
  status: ORDER_STATUS.PENDING,
  statusChangedAt: CHANGED_AT,
  courierId: null,
};

function fakeDatabase(calls: string[], failure?: Error) {
  const insert = () => ({
    values: (rows: unknown) => {
      const done = Promise.resolve();

      return Object.assign(done, {
        returning: () =>
          Promise.resolve(Array.isArray(rows) ? [{ addressId: 1 }, { addressId: 2 }] : [CREATED]),
      });
    },
  });

  return {
    transaction: async (work: (tx: unknown) => Promise<unknown>) => {
      const result = await work({ insert });

      if (failure) {
        calls.push('rollback');
        throw failure;
      }

      calls.push('commit');

      return result;
    },
  } as unknown as Database;
}

function placement(db: Database, calls: string[]) {
  const publishCreated = jest.fn(() => calls.push('staff:order'));
  const pricing = {
    quote: jest.fn().mockResolvedValue({
      tariffId: 1,
      estimate: {
        price: 9.23,
        currency: 'BYN',
        distanceKm: 7.98,
        estimatedMinutes: 22,
        coefficient: 1,
      },
    }),
  } as unknown as PricingService;
  const events = { publishCreated } as unknown as OrderEventsService;

  return { service: new OrderPlacementService(db, pricing, events), publishCreated };
}

describe('OrderPlacementService', () => {
  it('should tell the staff about the new order once it is committed', async () => {
    const calls: string[] = [];
    const { service, publishCreated } = placement(fakeDatabase(calls), calls);

    await expect(service.place(7, DTO)).resolves.toMatchObject({ orderId: 42, status: 'pending' });

    expect(publishCreated).toHaveBeenCalledWith(CREATED);
    expect(calls).toEqual(['commit', 'staff:order']);
  });

  it('should tell nothing when the transaction rolls back', async () => {
    const calls: string[] = [];
    const { service, publishCreated } = placement(
      fakeDatabase(calls, new Error('rolled back')),
      calls,
    );

    await expect(service.place(7, DTO)).rejects.toThrow('rolled back');

    expect(publishCreated).not.toHaveBeenCalled();
    expect(calls).toEqual(['rollback']);
  });
});
