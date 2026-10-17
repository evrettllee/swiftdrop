import { expect, type Locator, type Page, type Request } from '@playwright/test';
import { MAP_CLASS, MAP_TEXTS } from '../../src/shared/ui/route-map/map';
import { type RouteLines, ROUTE_SEGMENT_KIND } from '../../src/shared/api/endpoints/routing';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import type { GeoPoint } from '../../src/shared/lib/geo/geo-point';
import { TEST_ADDRESSES } from './mapbox';

type Segments = RouteLines['segments'];

const POLYLINE6_FACTOR = 1e6;
const CHAR_OFFSET = 63;
const CHUNK_BITS = 5;
const CHUNK_MASK = 0x1f;
const CONTINUATION_BIT = 0x20;

function encodeValue(value: number): string {
  // The sign goes to the lowest bit; the test coordinates fit the 32 bits of bitwise operators.
  let rest = value < 0 ? ~(value << 1) : value << 1;
  let text = '';

  while (rest >= CONTINUATION_BIT) {
    text += String.fromCharCode((CONTINUATION_BIT | (rest & CHUNK_MASK)) + CHAR_OFFSET);
    rest >>= CHUNK_BITS;
  }

  return text + String.fromCharCode(rest + CHAR_OFFSET);
}

// The encoder of the routing service, for the answers of the tests: polyline6, latitude first.
export function encodePolyline6(points: GeoPoint[]): string {
  let latitude = 0;
  let longitude = 0;

  return points
    .map((point) => {
      const nextLatitude = Math.round(point.latitude * POLYLINE6_FACTOR);
      const nextLongitude = Math.round(point.longitude * POLYLINE6_FACTOR);
      const text = encodeValue(nextLatitude - latitude) + encodeValue(nextLongitude - longitude);
      latitude = nextLatitude;
      longitude = nextLongitude;

      return text;
    })
    .join('');
}

const { SVERDLOVA, PRITYTSKOGO } = TEST_ADDRESSES;

// A route of the test addresses with turns, as a road goes: never the straight line between them.
export const ROAD_POINTS: GeoPoint[] = [
  SVERDLOVA,
  { latitude: 53.8995, longitude: 27.5405 },
  { latitude: 53.8962, longitude: 27.5013 },
  { latitude: 53.9049, longitude: 27.4802 },
  PRITYTSKOGO,
];

export const ROAD_GEOMETRY = encodePolyline6(ROAD_POINTS);

// The way of a courier near the city center to the pickup point, with a turn.
export const COURIER_ROAD_GEOMETRY = encodePolyline6([
  { latitude: 53.9006, longitude: 27.559 },
  { latitude: 53.8972, longitude: 27.5571 },
  SVERDLOVA,
]);

export const PARCEL_SEGMENT = {
  kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF,
  geometry: ROAD_GEOMETRY,
} as const;

export const COURIER_SEGMENT = {
  kind: ROUTE_SEGMENT_KIND.TO_PICKUP,
  geometry: COURIER_ROAD_GEOMETRY,
} as const;

// The same segments with no lines: the routing service is down.
export function withoutLines(segments: Segments): Segments {
  return segments.map(({ kind }) => ({ kind, geometry: null }));
}

// A straight line between two points is drawn as one move and one segment: "M x y L x y".
const SEGMENT_COMMAND = /L/g;

// The map shows this many route lines, each with turns; a line is never straight.
export async function expectRoadLines(map: Locator, count: number): Promise<void> {
  const lines = map.locator(`path.${MAP_CLASS.LINE}`);

  await expect(lines).toHaveCount(count);

  for (const line of await lines.all()) {
    const path = (await line.getAttribute('d')) ?? '';

    expect(path.match(SEGMENT_COMMAND)?.length ?? 0).toBeGreaterThan(1);
  }
}

// The tags «Откуда» and «Куда» are whole: the map keeps the points away from its edges.
export async function expectTagsInside(map: Locator): Promise<void> {
  const tags = map.locator(`.${MAP_CLASS.TAG}`);

  await expect(tags).toHaveCount(2);
  // The map may still be moving to the points.
  await expect
    .poll(async () => {
      const frame = await map.boundingBox();
      const boxes = await Promise.all((await tags.all()).map((tag) => tag.boundingBox()));

      return boxes.every(
        (box) =>
          frame !== null &&
          box !== null &&
          box.x >= frame.x &&
          box.y >= frame.y &&
          box.x + box.width <= frame.x + frame.width &&
          box.y + box.height <= frame.y + frame.height,
      );
    })
    .toBe(true);
}

export function routeUnavailableBadge(map: Locator): Locator {
  return map.getByRole('status').filter({ hasText: MAP_TEXTS.ROUTE_UNAVAILABLE });
}

// Answers a route endpoint with the segments `answer` gives at the moment of the request, and
// keeps the requests, so a test can change the answer and count the attempts.
export async function stubRouteLines(
  page: Page,
  path: string,
  answer: () => Segments,
): Promise<Request[]> {
  const requests: Request[] = [];

  await page.route(`**${API_BASE_PATH}${path}`, (route) => {
    requests.push(route.request());

    return route.fulfill({ json: { segments: answer() } });
  });

  return requests;
}
