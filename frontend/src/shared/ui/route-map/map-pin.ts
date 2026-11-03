import { MAP_CONTROLS_CLEARANCE } from './map';

export const MAP_PIN_SIZE = 52;

export const MARKERS_FIT_PADDING_TOP_LEFT: [number, number] = [40, 40];
export const MARKERS_FIT_PADDING_BOTTOM_RIGHT: [number, number] = [MAP_CONTROLS_CLEARANCE, 88];

export const MAP_ANCHORED_PANEL = {
  OFFSET: 24,
  MARGIN: 8,
} as const;

export const PIN_TONE = {
  FILLED: 'filled',
  RING: 'ring',
  MUTED: 'muted',
} as const;

export type PinTone = (typeof PIN_TONE)[keyof typeof PIN_TONE];
