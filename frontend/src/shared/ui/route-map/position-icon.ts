import { divIcon } from 'leaflet';
import { MAP_CLASS, POSITION_MARKER_SIZE } from './map';

// The courier on the map: a solid dot with two rings that grow out of it in turn (route-map.css).
export const POSITION_ICON = divIcon({
  className: MAP_CLASS.POSITION,
  html: [
    `<span class="${MAP_CLASS.POSITION_PULSE}"></span>`,
    `<span class="${MAP_CLASS.POSITION_PULSE} ${MAP_CLASS.POSITION_PULSE_LATE}"></span>`,
    `<span class="${MAP_CLASS.POSITION_DOT}"></span>`,
  ].join(''),
  iconSize: [POSITION_MARKER_SIZE, POSITION_MARKER_SIZE],
  iconAnchor: [POSITION_MARKER_SIZE / 2, POSITION_MARKER_SIZE / 2],
});
