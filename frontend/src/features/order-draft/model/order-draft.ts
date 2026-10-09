import { z } from 'zod';
import type { AddressParts, PackageParams } from '@/shared/api';
import { ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { ORDER_DRAFT_MAX_LENGTH } from '../config/order-draft';

// The draft keeps the form as it was left, unfinished values included: an empty field, a short
// phone or a misspelt name. So only the types and the protective lengths are checked here; the
// rules of the values are checked by the order form when it is sent.

const addressTextSchema = z.string().max(ORDER_DRAFT_MAX_LENGTH.ADDRESS);
const packageValueSchema = z.string().max(ORDER_DRAFT_MAX_LENGTH.PACKAGE_VALUE);
const apartmentSchema = z.string().max(ORDER_DRAFT_MAX_LENGTH.APARTMENT);

// A point of the map: a click on a copy of the world can be past 180° of longitude.
const pointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
}) satisfies z.ZodType<GeoPoint>;

const partsSchema = z.object({
  city: addressTextSchema.nullable(),
  street: addressTextSchema.nullable(),
  house: addressTextSchema.nullable(),
}) satisfies z.ZodType<AddressParts>;

// One field of the route as the route picker keeps it: the point, the text and the address parts.
// A point without an address (still being found) and a text without a point are both kept.
const routeAddressSchema = z.object({
  point: pointSchema.nullable(),
  text: addressTextSchema,
  parts: partsSchema.nullable(),
});

const routeDraftSchema = z.object({
  [ROUTE_POINT.PICKUP]: routeAddressSchema,
  [ROUTE_POINT.DELIVERY]: routeAddressSchema,
}) satisfies z.ZodType<Record<RoutePointKind, unknown>>;

// The package form keeps its values as typed strings, under the names of the API body.
const packageDraftSchema = z.object({
  weightKg: packageValueSchema,
  lengthCm: packageValueSchema,
  widthCm: packageValueSchema,
  heightCm: packageValueSchema,
  isFragile: packageValueSchema,
}) satisfies z.ZodType<Record<keyof PackageParams, string>>;

const apartmentsDraftSchema = z.object({
  [ROUTE_POINT.PICKUP]: apartmentSchema,
  [ROUTE_POINT.DELIVERY]: apartmentSchema,
}) satisfies z.ZodType<Record<RoutePointKind, string>>;

const recipientDraftSchema = z.object({
  name: z.string().max(ORDER_DRAFT_MAX_LENGTH.RECIPIENT_NAME),
  phone: z.string().max(ORDER_DRAFT_MAX_LENGTH.RECIPIENT_PHONE),
});

export const orderDraftSchema = z.object({
  route: routeDraftSchema.nullable(),
  package: packageDraftSchema.nullable(),
  // The order form and a repeated order bring these; the calculator of the landing does not.
  apartments: apartmentsDraftSchema.nullable().default(null),
  recipient: recipientDraftSchema.nullable().default(null),
  // Set by an "order" button of the landing: after the sign-in the client goes to the order form.
  pendingCheckout: z.boolean(),
  // The user the draft belongs to; null for a draft of a guest. A draft stored before the owner
  // was kept has none.
  ownerId: z.number().int().positive().nullable().default(null),
});

export type OrderDraft = z.infer<typeof orderDraftSchema>;

// What the calculator hands over: the route and the package as they are, even if unfinished.
// The order form and a repeated order also bring the apartments and the recipient.
export type OrderDraftData = {
  route: z.infer<typeof routeDraftSchema>;
  package: z.infer<typeof packageDraftSchema>;
  apartments?: z.infer<typeof apartmentsDraftSchema>;
  recipient?: z.infer<typeof recipientDraftSchema>;
};

// The persisted value: zustand stores the state together with its version.
export const storedOrderDraftSchema = z.object({
  state: orderDraftSchema,
  version: z.number().optional(),
});
