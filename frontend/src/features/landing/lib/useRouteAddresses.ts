import { useCallback, useEffect, useRef, useState } from 'react';
import { findAddressByPoint } from '../../geocoding/api';
import type { AddressSuggestion } from '../../geocoding/types';
import type { GeoPoint } from '../../pricing/types';
import { POINT_ON_MAP_TEXT, ROUTE_POINT, ROUTE_POINT_ORDER } from '../constants';
import type { RoutePointKind } from '../types';
import { useRoutePoints } from './useRoutePoints';

type AddressTexts = Record<RoutePointKind, string>;

const EMPTY_TEXTS: AddressTexts = {
  [ROUTE_POINT.PICKUP]: '',
  [ROUTE_POINT.DELIVERY]: '',
};

// The route points together with the address text of each: the text and the point of a field
// always change together, and an unfinished address lookup is cancelled by any newer change.
export function useRouteAddresses() {
  const { pickup, delivery, target, setTarget, setPoint } = useRoutePoints();
  const [texts, setTexts] = useState<AddressTexts>(EMPTY_TEXTS);
  const lookups = useRef<Partial<Record<RoutePointKind, AbortController>>>({});

  // While a point is missing, the next click on the map and the hint name a missing point (the
  // field in focus wins if its point is missing too). Without missing points the click moves the
  // point of the field in focus, and the hint is hidden.
  const missing = ROUTE_POINT_ORDER.filter(
    (kind) => (kind === ROUTE_POINT.PICKUP ? pickup : delivery) === null,
  );
  const clickTarget = missing.includes(target) ? target : (missing[0] ?? target);
  const hint: RoutePointKind | null = missing.length > 0 ? clickTarget : null;

  useEffect(() => {
    const active = lookups.current;

    return () => {
      for (const controller of Object.values(active)) {
        controller?.abort();
      }
    };
  }, []);

  const setText = useCallback((kind: RoutePointKind, text: string) => {
    setTexts((current) => ({ ...current, [kind]: text }));
  }, []);

  const cancelLookup = useCallback((kind: RoutePointKind) => {
    lookups.current[kind]?.abort();
    delete lookups.current[kind];
  }, []);

  // The user typed: the old point does not match the text any more.
  const changeText = useCallback(
    (kind: RoutePointKind, text: string) => {
      cancelLookup(kind);
      setText(kind, text);
      setPoint(kind, null);
    },
    [cancelLookup, setText, setPoint],
  );

  const selectSuggestion = useCallback(
    (kind: RoutePointKind, suggestion: AddressSuggestion) => {
      cancelLookup(kind);
      setText(kind, suggestion.name);
      setPoint(kind, suggestion.point);

      if (kind === ROUTE_POINT.PICKUP) {
        setTarget(ROUTE_POINT.DELIVERY);
      }
    },
    [cancelLookup, setText, setPoint, setTarget],
  );

  // A point set on the map (click or drag): the address is looked up for it.
  const placePoint = useCallback(
    (kind: RoutePointKind, point: GeoPoint) => {
      cancelLookup(kind);
      setPoint(kind, point);
      setText(kind, POINT_ON_MAP_TEXT);

      const controller = new AbortController();
      lookups.current[kind] = controller;

      async function lookUp(): Promise<void> {
        try {
          const found = await findAddressByPoint(point, controller.signal);

          if (found !== null && !controller.signal.aborted) {
            setText(kind, found.name);
          }
        } catch {
          // The point is valid without a readable address, so the placeholder text stays.
        }
      }

      void lookUp();
    },
    [cancelLookup, setPoint, setText],
  );

  // After a click the next one goes to the delivery point, or to the pickup if it is still missing.
  const pickPoint = useCallback(
    (point: GeoPoint) => {
      placePoint(clickTarget, point);
      setTarget(ROUTE_POINT.DELIVERY);
    },
    [placePoint, clickTarget, setTarget],
  );

  return {
    pickup,
    delivery,
    hint,
    texts,
    setTarget,
    changeText,
    selectSuggestion,
    placePoint,
    pickPoint,
  };
}
