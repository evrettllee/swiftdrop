import { type DivIcon, divIcon } from 'leaflet';
import { MAP_CLASS, POSITION_MARKER_SIZE } from './map';

function createPositionIcon(parts: string[]): DivIcon {
  return divIcon({
    className: MAP_CLASS.POSITION,
    html: parts.join(''),
    iconSize: [POSITION_MARKER_SIZE, POSITION_MARKER_SIZE],
    iconAnchor: [POSITION_MARKER_SIZE / 2, POSITION_MARKER_SIZE / 2],
  });
}

const PULSES = [
  `<span class="${MAP_CLASS.POSITION_PULSE}"></span>`,
  `<span class="${MAP_CLASS.POSITION_PULSE} ${MAP_CLASS.POSITION_PULSE_LATE}"></span>`,
];
const DOT = `<span class="${MAP_CLASS.POSITION_DOT}"></span>`;

// The courier on the map: a solid dot with two rings that grow out of it in turn (route-map.css).
export const POSITION_ICON = createPositionIcon([...PULSES, DOT]);

// The dot alone, while no orders are searched for (the connection is lost).
export const POSITION_ICON_STILL = createPositionIcon([DOT]);

// The rings alone, under a point of the map that is waited for: the pickup of an order that is
// searched a courier for. They are the rings of the courier, so the same search looks the same.
export const SEARCH_PULSE_ICON = createPositionIcon(PULSES);
