import { ORDER_STATUS, type OrderStatus } from '../../../common/enums/order-status.enum';
import { ROUTE_SEGMENT_KIND } from '../constants/routing.constants';
import { courierOrderPlans, nextPointPlan, parcelPlan } from './segment-plans';

const PICKUP = { latitude: 53.9006, longitude: 27.559 };
const DELIVERY = { latitude: 53.9075, longitude: 27.457 };
const COURIER = { latitude: 53.92, longitude: 27.6 };

function orderIn(status: OrderStatus) {
  return { status, pickup: PICKUP, delivery: DELIVERY };
}

const PARCEL = { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, from: PICKUP, to: DELIVERY };

describe('courierOrderPlans', () => {
  it('should go to the pickup point and on to the recipient before the pickup', () => {
    expect(courierOrderPlans(orderIn(ORDER_STATUS.COURIER_ASSIGNED), COURIER)).toEqual([
      { kind: ROUTE_SEGMENT_KIND.TO_PICKUP, from: COURIER, to: PICKUP },
      PARCEL,
    ]);
  });

  it('should go to the recipient only after the pickup', () => {
    expect(courierOrderPlans(orderIn(ORDER_STATUS.PICKED_UP), COURIER)).toEqual([
      { kind: ROUTE_SEGMENT_KIND.TO_DROPOFF, from: COURIER, to: DELIVERY },
    ]);
  });

  it('should keep a segment without a start when the position is unknown', () => {
    expect(courierOrderPlans(orderIn(ORDER_STATUS.IN_TRANSIT), null)).toEqual([
      { kind: ROUTE_SEGMENT_KIND.TO_DROPOFF, from: null, to: DELIVERY },
    ]);
  });
});

describe('nextPointPlan', () => {
  it('should lead to the recipient once the parcel is on its way', () => {
    expect(nextPointPlan(orderIn(ORDER_STATUS.IN_TRANSIT), COURIER)).toEqual({
      kind: ROUTE_SEGMENT_KIND.TO_DROPOFF,
      from: COURIER,
      to: DELIVERY,
    });
  });

  it.each([ORDER_STATUS.CONFIRMED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED])(
    'should lead nowhere when the order is %s',
    (status) => {
      expect(nextPointPlan(orderIn(status), COURIER)).toBeNull();
    },
  );
});

describe('parcelPlan', () => {
  // A finished order of the history: the trip of the parcel, whatever its address carries.
  it('should go from the pickup point to the delivery point', () => {
    expect(parcelPlan(orderIn(ORDER_STATUS.DELIVERED))).toEqual(PARCEL);
  });
});
