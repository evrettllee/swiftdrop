import type { Page } from '@playwright/test';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';
import type { AppSocketStub } from './app-socket';
import { openAsManager } from './manager';
import { stubMapbox } from './mapbox';

const LIST_URL = /\/api\/manager\/zones$/;
const ZONE_URL = /\/api\/manager\/zones\/(\d+)$/;
const TARIFFS_URL = /\/api\/manager\/tariffs$/;

export const ZONES_PATH = '/manager/zones';

type Point = [number, number];

export type RawZone = {
  id: number;
  name: string;
  tariff: { id: number; name: string };
  priority: number;
  isActive: boolean;
  vertexCount: number;
  areaKm2: number;
  updatedAt: string;
  ring: Point[];
};

export const TARIFFS = [
  { id: 1, name: 'Минск, повышенный' },
  { id: 2, name: 'Минск, стандарт' },
  { id: 3, name: 'Пригород' },
];

function zone(id: number, name: string, tariff: number, patch: Partial<RawZone>): RawZone {
  return {
    id,
    name,
    tariff: TARIFFS[tariff - 1],
    priority: 0,
    isActive: true,
    vertexCount: 5,
    areaKm2: 12.4,
    updatedAt: '2026-10-20T09:00:00.000Z',
    ring: [],
    ...patch,
  };
}

export function rawZones(): RawZone[] {
  return [
    zone(1, 'Боровляны', 3, {
      areaKm2: 8.15,
      ring: [
        [27.72, 53.97],
        [27.78, 53.97],
        [27.8, 53.94],
        [27.75, 53.93],
      ],
    }),
    zone(2, 'Заславль', 3, {
      isActive: false,
      updatedAt: '2026-10-21T09:00:00.000Z',
      ring: [
        [27.2, 54.0],
        [27.28, 54.0],
        [27.29, 53.96],
        [27.21, 53.96],
      ],
    }),
    zone(3, 'Минск', 2, {
      areaKm2: 348.9,
      updatedAt: '2026-10-03T09:00:00.000Z',
      ring: [
        [27.4, 53.97],
        [27.7, 53.97],
        [27.72, 53.83],
        [27.42, 53.82],
      ],
    }),
    zone(4, 'Минск, центр', 1, {
      priority: 10,
      areaKm2: 21.3,
      updatedAt: '2026-10-12T09:00:00.000Z',
      ring: [
        [27.52, 53.92],
        [27.6, 53.92],
        [27.6, 53.88],
        [27.52, 53.88],
      ],
    }),
  ];
}

export type ZonePatch = { zoneId: number; body: Record<string, unknown> };

export type ZonesStub = {
  zones: RawZone[];
  listRequests: number;
  zoneRequests: number[];
  patches: ZonePatch[];
  failure: { status: number; json: object } | null;
  socket: AppSocketStub;
};

function listItem({ ring: _ring, ...item }: RawZone) {
  return item;
}

function details(item: RawZone) {
  const ring = [...item.ring, item.ring[0]];

  return { ...listItem(item), polygon: [ring] };
}

export async function stubZones(page: Page): Promise<ZonesStub> {
  const { socket } = await openAsManager(page);
  await stubMapbox(page);
  const stub: ZonesStub = {
    zones: rawZones(),
    listRequests: 0,
    zoneRequests: [],
    patches: [],
    failure: null,
    socket,
  };

  await page.route(LIST_URL, (route) => {
    stub.listRequests += 1;

    return route.fulfill({ json: stub.zones.map(listItem) });
  });
  await page.route(TARIFFS_URL, (route) => route.fulfill({ json: TARIFFS }));
  await page.route(ZONE_URL, (route) => {
    const zoneId = Number(ZONE_URL.exec(route.request().url())?.[1]);
    const found = stub.zones.find((item) => item.id === zoneId);

    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      stub.patches.push({ zoneId, body });

      if (stub.failure !== null) {
        return route.fulfill(stub.failure);
      }

      return route.fulfill({ json: found === undefined ? {} : details(found) });
    }

    stub.zoneRequests.push(zoneId);

    return found === undefined
      ? route.fulfill({ status: 404, json: { message: 'Зона не найдена' } })
      : route.fulfill({ json: details(found) });
  });

  return stub;
}

export function zoneConflict(code: string, status = 409) {
  return { status, json: { statusCode: status, code, message: code } };
}

export function pushZoneChange(stub: ZonesStub, zoneId: number): void {
  stub.socket.push(SOCKET_EVENTS.STAFF_ZONE, { zoneId });
}

export function updateZone(stub: ZonesStub, zoneId: number, patch: Partial<RawZone>): void {
  stub.zones = stub.zones.map((item) => (item.id === zoneId ? { ...item, ...patch } : item));
}
