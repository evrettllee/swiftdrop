import { z } from 'zod';
import { http, type HttpOptions } from '@/shared/api';

export const MANAGER_ZONES_API_PATHS = {
  ZONES: '/manager/zones',
  TARIFFS: '/manager/tariffs',
} as const;

export const ZONE_NAME_MAX_LENGTH = 80;
export const ZONE_PRIORITY = { MIN: 0, MAX: 100 } as const;

export const ZONE_ERROR_CODE = {
  ZONE_CHANGED: 'ZONE_CHANGED',
  ZONE_NAME_TAKEN: 'ZONE_NAME_TAKEN',
  LAST_ACTIVE_ZONE: 'LAST_ACTIVE_ZONE',
  TARIFF_NOT_FOUND: 'TARIFF_NOT_FOUND',
  INVALID_POLYGON: 'INVALID_POLYGON',
} as const;

export type ZoneErrorCode = (typeof ZONE_ERROR_CODE)[keyof typeof ZONE_ERROR_CODE];

export const managerZoneSchema = z.object({
  id: z.number(),
  name: z.string(),
  tariff: z.object({ id: z.number(), name: z.string() }),
  priority: z.number(),
  isActive: z.boolean(),
  vertexCount: z.number(),
  areaKm2: z.number(),
  updatedAt: z.string(),
});

export type ManagerZone = z.infer<typeof managerZoneSchema>;

export const zonePolygonSchema = z.array(z.array(z.tuple([z.number(), z.number()])));

export type ZonePolygon = z.infer<typeof zonePolygonSchema>;

export const managerZoneDetailsSchema = managerZoneSchema.extend({ polygon: zonePolygonSchema });

export type ManagerZoneDetails = z.infer<typeof managerZoneDetailsSchema>;

export const tariffOptionSchema = z.object({ id: z.number(), name: z.string() });

export type TariffOption = z.infer<typeof tariffOptionSchema>;

export type ZoneChanges = Partial<{
  name: string;
  tariffId: number;
  priority: number;
  isActive: boolean;
}>;

const zoneErrorBodySchema = z.object({
  code: z.enum(ZONE_ERROR_CODE),
  updatedAt: z.string().optional(),
});

export type ZoneErrorBody = { code: ZoneErrorCode; updatedAt: string | null };

export function readZoneError(body: unknown): ZoneErrorBody | null {
  const parsed = zoneErrorBodySchema.safeParse(body);

  return parsed.success
    ? { code: parsed.data.code, updatedAt: parsed.data.updatedAt ?? null }
    : null;
}

export function managerZonePath(zoneId: number): string {
  return `${MANAGER_ZONES_API_PATHS.ZONES}/${zoneId}`;
}

export async function getManagerZones(options: HttpOptions = {}): Promise<ManagerZone[]> {
  return z.array(managerZoneSchema).parse(await http.get(MANAGER_ZONES_API_PATHS.ZONES, options));
}

export async function getManagerZone(
  zoneId: number,
  options: HttpOptions = {},
): Promise<ManagerZoneDetails> {
  return managerZoneDetailsSchema.parse(await http.get(managerZonePath(zoneId), options));
}

export async function updateManagerZone(
  zoneId: number,
  changes: ZoneChanges,
  expectedUpdatedAt: string,
): Promise<ManagerZoneDetails> {
  return managerZoneDetailsSchema.parse(
    await http.patch(managerZonePath(zoneId), { ...changes, expectedUpdatedAt }),
  );
}

export async function getTariffOptions(options: HttpOptions = {}): Promise<TariffOption[]> {
  return z
    .array(tariffOptionSchema)
    .parse(await http.get(MANAGER_ZONES_API_PATHS.TARIFFS, options));
}
