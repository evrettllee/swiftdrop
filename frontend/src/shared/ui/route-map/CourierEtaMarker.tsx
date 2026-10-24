import { divIcon } from 'leaflet';
import { type ReactNode, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Marker } from 'react-leaflet';
import type { GeoPoint } from '@/shared/lib/geo';
import { joinClassNames } from '@/shared/lib/class-names';
import { toLatLng } from './lat-lng';
import { COURIER_ETA_ANCHOR, MAP_CLASS } from './map';

type CourierEtaMarkerProps = {
  point: GeoPoint;
  icon: ReactNode;
  label: string | null;
  isOffline: boolean;
};

export function CourierEtaMarker({ point, icon, label, isOffline }: CourierEtaMarkerProps) {
  const [container] = useState(() => document.createElement('div'));
  const markerIcon = useMemo(
    () =>
      divIcon({
        className: MAP_CLASS.COURIER_ETA,
        html: container,
        iconSize: [COURIER_ETA_ANCHOR * 2, COURIER_ETA_ANCHOR * 2],
        iconAnchor: [COURIER_ETA_ANCHOR, COURIER_ETA_ANCHOR],
      }),
    [container],
  );

  return (
    <>
      <Marker
        position={toLatLng(point)}
        icon={markerIcon}
        interactive={false}
        keyboard={false}
        zIndexOffset={1000}
      />
      {createPortal(
        <span
          aria-hidden="true"
          className={joinClassNames(
            MAP_CLASS.COURIER_ETA_PILL,
            isOffline ? MAP_CLASS.COURIER_ETA_OFFLINE : '',
          )}
        >
          <span className={MAP_CLASS.COURIER_ETA_CIRCLE}>{icon}</span>
          {label === null ? null : <span className={MAP_CLASS.COURIER_ETA_TEXT}>{label}</span>}
        </span>,
        container,
      )}
    </>
  );
}
