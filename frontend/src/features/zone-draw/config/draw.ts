export const DRAW_TOOL = {
  POLYGON: 'polygon',
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle',
} as const;

export type DrawTool = (typeof DRAW_TOOL)[keyof typeof DRAW_TOOL];

export const GEOMAN_SHAPE = {
  [DRAW_TOOL.POLYGON]: 'Polygon',
  [DRAW_TOOL.CIRCLE]: 'Circle',
  [DRAW_TOOL.RECTANGLE]: 'Rectangle',
} as const;

export const SNAP_DISTANCE_PX = 20;

export const RADIUS_KM = { MIN: 0.1, MAX: 50, STEP: 0.1 } as const;

export const METERS_PER_KM = 1000;

export const DRAW_CLASS = {
  ROOT: 'zone-draw',
  SHAPE: 'map-zone map-zone--draft',
  TEMP_LINE: 'zone-draw__line',
  HINT_LINE: 'zone-draw__line zone-draw__line--hint',
  RADIUS: 'zone-draw__radius',
  RADIUS_LABEL: 'zone-draw__radius-label',
  SNAPPED: 'zone-draw__snapped',
} as const;
