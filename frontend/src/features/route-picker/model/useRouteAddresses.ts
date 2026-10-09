import { useCallback, useEffect, useRef, useState } from 'react';
import { type AddressParts, type AddressSuggestion, findAddressByPoint } from '@/shared/api';
import {
  POINT_ON_MAP_TEXT,
  ROUTE_POINT,
  ROUTE_POINT_ORDER,
  type RoutePointKind,
} from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { useRoutePoints } from './useRoutePoints';

type AddressTexts = Record<RoutePointKind, string>;
type AddressPartsByPoint = Record<RoutePointKind, AddressParts | null>;
type LookupFlags = Record<RoutePointKind, boolean>;

const EMPTY_TEXTS: AddressTexts = {
  [ROUTE_POINT.PICKUP]: '',
  [ROUTE_POINT.DELIVERY]: '',
};

const NO_PARTS: AddressPartsByPoint = {
  [ROUTE_POINT.PICKUP]: null,
  [ROUTE_POINT.DELIVERY]: null,
};

const NO_LOOKUPS: LookupFlags = {
  [ROUTE_POINT.PICKUP]: false,
  [ROUTE_POINT.DELIVERY]: false,
};

// The route points together with the address text of each: the text and the point of a field
// always change together, and an unfinished address lookup is cancelled by any newer change.
// `parts` keeps the city, the street and the house of an address found by Mapbox (an order needs
// them); a typed text has no parts until a suggestion is chosen.
export function useRouteAddresses() {
  const { pickup, delivery, target, setTarget, setPoint } = useRoutePoints();
  const [texts, setTexts] = useState<AddressTexts>(EMPTY_TEXTS);
  const [parts, setParts] = useState<AddressPartsByPoint>(NO_PARTS);
  const [lookingUp, setLookingUp] = useState<LookupFlags>(NO_LOOKUPS);
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

  const setPartsOf = useCallback((kind: RoutePointKind, value: AddressParts | null) => {
    setParts((current) => ({ ...current, [kind]: value }));
  }, []);

  const setLookingUpOf = useCallback((kind: RoutePointKind, value: boolean) => {
    setLookingUp((current) => ({ ...current, [kind]: value }));
  }, []);

  const cancelLookup = useCallback(
    (kind: RoutePointKind) => {
      lookups.current[kind]?.abort();
      delete lookups.current[kind];
      setLookingUpOf(kind, false);
    },
    [setLookingUpOf],
  );

  // The user typed: the old point does not match the text any more.
  const changeText = useCallback(
    (kind: RoutePointKind, text: string) => {
      cancelLookup(kind);
      setText(kind, text);
      setPartsOf(kind, null);
      setPoint(kind, null);
    },
    [cancelLookup, setText, setPartsOf, setPoint],
  );

  const selectSuggestion = useCallback(
    (kind: RoutePointKind, suggestion: AddressSuggestion) => {
      cancelLookup(kind);
      setText(kind, suggestion.name);
      setPartsOf(kind, suggestion.parts);
      setPoint(kind, suggestion.point);

      if (kind === ROUTE_POINT.PICKUP) {
        setTarget(ROUTE_POINT.DELIVERY);
      }
    },
    [cancelLookup, setText, setPartsOf, setPoint, setTarget],
  );

  // A point set on the map (click or drag): the address is looked up for it. While it is being
  // found the field is empty and shows the spinner; without a readable address the field names
  // the point on the map.
  const placePoint = useCallback(
    (kind: RoutePointKind, point: GeoPoint) => {
      cancelLookup(kind);
      setPoint(kind, point);
      setText(kind, '');
      setPartsOf(kind, null);
      setLookingUpOf(kind, true);

      const controller = new AbortController();
      lookups.current[kind] = controller;

      async function lookUp(): Promise<void> {
        let found: Awaited<ReturnType<typeof findAddressByPoint>> = null;

        try {
          found = await findAddressByPoint(point, controller.signal);
        } catch {
          // The point is valid without a readable address, so no error is shown.
        }

        if (controller.signal.aborted) {
          return;
        }

        setText(kind, found?.name ?? POINT_ON_MAP_TEXT);
        setPartsOf(kind, found?.parts ?? null);
        setLookingUpOf(kind, false);
      }

      void lookUp();
    },
    [cancelLookup, setPoint, setText, setPartsOf, setLookingUpOf],
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
    parts,
    lookingUp,
    setTarget,
    changeText,
    selectSuggestion,
    placePoint,
    pickPoint,
  };
}
