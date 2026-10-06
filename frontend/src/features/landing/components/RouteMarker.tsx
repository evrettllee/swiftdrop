import { XIcon } from '@phosphor-icons/react';
import {
  divIcon,
  DomEvent,
  type DivIcon,
  type LeafletEvent,
  type Marker as LeafletMarker,
} from 'leaflet';
import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants/styles';
import type { GeoPoint } from '../../pricing/types';
import { MAP_CLASS, MAP_MARKER_HIT_SIZE, MAP_MARKER_TAG_OFFSET, MAP_TEXTS } from '../constants/map';
import { ROUTE_POINT, ROUTE_POINT_LABELS } from '../constants/route-points';
import type { RoutePointKind } from '../types';

// The wrapper covers the padding of the tag, the button is larger than its icon for a finger and
// does not make the tag taller (the negative margins).
const TAG_CONTENT_CLASS = '-mx-4 -my-1 flex items-center gap-1 px-4 py-1';
const REMOVE_BUTTON_CLASS = `-my-1 -me-2 flex size-7 items-center justify-center rounded-sm text-fg-secondary hover:bg-selected hover:text-fg ${COLOR_TRANSITION_CLASS}`;

function createMarkerIcon(dotClass: string): DivIcon {
  return divIcon({
    className: MAP_CLASS.MARKER,
    html: `<span class="${MAP_CLASS.DOT} ${dotClass}"></span>`,
    iconSize: [MAP_MARKER_HIT_SIZE, MAP_MARKER_HIT_SIZE],
    iconAnchor: [MAP_MARKER_HIT_SIZE / 2, MAP_MARKER_HIT_SIZE / 2],
    tooltipAnchor: [0, -MAP_MARKER_TAG_OFFSET],
  });
}

const MARKER_ICONS: Record<RoutePointKind, DivIcon> = {
  [ROUTE_POINT.PICKUP]: createMarkerIcon(MAP_CLASS.DOT_PICKUP),
  [ROUTE_POINT.DELIVERY]: createMarkerIcon(MAP_CLASS.DOT_DELIVERY),
};

// Leaflet turns a click on its tooltip into a click on the map, which would place a new point.
function disableMapClicks(element: HTMLElement | null): void {
  if (element !== null) {
    DomEvent.disableClickPropagation(element);
  }
}

type RouteMarkerProps = {
  kind: RoutePointKind;
  point: GeoPoint;
  onMove: (kind: RoutePointKind, point: GeoPoint) => void;
  onRemove: (kind: RoutePointKind) => void;
};

// A point can be dragged to fine-tune it after the click, and removed with the cross in its tag.
export function RouteMarker({ kind, point, onMove, onRemove }: RouteMarkerProps) {
  const eventHandlers = useMemo(
    () => ({
      dragend: (event: LeafletEvent) => {
        const { lat, lng } = (event.target as LeafletMarker).getLatLng();
        onMove(kind, { latitude: lat, longitude: lng });
      },
    }),
    [kind, onMove],
  );
  const removeLabel = MAP_TEXTS.REMOVE_POINT(ROUTE_POINT_LABELS[kind]);

  return (
    <Marker
      position={[point.latitude, point.longitude]}
      icon={MARKER_ICONS[kind]}
      draggable
      // A marker cannot be moved or activated from the keyboard, so it is not a tab stop: the
      // address fields and the cross in the tag do the same work.
      keyboard={false}
      eventHandlers={eventHandlers}
    >
      <Tooltip permanent interactive direction="top" className={MAP_CLASS.TAG}>
        <span ref={disableMapClicks} className={TAG_CONTENT_CLASS}>
          {ROUTE_POINT_LABELS[kind]}
          <button
            type="button"
            aria-label={removeLabel}
            title={removeLabel}
            onClick={() => onRemove(kind)}
            className={REMOVE_BUTTON_CLASS}
          >
            <XIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} aria-hidden="true" />
          </button>
        </span>
      </Tooltip>
    </Marker>
  );
}
