import type { ReactNode } from 'react';
import { CITY_CENTER } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { MAP_ZOOM } from './map';
import { MovableMapFrame } from './MovableMapFrame';
import { useFitOnce } from './useFitOnce';
import { useMovableMap } from './useMovableMap';

const [CENTER_LATITUDE, CENTER_LONGITUDE] = CITY_CENTER;
const CITY_POINT: GeoPoint = { latitude: CENTER_LATITUDE, longitude: CENTER_LONGITUDE };

type MarkersMapProps = {
  label: string;
  fitPoints: readonly GeoPoint[];
  overlay?: ReactNode;
  className: string;
  children: ReactNode;
};

export function MarkersMap({ label, fitPoints, overlay, className, children }: MarkersMapProps) {
  const frame = useMovableMap();
  useFitOnce(frame.map, fitPoints);

  return (
    <MovableMapFrame
      frame={frame}
      label={label}
      center={CITY_POINT}
      zoom={MAP_ZOOM.DEFAULT}
      overlay={overlay}
      className={className}
    >
      {children}
    </MovableMapFrame>
  );
}
