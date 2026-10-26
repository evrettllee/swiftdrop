import { z } from 'zod';
import type { GeoPoint } from '@/shared/lib/geo';
import { http, type HttpOptions } from '../http';
import { dateSchema } from './order';

export const ROUTING_API_PATHS = {
  PREVIEW: '/routing/preview',
  OFFER: '/couriers/me/offers/current/route',
  COURIER_ORDER: '/couriers/me/orders/current/route',
  clientOrder: (orderId: number) => `/orders/${orderId}/route`,
  courierHistoryOrder: (orderId: number) => `/couriers/me/orders/${orderId}/route`,
} as const;

// Must match the segments of the backend: each is its own line on a map.
export const ROUTE_SEGMENT_KIND = {
  // From the courier to the pickup point.
  TO_PICKUP: 'toPickup',
  // From the courier to the recipient, once the parcel is picked up.
  TO_DROPOFF: 'toDropoff',
  // The trip of the parcel itself.
  PICKUP_TO_DROPOFF: 'pickupToDropoff',
} as const;

export type RouteSegmentKind = (typeof ROUTE_SEGMENT_KIND)[keyof typeof ROUTE_SEGMENT_KIND];

// A line along the roads as a polyline6 text; null when there is nothing to draw.
export const routeLinesSchema = z.object({
  segments: z.array(
    z.object({ kind: z.enum(ROUTE_SEGMENT_KIND), geometry: z.string().nullable() }),
  ),
});

export type RouteLines = z.infer<typeof routeLinesSchema>;

// Response of GET /api/orders/:orderId/route (the ClientOrderRoute of the backend): the lines, the
// last known position of the courier while the order is with them, and while they go to the pickup
// point, when they reach it. isStale: the position is older than a minute when it was answered
// (by the clock of the database, as updatedAt); pickupEtaAt is null after the pickup.
export const clientOrderRouteSchema = routeLinesSchema.extend({
  courierPosition: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      updatedAt: dateSchema,
      isStale: z.boolean(),
    })
    .nullable(),
  pickupEtaAt: dateSchema.nullable(),
});

export type ClientOrderRoute = z.infer<typeof clientOrderRouteSchema>;

// The calculator and the order form: the route before an order exists, for a guest too.
export async function getRoutePreview(
  points: { pickup: GeoPoint; delivery: GeoPoint },
  options: HttpOptions = {},
): Promise<RouteLines> {
  return routeLinesSchema.parse(await http.post(ROUTING_API_PATHS.PREVIEW, points, options));
}

// The open offer of the courier: the way to the pickup point only.
export async function getOfferRoute(options: HttpOptions = {}): Promise<RouteLines> {
  return routeLinesSchema.parse(await http.get(ROUTING_API_PATHS.OFFER, options));
}

// The order the courier carries now.
export async function getCourierOrderRoute(options: HttpOptions = {}): Promise<RouteLines> {
  return routeLinesSchema.parse(await http.get(ROUTING_API_PATHS.COURIER_ORDER, options));
}

// An order of the client, with the way of its courier, where they are and their arrival at the
// pickup point while they carry it.
export async function getClientOrderRoute(
  orderId: number,
  options: HttpOptions = {},
): Promise<ClientOrderRoute> {
  return clientOrderRouteSchema.parse(
    await http.get(ROUTING_API_PATHS.clientOrder(orderId), options),
  );
}

// A finished order of the courier: the trip of the parcel by the vehicle of the courier.
export async function getCourierHistoryOrderRoute(
  orderId: number,
  options: HttpOptions = {},
): Promise<RouteLines> {
  return routeLinesSchema.parse(
    await http.get(ROUTING_API_PATHS.courierHistoryOrder(orderId), options),
  );
}
