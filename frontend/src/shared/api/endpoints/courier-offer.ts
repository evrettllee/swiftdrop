import { z } from 'zod';

const COURIER_OFFERS_PATH = '/couriers/me/offers';

export const COURIER_OFFERS_API_PATHS = {
  CURRENT: `${COURIER_OFFERS_PATH}/current`,
  accept: (offerId: number) => `${COURIER_OFFERS_PATH}/${offerId}/accept`,
  decline: (offerId: number) => `${COURIER_OFFERS_PATH}/${offerId}/decline`,
} as const;

const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

// An order offered to the courier (the CourierOffer of the backend). Until it is accepted, the
// delivery is only the street and the area: its point is rounded to about a kilometre.
export const courierOfferSchema = z.object({
  offerId: z.number(),
  orderId: z.number(),
  expiresAt: z.coerce.date(),
  pickupEtaSec: z.number(),
  totalEtaSec: z.number(),
  pickup: coordinatesSchema.extend({
    city: z.string(),
    street: z.string(),
    house: z.string(),
    apartment: z.string().nullable(),
  }),
  delivery: coordinatesSchema.extend({
    city: z.string(),
    street: z.string(),
  }),
  parcel: z.object({
    weightKg: z.number(),
    lengthCm: z.number(),
    widthCm: z.number(),
    heightCm: z.number(),
    isFragile: z.boolean(),
  }),
});

export type CourierOffer = z.infer<typeof courierOfferSchema>;

// Response of GET /api/couriers/me/offers/current
export const currentOfferSchema = z.object({ offer: courierOfferSchema.nullable() });

// Response of POST /api/couriers/me/offers/:offerId/accept
export const acceptedOfferSchema = z.object({ orderId: z.number() });
