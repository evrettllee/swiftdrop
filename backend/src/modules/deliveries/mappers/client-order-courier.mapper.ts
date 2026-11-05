import type { OrderStatus } from '@/common/enums/order-status.enum';
import { shortPersonName } from '@/common/utils/person-name';
import { toCourierVehicle } from '@/modules/couriers/mappers/courier-profile.mapper';
import {
  COURIER_CONTACT_STATUSES,
  COURIER_VISIBLE_STATUSES,
  DELIVERY_CODE_VISIBLE_STATUSES,
} from '../constants/deliveries.constants';
import type { ClientOrderCourier, ClientOrderCourierRow } from '../types/deliveries.types';

const courierVisible = new Set<OrderStatus>(COURIER_VISIBLE_STATUSES);
const contactVisible = new Set<OrderStatus>(COURIER_CONTACT_STATUSES);
const codeVisible = new Set<OrderStatus>(DELIVERY_CODE_VISIBLE_STATUSES);

// The phone is read only in these statuses already; the status is checked again so a change of the
// query never gives it away. No phone means no key at all.
function contact(row: ClientOrderCourierRow): { phone?: string } {
  return row.phone !== null && contactVisible.has(row.status) ? { phone: row.phone } : {};
}

export function toClientOrderCourier(row: ClientOrderCourierRow): ClientOrderCourier {
  const { firstName, lastName, vehicleType } = row;
  const showCourier = courierVisible.has(row.status) && firstName !== null && lastName !== null;

  return {
    courier: showCourier
      ? {
          name: shortPersonName(firstName, lastName),
          vehicle: vehicleType
            ? toCourierVehicle({
                type: vehicleType,
                brand: row.brand,
                model: row.model,
                licensePlate: row.licensePlate,
              })
            : null,
          ...contact(row),
        }
      : null,
    deliveryCode: codeVisible.has(row.status) ? row.otpCode : null,
  };
}
