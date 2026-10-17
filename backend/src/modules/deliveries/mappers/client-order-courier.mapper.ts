import type { OrderStatus } from '../../../common/enums/order-status.enum';
import { toCourierVehicle } from '../../couriers/mappers/courier-profile.mapper';
import {
  COURIER_VISIBLE_STATUSES,
  DELIVERY_CODE_VISIBLE_STATUSES,
  LAST_NAME_INITIAL_MARK,
} from '../constants/deliveries.constants';
import type { ClientOrderCourier, ClientOrderCourierRow } from '../types/deliveries.types';

const courierVisible = new Set<OrderStatus>(COURIER_VISIBLE_STATUSES);
const codeVisible = new Set<OrderStatus>(DELIVERY_CODE_VISIBLE_STATUSES);

// The client sees the first name and the initial of the last name, as in taxi apps. The phone of the
// courier is not given to the client: talking to the courier is decided separately.
function shortName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName.charAt(0)}${LAST_NAME_INITIAL_MARK}`;
}

export function toClientOrderCourier(row: ClientOrderCourierRow): ClientOrderCourier {
  const { firstName, lastName, vehicleType } = row;
  const showCourier = courierVisible.has(row.status) && firstName !== null && lastName !== null;

  return {
    courier: showCourier
      ? {
          name: shortName(firstName, lastName),
          vehicle: vehicleType
            ? toCourierVehicle({
                type: vehicleType,
                brand: row.brand,
                model: row.model,
                licensePlate: row.licensePlate,
              })
            : null,
        }
      : null,
    deliveryCode: codeVisible.has(row.status) ? row.otpCode : null,
  };
}
