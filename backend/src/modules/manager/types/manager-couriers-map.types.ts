import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { CourierMapState } from '../constants/manager-couriers-map.constants';

export type CourierMapRow = {
  courierId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  vehicleType: VehicleType | null;
  lat: number | null;
  lng: number | null;
  positionAt: Date | null;
  positionAgeMs: number | null;
  state: CourierMapState;
  activeOrderId: number | null;
  activeOrderStatus: OrderStatus | null;
  openOfferOrderId: number | null;
};

export type CourierMapItem = {
  courierId: number;
  name: string;
  phone: string | null;
  vehicleType: VehicleType | null;
  lat: number | null;
  lng: number | null;
  positionAt: string | null;
  positionAgeSec: number | null;
  state: CourierMapState;
  activeOrder: { orderId: number; status: OrderStatus } | null;
  openOfferOrderId: number | null;
};

export type CouriersMap = {
  items: CourierMapItem[];
  counts: Record<CourierMapState, number>;
};
