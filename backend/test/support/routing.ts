import type { NestExpressApplication } from '@nestjs/platform-express';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import { COURIER_LOCATION_FRESH_MS } from '@/modules/assignment/constants/assignment.constants';
import type { Database } from '@/database/database.module';
import { OsrmGeometryService } from '@/integrations/osrm/services/osrm-geometry.service';
import { OsrmTripService } from '@/integrations/osrm/services/osrm-trip.service';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ETA_SHUTDOWN_WAIT_MS } from '@/modules/tracking/constants/tracking.constants';
import { OrderEtaStore } from '@/modules/tracking/services/order-eta-store.service';
import { OrderEtaService } from '@/modules/tracking/services/order-eta.service';
import { createTestApp } from './app';
import { resetServiceArea } from './pricing';

// A courier standing away from both points of VALID_ORDER, inside the service area.
export const COURIER_POINT = { latitude: 53.92, longitude: 27.6 };
// Older than the freshness of a position.
export const STALE_POSITION_AGE_MS = COURIER_LOCATION_FRESH_MS + MS_PER_MINUTE;
// The time of every trip of the courier the replaced routing service gives.
export const TRIP_DURATION_S = 600;
// The time of its first leg: to the pickup point before the pickup.
export const FIRST_LEG_DURATION_S = 240;

// The routing service is replaced: the line of a route names its points, so a test sees what was
// routed, and nothing hidden can get into an answer unnoticed.
export function lineThrough(points: readonly GeoPoint[]): string {
  return points.map((point) => `${point.latitude},${point.longitude}`).join(';');
}

export type RoutingMocks = {
  getRoute: jest.Mock;
  getRouteGeometry: jest.Mock;
  getTrip: jest.Mock;
  isTripAvailable: jest.Mock;
};

export function createRoutingMocks(): RoutingMocks {
  return {
    getRoute: jest.fn(),
    getRouteGeometry: jest.fn(),
    getTrip: jest.fn(),
    isTripAvailable: jest.fn(),
  };
}

export function createRoutingTestApp(mocks: RoutingMocks): Promise<NestExpressApplication> {
  return createTestApp([
    { token: OsrmService, useValue: { getRoute: mocks.getRoute } },
    { token: OsrmGeometryService, useValue: { getRouteGeometry: mocks.getRouteGeometry } },
    {
      token: OsrmTripService,
      useValue: { getTrip: mocks.getTrip, isAvailable: mocks.isTripAvailable },
    },
  ]);
}

// Clean data, the service area, prices along ROUTE and lines that name their points. The line of
// the first leg of a trip names its first two points. The estimates in memory go too: the ids of
// the orders start again after a reset, so an old entry would belong to a new order. Estimates
// a past test started in the background finish first, before their data is gone.
export async function resetRouting(
  app: NestExpressApplication,
  db: Database,
  mocks: RoutingMocks,
): Promise<void> {
  await app.get(OrderEtaService).waitForIdle(ETA_SHUTDOWN_WAIT_MS);
  await resetServiceArea(db, mocks.getRoute);
  app.get(OrderEtaStore).clear();
  mocks.getRouteGeometry.mockReset();
  mocks.getRouteGeometry.mockImplementation((points: GeoPoint[]) =>
    Promise.resolve({ geometry: lineThrough(points), distanceM: 1000, durationS: 120 }),
  );
  mocks.getTrip.mockReset();
  mocks.getTrip.mockImplementation((points: GeoPoint[]) =>
    Promise.resolve({
      durationS: TRIP_DURATION_S,
      firstLegDurationS: FIRST_LEG_DURATION_S,
      firstLegGeometry: lineThrough(points.slice(0, 2)),
    }),
  );
  mocks.isTripAvailable.mockReset();
  mocks.isTripAvailable.mockReturnValue(true);
}

// The routing service is down: every line is missing.
export function failRouting(mocks: RoutingMocks): void {
  mocks.getRouteGeometry.mockResolvedValue(null);
  mocks.getTrip.mockResolvedValue(null);
}

export function staleTime(): Date {
  return new Date(Date.now() - STALE_POSITION_AGE_MS);
}
