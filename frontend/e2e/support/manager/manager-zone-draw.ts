import type { Locator, Page } from '@playwright/test';
import { stubZones, type ZonesStub } from './manager-zones';

const LIST_URL = /\/api\/manager\/zones$/;

export const NEW_ZONE_PATH = '/manager/zones/new';
export const CREATED_ZONE_ID = 9;

export type DrawStub = {
  zones: ZonesStub;
  posts: Record<string, unknown>[];
  failure: { status: number; json: object } | null;
};

export async function stubZoneDraw(page: Page): Promise<DrawStub> {
  const zones = await stubZones(page);
  const stub: DrawStub = { zones, posts: [], failure: null };

  await page.route(LIST_URL, (route) => {
    if (route.request().method() !== 'POST') {
      return route.fallback();
    }

    const body = route.request().postDataJSON() as Record<string, unknown>;
    stub.posts.push(body);

    return stub.failure === null
      ? route.fulfill({
          status: 201,
          json: {
            id: CREATED_ZONE_ID,
            name: body.name,
            tariff: { id: 2, name: 'Минск, стандарт' },
            priority: body.priority,
            isActive: body.isActive,
            vertexCount: 4,
            areaKm2: 3.2,
            updatedAt: '2026-11-04T09:00:00.000Z',
            polygon: body.polygon,
          },
        })
      : route.fulfill(stub.failure);
  });

  return stub;
}

export function drawMap(page: Page): Locator {
  return page.getByRole('region', { name: 'Карта: граница зоны' });
}

export async function clickAt(page: Page, x: number, y: number): Promise<void> {
  const box = await drawMap(page).boundingBox();
  const left = box?.x ?? 0;
  const top = box?.y ?? 0;
  const width = box?.width ?? 0;
  const height = box?.height ?? 0;
  await page.mouse.move(left + width * x, top + height * y, { steps: 4 });
  await page.mouse.click(left + width * x, top + height * y);
}

export async function drawSquare(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Многоугольник' }).click();
  await clickAt(page, 0.2, 0.75);
  await clickAt(page, 0.3, 0.75);
  await clickAt(page, 0.3, 0.88);
  await clickAt(page, 0.2, 0.88);
  await clickAt(page, 0.2, 0.75);
}

export async function vertexOnScreen(
  path: Locator,
  index: number,
): Promise<{ x: number; y: number }> {
  return path.evaluate((element, at) => {
    const svgPath = element as SVGPathElement;
    const numbers = (svgPath.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g) ?? [];
    const matrix = svgPath.getScreenCTM();
    const x = Number(numbers[at * 2]);
    const y = Number(numbers[at * 2 + 1]);

    return {
      x: (matrix?.a ?? 1) * x + (matrix?.c ?? 0) * y + (matrix?.e ?? 0),
      y: (matrix?.b ?? 0) * x + (matrix?.d ?? 1) * y + (matrix?.f ?? 0),
    };
  }, index);
}

export function ringOf(body: Record<string, unknown> | undefined): number[][] {
  const polygon = body?.polygon;

  return Array.isArray(polygon) && Array.isArray(polygon[0]) ? (polygon[0] as number[][]) : [];
}

export async function drawSquareInside(page: Page, path: Locator): Promise<void> {
  const box = await path.boundingBox();
  const left = box?.x ?? 0;
  const top = box?.y ?? 0;
  const width = box?.width ?? 0;
  const height = box?.height ?? 0;
  const corners = [
    [0.2, 0.62],
    [0.35, 0.62],
    [0.35, 0.78],
    [0.2, 0.78],
    [0.2, 0.62],
  ];
  await page.getByRole('button', { name: 'Многоугольник' }).click();

  for (const [x, y] of corners) {
    await page.mouse.move(left + width * x, top + height * y, { steps: 4 });
    await page.mouse.click(left + width * x, top + height * y);
  }
}
