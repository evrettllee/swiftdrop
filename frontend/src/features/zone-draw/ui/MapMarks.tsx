import { divIcon } from 'leaflet';
import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import { eastPoint, type LatLngLike } from '@/entities/zone';
import { DRAW_CLASS } from '../config/draw';
import { formatRadiusKm } from '../lib/radius';

const SNAPPED_SIZE = 20;

const SNAPPED_ICON = divIcon({
  className: DRAW_CLASS.SNAPPED,
  iconSize: [SNAPPED_SIZE, SNAPPED_SIZE],
  iconAnchor: [SNAPPED_SIZE / 2, SNAPPED_SIZE / 2],
});

const MARK_OPTIONS = { interactive: false, keyboard: false, pmIgnore: true, snapIgnore: true };

export function RadiusLabel({ center, radiusM }: { center: LatLngLike; radiusM: number }) {
  const edge = eastPoint({ latitude: center.lat, longitude: center.lng }, radiusM);
  const position: [number, number] = [center.lat, (center.lng + edge.longitude) / 2];
  const text = formatRadiusKm(radiusM);
  const icon = useMemo(
    () =>
      divIcon({
        className: DRAW_CLASS.RADIUS_LABEL,
        html: `<span>${text}</span>`,
        iconSize: undefined,
      }),
    [text],
  );

  return <Marker position={position} icon={icon} zIndexOffset={1000} {...MARK_OPTIONS} />;
}

export function SnappedMarks({ points }: { points: readonly LatLngLike[] }) {
  return points.map((point) => (
    <Marker
      key={`${point.lat}:${point.lng}`}
      position={[point.lat, point.lng]}
      icon={SNAPPED_ICON}
      {...MARK_OPTIONS}
    />
  ));
}
