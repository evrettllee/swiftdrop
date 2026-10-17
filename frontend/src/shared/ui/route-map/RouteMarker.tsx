import { XIcon } from '@phosphor-icons/react';
import { DomEvent, type LeafletEvent, type Marker as LeafletMarker } from 'leaflet';
import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import {
  COLOR_TRANSITION_CLASS,
  ICON_SIZE,
  ICON_WEIGHT,
  ROUTE_POINT,
  ROUTE_POINT_LABELS,
  type RoutePointKind,
} from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { RoutePointMark } from '@/shared/ui/route-point-mark';
import { fromLatLng, toLatLng } from './lat-lng';
import { MAP_CLASS, MAP_TEXTS } from './map';
import { MARKER_ICONS } from './marker-icons';

// The wrapper covers the padding of the tag, the button is larger than its icon for a finger and
// does not make the tag taller (the negative margins).
const TAG_CONTENT_CLASS = '-mx-4 -my-1 flex items-center gap-1 px-4 py-1';
// The tag of a point is outlined and written in the color of its mark (route-map.css).
const TAG_KIND_CLASS: Record<RoutePointKind, string> = {
  [ROUTE_POINT.PICKUP]: MAP_CLASS.TAG_PICKUP,
  [ROUTE_POINT.DELIVERY]: MAP_CLASS.TAG_DELIVERY,
};
const REMOVE_BUTTON_CLASS = `-my-1 -me-2 flex size-7 items-center justify-center rounded-sm text-fg-secondary hover:bg-selected hover:text-fg ${COLOR_TRANSITION_CLASS}`;

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
        onMove(kind, fromLatLng((event.target as LeafletMarker).getLatLng()));
      },
    }),
    [kind, onMove],
  );
  const removeLabel = MAP_TEXTS.REMOVE_POINT(ROUTE_POINT_LABELS[kind]);

  return (
    <Marker
      position={toLatLng(point)}
      icon={MARKER_ICONS[kind]}
      draggable
      // A marker cannot be moved or activated from the keyboard, so it is not a tab stop: the
      // address fields and the cross in the tag do the same work.
      keyboard={false}
      eventHandlers={eventHandlers}
    >
      <Tooltip
        permanent
        interactive
        direction="top"
        className={`${MAP_CLASS.TAG} ${TAG_KIND_CLASS[kind]}`}
      >
        <span ref={disableMapClicks} className={TAG_CONTENT_CLASS}>
          <span className="flex items-center gap-2">
            <RoutePointMark kind={kind} />
            {ROUTE_POINT_LABELS[kind]}
          </span>
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
