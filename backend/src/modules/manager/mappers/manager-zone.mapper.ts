import { ringAreaKm2, ringVertices } from '@/modules/zones/utils/zone-polygon';
import { ZONE_AREA_DECIMALS } from '../constants/manager-zones.constants';
import type { ManagerZone, ManagerZoneDetails, ZoneRow } from '../types/manager-zones.types';

const AREA_SCALE = 10 ** ZONE_AREA_DECIMALS;

export function toManagerZone(row: ZoneRow): ManagerZone {
  const vertices = ringVertices(row.polygon[0] ?? []);

  return {
    id: row.zoneId,
    name: row.name,
    tariff: { id: row.tariffId, name: row.tariffName },
    priority: row.priority,
    isActive: row.isActive,
    vertexCount: vertices.length,
    areaKm2: vertices.length > 0 ? Math.round(ringAreaKm2(vertices) * AREA_SCALE) / AREA_SCALE : 0,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toManagerZoneDetails(row: ZoneRow): ManagerZoneDetails {
  return { ...toManagerZone(row), polygon: row.polygon };
}
