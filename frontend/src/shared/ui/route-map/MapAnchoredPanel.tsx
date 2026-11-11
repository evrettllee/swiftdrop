import { DomEvent, type Map as LeafletMap } from 'leaflet';
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';
import type { GeoPoint } from '@/shared/lib/geo';
import { toLatLng } from './lat-lng';
import { MAP_CLASS } from './map';
import { MAP_ANCHORED_PANEL } from './map-pin';

const MAP_VIEW_EVENTS = 'move zoom resize';

type Place = { left: number; top: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function placeNear(map: LeafletMap, point: GeoPoint, panel: HTMLElement): Place {
  const { OFFSET, MARGIN } = MAP_ANCHORED_PANEL;
  const size = map.getSize();
  const anchor = map.latLngToContainerPoint(toLatLng(point));
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  const isRightFree = anchor.x + OFFSET + width <= size.x - MARGIN;
  const left = isRightFree ? anchor.x + OFFSET : anchor.x - OFFSET - width;

  return {
    left: clamp(left, MARGIN, size.x - width - MARGIN),
    top: clamp(anchor.y + OFFSET, MARGIN, size.y - height - MARGIN),
  };
}

type MapAnchoredPanelProps = {
  point: GeoPoint;
  label: string;
  className: string;
  children: ReactNode;
};

export function MapAnchoredPanel({ point, label, className, children }: MapAnchoredPanelProps) {
  const map = useMap();
  const panelRef = useRef<HTMLElement>(null);
  const [place, setPlace] = useState<Place | null>(null);

  const update = useCallback(() => {
    if (panelRef.current !== null) {
      setPlace(placeNear(map, point, panelRef.current));
    }
  }, [map, point]);

  useLayoutEffect(update, [update]);

  useEffect(() => {
    const observer = new ResizeObserver(update);
    map.on(MAP_VIEW_EVENTS, update);

    if (panelRef.current !== null) {
      observer.observe(panelRef.current);
    }

    return () => {
      observer.disconnect();
      map.off(MAP_VIEW_EVENTS, update);
    };
  }, [map, update]);

  const setPanel = useCallback((element: HTMLElement | null) => {
    panelRef.current = element;

    if (element !== null) {
      DomEvent.disableClickPropagation(element);
      DomEvent.disableScrollPropagation(element);
    }
  }, []);

  return createPortal(
    <section
      ref={setPanel}
      aria-label={label}
      style={place === null ? { visibility: 'hidden' } : place}
      className={`${MAP_CLASS.PANEL} absolute z-1000 text-body ${className}`}
    >
      {children}
    </section>,
    map.getContainer(),
  );
}
