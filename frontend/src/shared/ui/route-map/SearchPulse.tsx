import { Marker } from 'react-leaflet';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { SEARCH_PULSE_ICON } from './position-icon';

// Never above the marker of the point it pulses under.
const BEHIND_MARKERS = -1000;

type SearchPulseProps = {
  point: GeoPoint;
};

// Two rings that grow out of a point in turn: something is being searched for there. A child of
// the map (RouteMapView), so the map stays one component for every state of an order.
export function SearchPulse({ point }: SearchPulseProps) {
  return (
    <Marker
      position={toLatLng(point)}
      icon={SEARCH_PULSE_ICON}
      zIndexOffset={BEHIND_MARKERS}
      interactive={false}
      keyboard={false}
    />
  );
}
