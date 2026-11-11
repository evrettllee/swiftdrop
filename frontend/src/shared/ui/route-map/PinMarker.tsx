import { divIcon, type LeafletKeyboardEvent, type Marker as LeafletMarker } from 'leaflet';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Marker } from 'react-leaflet';
import { joinClassNames } from '@/shared/lib/class-names';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { MAP_CLASS } from './map';
import { MAP_PIN_SIZE, type PinTone } from './map-pin';

const SELECT_KEYS = new Set(['Enter', ' ']);
const SELECTED_Z_INDEX = 1000;

type PinMarkerProps = {
  point: GeoPoint;
  tone: PinTone;
  isSelected: boolean;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
};

export function PinMarker({ point, tone, isSelected, label, icon, onSelect }: PinMarkerProps) {
  const markerRef = useRef<LeafletMarker>(null);
  const [container] = useState(() => document.createElement('div'));
  const markerIcon = useMemo(
    () =>
      divIcon({
        className: MAP_CLASS.PIN,
        html: container,
        iconSize: [MAP_PIN_SIZE, MAP_PIN_SIZE],
        iconAnchor: [MAP_PIN_SIZE / 2, MAP_PIN_SIZE / 2],
      }),
    [container],
  );
  const eventHandlers = useMemo(
    () => ({
      click: onSelect,
      keydown: (event: LeafletKeyboardEvent) => {
        if (SELECT_KEYS.has(event.originalEvent.key)) {
          event.originalEvent.preventDefault();
          onSelect();
        }
      },
    }),
    [onSelect],
  );

  useEffect(() => {
    const element = markerRef.current?.getElement();
    element?.setAttribute('aria-pressed', String(isSelected));
    element?.setAttribute('title', label);
  }, [isSelected, label, markerIcon]);

  return (
    <>
      <Marker
        ref={markerRef}
        position={toLatLng(point)}
        icon={markerIcon}
        title={label}
        keyboard
        zIndexOffset={isSelected ? SELECTED_Z_INDEX : 0}
        eventHandlers={eventHandlers}
      />
      {createPortal(
        <span
          aria-hidden="true"
          data-tone={tone}
          className={joinClassNames(MAP_CLASS.PIN_BODY, isSelected ? MAP_CLASS.PIN_SELECTED : '')}
        >
          <span className={MAP_CLASS.PIN_HALO} />
          <span className={MAP_CLASS.PIN_CIRCLE}>{icon}</span>
        </span>,
        container,
      )}
    </>
  );
}
