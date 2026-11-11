import { expect, test } from '@playwright/test';
import { circleRing, eastPoint } from './circle-ring';
import { checkZonePolygon } from './polygon-check';
import { toZonePolygon } from './zone-ring';

const CENTER = { latitude: 53.9, longitude: 27.56 };
const METERS_PER_DEGREE_LATITUDE = 110_574;

function geoJson(ring: { latitude: number; longitude: number }[]): [number, number][] {
  return ring.map(({ latitude, longitude }) => [longitude, latitude]);
}

test('should turn a circle into 64 points at the radius from the center', () => {
  const ring = circleRing(CENTER, 3000);
  const kmPerLongitude = 111.32 * Math.cos((CENTER.latitude * Math.PI) / 180);

  expect(ring).toHaveLength(64);
  expect(ring[0].latitude).toBeCloseTo(CENTER.latitude, 9);
  expect((ring[0].longitude - CENTER.longitude) * kmPerLongitude).toBeCloseTo(3, 6);
  expect((ring[16].latitude - CENTER.latitude) * METERS_PER_DEGREE_LATITUDE).toBeCloseTo(3000, 3);
  expect(ring[32].longitude).toBeCloseTo(
    CENTER.longitude - (ring[0].longitude - CENTER.longitude),
    9,
  );
  expect(eastPoint(CENTER, 3000)).toEqual(ring[0]);
  expect(
    checkZonePolygon(
      toZonePolygon(ring.map(({ latitude, longitude }) => ({ lat: latitude, lng: longitude }))),
    ),
  ).toBeNull();
});

test('should write the Leaflet points as a closed GeoJSON ring of longitude and latitude', () => {
  expect(
    toZonePolygon([
      { lat: 53.9, lng: 27.5 },
      { lat: 53.95, lng: 27.6 },
      { lat: 53.92, lng: 27.7 },
    ]),
  ).toEqual([
    [
      [27.5, 53.9],
      [27.6, 53.95],
      [27.7, 53.92],
      [27.5, 53.9],
    ],
  ]);
  expect(toZonePolygon([])).toEqual([[]]);
});

const SQUARE: [number, number][] = [
  [27.5, 53.9],
  [27.6, 53.9],
  [27.6, 53.95],
  [27.5, 53.95],
  [27.5, 53.9],
];

test('should accept a proper ring', () => {
  expect(checkZonePolygon([SQUARE])).toBeNull();
});

test('should give each reason of the API', () => {
  expect(
    checkZonePolygon([
      [
        [27.5, 53.9],
        [27.6, 53.9],
        [27.5, 53.9],
      ],
    ]),
  ).toBe('too_few_points');
  expect(
    checkZonePolygon([
      [
        [27.5, 53.9],
        [27.5000001, 53.9],
        [27.6, 53.9],
      ],
    ]),
  ).toBe('too_few_points');
  expect(checkZonePolygon([geoJson(circleRing(CENTER, 3000, 201))])).toBe('too_many_points');
  expect(
    checkZonePolygon([
      [
        [27.5, 53.9],
        [27.6, 53.95],
        [27.6, 53.9],
        [27.5, 53.95],
        [27.5, 53.9],
      ],
    ]),
  ).toBe('self_intersection');
  expect(
    checkZonePolygon([
      [
        [27.5, 53.9],
        [27.501, 53.9],
        [27.501, 53.9005],
        [27.5, 53.9005],
      ],
    ]),
  ).toBe('too_small');
  expect(
    checkZonePolygon([
      [
        [27.5, 95],
        [27.6, 53.9],
        [27.6, 53.95],
      ],
    ]),
  ).toBe('out_of_range');
});

test('should take 200 points but not a fold back on the same line', () => {
  expect(checkZonePolygon([geoJson(circleRing(CENTER, 3000, 200))])).toBeNull();
  expect(
    checkZonePolygon([
      [
        [27.5, 53.9],
        [27.7, 53.9],
        [27.6, 53.9],
        [27.6, 53.95],
      ],
    ]),
  ).toBe('self_intersection');
});
