import { toCourierMapCounts, toCourierMapItem } from './courier-map.mapper';

const POSITION_AT = new Date('2026-10-30T12:00:00Z');
const ROW = {
  courierId: 3,
  firstName: 'Дмитрий',
  lastName: 'Соколов',
  phone: '+375331112233',
  vehicleType: 'car' as const,
  lat: 53.9,
  lng: 27.55,
  positionAt: POSITION_AT,
  positionAgeMs: 12_999,
  state: 'on_order' as const,
  activeOrderId: 42,
  activeOrderStatus: 'picked_up' as const,
  openOfferOrderId: null,
};

describe('toCourierMapItem', () => {
  it('should give the name, the position with its age in whole seconds and the active order', () => {
    expect(toCourierMapItem(ROW)).toEqual({
      courierId: 3,
      name: 'Дмитрий Соколов',
      phone: '+375331112233',
      vehicleType: 'car',
      lat: 53.9,
      lng: 27.55,
      positionAt: POSITION_AT.toISOString(),
      positionAgeSec: 12,
      state: 'on_order',
      activeOrder: { orderId: 42, status: 'picked_up' },
      openOfferOrderId: null,
    });
  });

  it('should give nulls for a courier with no position and no order', () => {
    expect(
      toCourierMapItem({
        ...ROW,
        lat: null,
        lng: null,
        positionAt: null,
        positionAgeMs: null,
        state: 'no_signal',
        activeOrderId: null,
        activeOrderStatus: null,
        openOfferOrderId: 7,
      }),
    ).toMatchObject({
      lat: null,
      lng: null,
      positionAt: null,
      positionAgeSec: null,
      activeOrder: null,
      openOfferOrderId: 7,
    });
  });
});

describe('toCourierMapCounts', () => {
  it('should count every state, with zero for the states nobody is in', () => {
    expect(
      toCourierMapCounts([
        { state: 'free', total: 4 },
        { state: 'no_signal', total: 1 },
      ]),
    ).toEqual({ free: 4, on_order: 0, offer: 0, no_signal: 1 });
  });
});
