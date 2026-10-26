import { ORDER_STATUS, ORDER_STATUS_VALUES } from '@/common/enums/order-status.enum';
import {
  COURIER_LEG_TARGET,
  DROPOFF_HANDOVER_MS,
  PICKUP_HANDOVER_MS,
} from '../constants/tracking.constants';
import { etaPlan } from './eta-points';

const COURIER = { latitude: 53.92, longitude: 27.6 };
const PICKUP = { latitude: 53.9006, longitude: 27.559 };
const DELIVERY = { latitude: 53.9075, longitude: 27.457 };

describe('etaPlan', () => {
  it('should go through the sender with both handovers before the pickup', () => {
    expect(etaPlan(ORDER_STATUS.COURIER_ASSIGNED, COURIER, PICKUP, DELIVERY)).toEqual({
      points: [COURIER, PICKUP, DELIVERY],
      handoverMs: PICKUP_HANDOVER_MS + DROPOFF_HANDOVER_MS,
      toPoint: COURIER_LEG_TARGET.PICKUP,
    });
  });

  it.each([ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT])(
    'should go straight to the recipient with one handover when the order is %s',
    (status) => {
      expect(etaPlan(status, COURIER, PICKUP, DELIVERY)).toEqual({
        points: [COURIER, DELIVERY],
        handoverMs: DROPOFF_HANDOVER_MS,
        toPoint: COURIER_LEG_TARGET.DROPOFF,
      });
    },
  );

  it('should keep the handovers at three and two minutes', () => {
    expect(PICKUP_HANDOVER_MS).toBe(180_000);
    expect(DROPOFF_HANDOVER_MS).toBe(120_000);
  });

  const withoutCourier = ORDER_STATUS_VALUES.filter(
    (status) =>
      status !== ORDER_STATUS.COURIER_ASSIGNED &&
      status !== ORDER_STATUS.PICKED_UP &&
      status !== ORDER_STATUS.IN_TRANSIT,
  );

  it.each(withoutCourier)('should give no trip when the order is %s', (status) => {
    expect(etaPlan(status, COURIER, PICKUP, DELIVERY)).toBeNull();
  });
});
