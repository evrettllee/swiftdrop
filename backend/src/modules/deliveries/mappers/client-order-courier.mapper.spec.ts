import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { VEHICLE_TYPE } from '../../../common/enums/vehicle-type.enum';
import type { ClientOrderCourierRow } from '../types/deliveries.types';
import { toClientOrderCourier } from './client-order-courier.mapper';

const ROW: ClientOrderCourierRow = {
  status: ORDER_STATUS.COURIER_ASSIGNED,
  otpCode: '4821',
  firstName: 'Дмитрий',
  lastName: 'Соколов',
  vehicleType: VEHICLE_TYPE.CAR,
  brand: 'Skoda',
  model: 'Octavia',
  licensePlate: '1234 AB-7',
};

describe('toClientOrderCourier', () => {
  it('should show the courier with a short name and hide the code before the pickup', () => {
    const view = toClientOrderCourier(ROW);

    expect(view.courier?.name).toBe('Дмитрий С.');
    expect(view.courier?.vehicle?.licensePlate).toBe(ROW.licensePlate);
    expect(view.deliveryCode).toBeNull();
  });

  it('should give the client the name and the vehicle of the courier, never the phone', () => {
    const view = toClientOrderCourier(ROW);

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
