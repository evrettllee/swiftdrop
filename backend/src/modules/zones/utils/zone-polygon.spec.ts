import { checkZonePolygon } from './zone-polygon';

const RECTANGLE = [
  [27.4, 53.85],
  [27.7, 53.85],
  [27.7, 53.95],
  [27.4, 53.95],
];

function circle(points: number, radiusDegrees = 0.05): number[][] {
  return Array.from({ length: points }, (_, index) => {
    const angle = (2 * Math.PI * index) / points;

    return [27.55 + radiusDegrees * Math.cos(angle), 53.9 + radiusDegrees * Math.sin(angle)];
  });
}

function reasonOf(ring: number[][]) {
  const result = checkZonePolygon([ring]);

  return result.ok ? null : result.reason;
}

describe('checkZonePolygon', () => {
  it('should close an open rectangle and give its vertices and area', () => {
    const result = checkZonePolygon([RECTANGLE]);

    expect(result).toEqual({
      ok: true,
      polygon: [[...RECTANGLE, RECTANGLE[0]]],
      vertexCount: 4,
      areaKm2: expect.any(Number),
    });
    expect(result.ok && result.areaKm2).toBeCloseTo(0.3 * 0.1 * 65.6 * 110.574, 0);
  });

  it('should keep a closed ring closed once', () => {
    const result = checkZonePolygon([[...RECTANGLE, RECTANGLE[0]]]);

    expect(result.ok && result.polygon[0]).toHaveLength(5);
  });

  it('should pass a circle of 64 points', () => {
    expect(checkZonePolygon([circle(64)])).toMatchObject({ ok: true, vertexCount: 64 });
  });

  it('should round to 6 digits and drop repeated points', () => {
    const result = checkZonePolygon([
      [
        [27.40000049, 53.85],
        [27.4, 53.85000001],
        [27.7, 53.85],
        [27.7, 53.85],
        [27.7, 53.95],
        [27.4, 53.95],
      ],
    ]);

    expect(result.ok && result.polygon[0]).toEqual([...RECTANGLE, RECTANGLE[0]]);
  });

  it.each([
    ['too_few_points', [RECTANGLE[0], RECTANGLE[1], RECTANGLE[1], RECTANGLE[0]]],
    ['too_many_points', circle(201)],
    [
      'too_small',
      [
        [27.55, 53.9],
        [27.5501, 53.9],
        [27.5501, 53.9001],
        [27.55, 53.9001],
      ],
    ],
    [
      'out_of_range',
      [
        [27.4, 91],
        [27.7, 53.85],
        [27.7, 53.95],
      ],
    ],
    [
      'out_of_range',
      [
        [181, 53.85],
        [27.7, 53.85],
        [27.7, 53.95],
      ],
    ],
  ])('should refuse with %s', (reason, ring) => {
    expect(reasonOf(ring)).toBe(reason);
  });

  it('should take 200 points', () => {
    expect(checkZonePolygon([circle(200)])).toMatchObject({ ok: true, vertexCount: 200 });
  });

  it('should refuse a figure eight', () => {
    expect(
      reasonOf([
        [27.4, 53.85],
        [27.7, 53.95],
        [27.7, 53.85],
        [27.4, 53.95],
      ]),
    ).toBe('self_intersection');
  });

  it('should refuse a ring that touches its own edge with a vertex', () => {
    expect(
      reasonOf([
        [27.4, 53.85],
        [27.7, 53.85],
        [27.7, 53.95],
        [27.55, 53.85],
        [27.4, 53.95],
      ]),
    ).toBe('self_intersection');
  });

  it('should refuse a ring that goes back along its own edge', () => {
    expect(
      reasonOf([
        [27.4, 53.85],
        [27.7, 53.85],
        [27.5, 53.85],
        [27.5, 53.95],
      ]),
    ).toBe('self_intersection');
  });
});
