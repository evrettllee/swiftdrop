import { expect, test } from '@playwright/test';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { decodePolyline6 } from '../src/shared/lib/geo/polyline';
import { MAP_CLASS } from '../src/shared/ui/route-map/map';
import { stubMapbox } from './support/mapbox';
import { chooseCalculatorRoute } from './support/route-pages';
import {
  encodePolyline6,
  expectRoadLines,
  PARCEL_SEGMENT,
  ROAD_POINTS,
  routeUnavailableBadge,
  stubRouteLines,
} from './support/routing';

// The frontend has no unit tests of its own: the decoder runs here, without a page.
test.describe('polyline6 decoder', () => {
  test('should decode the points of a line encoded by the routing service', () => {
    const points = decodePolyline6(encodePolyline6(ROAD_POINTS));

    expect(points).toHaveLength(ROAD_POINTS.length);
    points.forEach((point, index) => {
      expect(point.latitude).toBeCloseTo(ROAD_POINTS[index].latitude, 6);
      expect(point.longitude).toBeCloseTo(ROAD_POINTS[index].longitude, 6);
    });
  });

  test('should decode the reference line of the format', () => {
    // The example of the format with 5 digits is the same text with every value ten times smaller.
    const points = decodePolyline6('_p~iF~ps|U_ulLnnqC_mqNvxq`@');

    expect(points.map(({ latitude, longitude }) => [latitude * 10, longitude * 10])).toEqual([
      [expect.closeTo(38.5, 6), expect.closeTo(-120.2, 6)],
      [expect.closeTo(40.7, 6), expect.closeTo(-120.95, 6)],
      [expect.closeTo(43.252, 6), expect.closeTo(-126.453, 6)],
    ]);
  });

  test('should give no points for a broken line', () => {
    expect(decodePolyline6('_p~iF~ps|U_ulL')).toEqual([]);
    expect(decodePolyline6('_p~iF ps|U')).toEqual([]);
    expect(decodePolyline6('')).toEqual([]);
  });
});

test('should draw the route of the calculator along the roads for a guest', async ({ page }) => {
  await stubMapbox(page);
  const requests = await stubRouteLines(page, ROUTING_API_PATHS.PREVIEW, () => [PARCEL_SEGMENT]);

  const map = await chooseCalculatorRoute(page);

  await expect(map.locator(`.${MAP_CLASS.MARKER}`)).toHaveCount(2);
  await expectRoadLines(map, 1);
  await expect(routeUnavailableBadge(map)).toHaveCount(0);
  expect(requests.length).toBeGreaterThan(0);
});
