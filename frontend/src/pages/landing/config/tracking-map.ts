// The drawing of the schematic map of the tracking example: coordinates and sizes are in the
// units of the viewBox.

export const DESKTOP_MAP_SIZE = { WIDTH: 640, HEIGHT: 340 } as const;

export const DESKTOP_MAP = {
  VIEW_BOX: `0 0 ${DESKTOP_MAP_SIZE.WIDTH} ${DESKTOP_MAP_SIZE.HEIGHT}`,
  STREETS:
    'M-20 70H660M-20 140H660M-20 210H660M-20 280H660M90 -20V360M200 -20V360M330 -20V360M450 -20V360M560 -20V360',
  STREET_WIDTH: 10,
  AVENUE: 'M-20 320L660 20',
  AVENUE_WIDTH: 20,
  WATER: 'M-20 300C100 280 200 330 330 312S560 270 660 292V340H-20Z',
  PASSED: '200,280 200,210 330,210 330,175',
  REMAINING: '330,175 330,140 450,140 450,70',
  PICKUP: { x: 200, y: 280 },
  DROP: { x: 450, y: 70 },
  // The courier is at the end of the passed way.
  COURIER: { x: 330, y: 175 },
} as const;

export const MOBILE_MAP = {
  VIEW_BOX: '0 0 340 180',
  STREETS: 'M-20 50H360M-20 120H360M70 -20V200M170 -20V200M260 -20V200',
  STREET_WIDTH: 8,
  PASSED: '70,150 70,120 170,120 170,90',
  REMAINING: '170,90 170,50 260,50',
  PICKUP: { x: 70, y: 150 },
  DROP: { x: 260, y: 50 },
} as const;

// How much wider the casing is than the road: the casing gives the road an edge in both themes.
export const ROAD_CASING_EXTRA = 2;

export const MAP_ROUTE = {
  STROKE: 2,
  DASH: '8 8',
  MARKER_RADIUS: 6,
} as const;

export const PERCENT = 100;
