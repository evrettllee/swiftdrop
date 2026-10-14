import type { CourierOfferRow } from '../types/assignment.types';
import { toCourierOffer } from './courier-offer.mapper';

const EXPIRES_AT = '2026-10-14T10:00:30.000Z';

const ROW: CourierOfferRow = {
  offerId: 1,
  orderId: 2,
  expiresAt: new Date(EXPIRES_AT),
  pickupEtaSec: 300,
  totalEtaSec: 1200,
  pickup: {
    city: 'Минск',
    street: 'ул. Свердлова',
    house: '13а',
    apartment: null,
    latitude: 53.9006,
    longitude: 27.559,
  },
  delivery: { city: 'Минск', street: 'пр-т Притыцкого', latitude: 53.9075, longitude: 27.457 },
  parcel: { weightKg: 2.5, lengthCm: 30, widthCm: 20, heightCm: 10, isFragile: false },
};

describe('toCourierOffer', () => {
  it('should round the delivery point to the area and keep the pickup point exact', () => {
    const offer = toCourierOffer(ROW);

    expect(offer.delivery).toEqual({ ...ROW.delivery, latitude: 53.91, longitude: 27.46 });
    expect(offer.pickup).toEqual(ROW.pickup);
    expect(offer.expiresAt).toBe(EXPIRES_AT);
  });
});
