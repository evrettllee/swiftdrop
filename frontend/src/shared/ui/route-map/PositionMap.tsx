import { useEffect, useState } from 'react';
import { Marker } from 'react-leaflet';
import { usePrefersReducedMotion } from '@/shared/lib/dom';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { LEAFLET_EVENT, MAP_TEXTS, MAP_ZOOM } from './map';
import { MovableMapFrame } from './MovableMapFrame';
import { POSITION_ICON, POSITION_ICON_STILL } from './position-icon';
import { useMovableMap } from './useMovableMap';

type PositionMapProps = {
  point: GeoPoint;
  // The rings pulse while orders are searched for.
  isPulsing: boolean;
  // The parent sets the height of the map.
  className: string;
};

// Where the courier is. The map follows the point until the courier drags it away; «Ко мне» brings
// it back. The wheel and the pinch zoom around the center, so they never stop the following.
export function PositionMap({ point, isPulsing, className }: PositionMapProps) {
  const frame = useMovableMap();
  const { map } = frame;
  const [isFollowing, setIsFollowing] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { latitude, longitude } = point;

  useEffect(() => {
    if (isFollowing) {
      map?.setView([latitude, longitude], map.getZoom(), { animate: !prefersReducedMotion });
    }
  }, [map, isFollowing, latitude, longitude, prefersReducedMotion]);

  useEffect(() => {
    const stopFollowing = () => setIsFollowing(false);

    map?.on(LEAFLET_EVENT.DRAG_START, stopFollowing);

    return () => {
      map?.off(LEAFLET_EVENT.DRAG_START, stopFollowing);
    };
  }, [map]);

  // Also after a following that is still on: the zoom stays, the point comes back to the center.
  function handleLocate(): void {
    setIsFollowing(true);
    map?.setView([latitude, longitude], map.getZoom(), { animate: !prefersReducedMotion });
  }

  return (
    <MovableMapFrame
      frame={frame}
      label={MAP_TEXTS.POSITION_LABEL}
      center={point}
      zoom={MAP_ZOOM.FOCUS}
      onLocate={handleLocate}
      className={className}
    >
      <Marker
        position={toLatLng(point)}
        icon={isPulsing ? POSITION_ICON : POSITION_ICON_STILL}
        interactive={false}
        keyboard={false}
      />
    </MovableMapFrame>
  );
}
