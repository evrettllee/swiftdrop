import { ORDER_STATUS, ORDER_STATUS_VALUES } from '@/common/enums/order-status.enum';
import { VEHICLE_TYPE } from '@/common/enums/vehicle-type.enum';
import type { ClientOrderCourierRow } from '../types/deliveries.types';
import { toClientOrderCourier } from './client-order-courier.mapper';

const PHONE = '+375331112233';

const ROW: ClientOrderCourierRow = {
  status: ORDER_STATUS.COURIER_ASSIGNED,
  otpCode: '4821',
  firstName: 'Дмитрий',
  lastName: 'Соколов',
  phone: PHONE,
  vehicleType: VEHICLE_TYPE.CAR,
  brand: 'Skoda',
  model: 'Octavia',
  licensePlate: '1234 AB-7',
};

// Whether the client gets the phone in each status, when the database gave it.
const PHONE_BY_STATUS = {
  pending: false,
  confirmed: false,
  awaiting_manual_assignment: false,
  courier_assigned: true,
  picked_up: true,
  in_transit: true,
  delivered: false,
  cancelled: false,
  rejected: false,
} as const satisfies Record<(typeof ORDER_STATUS_VALUES)[number], boolean>;

describe('toClientOrderCourier', () => {
  it('should show the courier with a short name and hide the code before the pickup', () => {
    const view = toClientOrderCourier(ROW);

    expect(view.courier?.name).toBe('Дмитрий С.');
    expect(view.courier?.vehicle?.licensePlate).toBe(ROW.licensePlate);
    expect(view.deliveryCode).toBeNull();
  });

  it.each(ORDER_STATUS_VALUES.map((status) => [status, PHONE_BY_STATUS[status]] as const))(
    'should give the phone in %s: %s',
    (status, hasPhone) => {
      const courier = toClientOrderCourier({ ...ROW, status }).courier;

      expect(courier !== null && 'phone' in courier).toBe(hasPhone);
      expect(courier?.phone).toBe(hasPhone ? PHONE : undefined);
    },
  );

  it('should leave the phone key out when the courier has no phone', () => {
    const view = toClientOrderCourier({ ...ROW, phone: null });

    expect(Object.keys(view.courier ?? {})).toEqual(['name', 'vehicle']);
  });

  it('should show the code once the parcel is picked up', () => {
    expect(toClientOrderCourier({ ...ROW, status: ORDER_STATUS.PICKED_UP }).deliveryCode).toBe(
      ROW.otpCode,
    );
  });

  it('should hide the courier when the order is cancelled', () => {
    expect(toClientOrderCourier({ ...ROW, status: ORDER_STATUS.CANCELLED }).courier).toBeNull();
  });
});
