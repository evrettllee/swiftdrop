import { useCallback } from 'react';
import type { AddressSuggestion } from '@/shared/api';
import { ROUTE_POINT, type RoutePointKind } from '@/shared/config';
import { getClickTarget, pickFrom, toRouteValues } from '../lib/route-address';
import type { RouteAddressValues } from './route-address';
import { useAddressLookup } from './useAddressLookup';
import { useAddressTexts } from './useAddressTexts';
import { usePointPlacement } from './usePointPlacement';
import { useRoutePoints } from './useRoutePoints';

// The route points together with the address text of each: the text and the point of a field
// always change together, and an unfinished address lookup is cancelled by any newer change.
// `initial` fills the fields on the first render; without it they start empty.
export function useRouteAddresses(initial?: RouteAddressValues) {
  const { pickup, delivery, target, setTarget, setPoint } = useRoutePoints(
    initial === undefined ? undefined : pickFrom(initial, (value) => value.point),
  );
  const { texts, parts, setAddress } = useAddressTexts(initial);
  const { lookingUp, cancelLookup, startLookup } = useAddressLookup();
  const { clickTarget, hint } = getClickTarget(pickup, delivery, target);
  const { placePoint, pickPoint } = usePointPlacement({
    clickTarget,
    setPoint,
    setAddress,
    setTarget,
    cancelLookup,
    startLookup,
  });

  // The user typed: the old point does not match the text any more.
  const changeText = useCallback(
    (kind: RoutePointKind, text: string) => {
      cancelLookup(kind);
      setAddress(kind, text, null);
      setPoint(kind, null);
    },
    [cancelLookup, setAddress, setPoint],
  );

  const selectSuggestion = useCallback(
    (kind: RoutePointKind, suggestion: AddressSuggestion) => {
      cancelLookup(kind);
      setAddress(kind, suggestion.name, suggestion.parts);
      setPoint(kind, suggestion.point);

      if (kind === ROUTE_POINT.PICKUP) {
        setTarget(ROUTE_POINT.DELIVERY);
      }
    },
    [cancelLookup, setAddress, setPoint, setTarget],
  );

  return {
    pickup,
    delivery,
    hint,
    texts,
    parts,
    lookingUp,
    values: toRouteValues(pickup, delivery, texts, parts),
    setTarget,
    changeText,
    selectSuggestion,
    placePoint,
    pickPoint,
  };
}
