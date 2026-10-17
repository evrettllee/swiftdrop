import type { NestExpressApplication } from '@nestjs/platform-express';
import { MS_PER_MINUTE } from '../../src/common/constants/time.constants';
import type { GeoPoint } from '../../src/common/schemas/geo-point.schema';
import { COURIER_LOCATION_FRESH_MS } from '../../src/modules/assignment/constants/assignment.constants';
import type { Database } from '../../src/database/database.module';
import { OsrmGeometryService } from '../../src/integrations/osrm/services/osrm-geometry.service';
import { OsrmService } from '../../src/integrations/osrm/services/osrm.service';
import { createTestApp } from './app';
import { resetServiceArea } from './pricing';

// A courier standing away from both points of VALID_ORDER, inside the service area.
export const COURIER_POINT = { latitude: 53.92, longitude: 27.6 };
// Older than the freshness of a position.
export const STALE_POSITION_AGE_MS = COURIER_LOCATION_FRESH_MS + MS_PER_MINUTE;

// The routing service is replaced: the line of a route names its points, so a test sees what was
// routed, and nothing hidden can get into an answer unnoticed.
export function lineThrough(points: readonly GeoPoint[]): string {
  return points.map((point) => `${point.latitude},${point.longitude}`).join(';');
}

export type RoutingMocks = { getRoute: jest.Mock; getRouteGeometry: jest.Mock };

export function createRoutingMocks(): RoutingMocks {
  return { getRoute: jest.fn(), getRouteGeometry: jest.fn() };
}

export function createRoutingTestApp(mocks: RoutingMocks): Promise<NestExpressApplication> {
  return createTestApp([
    { token: OsrmService, useValue: { getRoute: mocks.getRoute } },
    { token: OsrmGeometryService, useValue: { getRouteGeometry: mocks.getRouteGeometry } },
  ]);
}

// Clean data, the service area, prices along ROUTE and lines that name their points.
export async function resetRouting(db: Database, mocks: RoutingMocks): Promise<void> {
  await resetServiceArea(db, mocks.getRoute);
  mocks.getRouteGeometry.mockReset();
  mocks.getRouteGeometry.mockImplementation((points: GeoPoint[]) =>
    Promise.resolve({ geometry: lineThrough(points), distanceM: 1000, durationS: 120 }),
  );
}

// The routing service is down: every line is missing.
export function failRouting(mocks: RoutingMocks): void {
  mocks.getRouteGeometry.mockResolvedValue(null);
}

export function staleTime(): Date {
  return new Date(Date.now() - STALE_POSITION_AGE_MS);
}
