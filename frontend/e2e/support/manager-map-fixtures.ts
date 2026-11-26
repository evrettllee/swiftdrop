import { fromFixedNow } from './clock';
import { MANAGER_ORDER_ID } from './manager-order-fixtures';

export const OFFER_ORDER_ID = 48240;

export type MapState = 'free' | 'on_order' | 'offer' | 'no_signal';

export type RawMapCourier = {
  courierId: number;
  name: string;
  phone: string | null;
  vehicleType: 'foot' | 'bicycle' | 'scooter' | 'car' | 'truck' | null;
  lat: number | null;
  lng: number | null;
  positionAt: string | null;
  positionAgeSec: number | null;
  state: MapState;
  activeOrder: { orderId: number; status: string } | null;
  openOfferOrderId: number | null;
};

function courier(
  courierId: number,
  name: string,
  point: [number, number],
  patch: Partial<RawMapCourier> = {},
): RawMapCourier {
  const ageSec = patch.positionAgeSec ?? 5;

  return {
    courierId,
    name,
    phone: '+375293771290',
    vehicleType: 'car',
    lat: point[0],
    lng: point[1],
    positionAt: fromFixedNow(-ageSec * 1000).toISOString(),
    positionAgeSec: ageSec,
    state: 'free',
    activeOrder: null,
    openOfferOrderId: null,
    ...patch,
  };
}

export function mapCouriers(): RawMapCourier[] {
  return [
    courier(1, 'Алина Гордей', [53.91, 27.55], { vehicleType: 'scooter' }),
    courier(2, 'Андрей Король', [53.9, 27.58], {
      state: 'on_order',
      activeOrder: { orderId: MANAGER_ORDER_ID, status: 'in_transit' },
    }),
    courier(3, 'Егор Тарасевич', [53.89, 27.53], {
      vehicleType: 'bicycle',
      state: 'offer',
      openOfferOrderId: OFFER_ORDER_ID,
    }),
    courier(4, 'Никита Волчек', [53.88, 27.6], {
      state: 'no_signal',
      positionAgeSec: 240,
    }),
    courier(5, 'Игорь Рыбак', [53.92, 27.57], { vehicleType: 'foot', phone: null }),
  ];
}
