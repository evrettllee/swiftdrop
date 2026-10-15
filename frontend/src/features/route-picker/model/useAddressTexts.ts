import { useCallback, useState } from 'react';
import type { AddressParts } from '@/shared/api';
import type { RoutePointKind } from '@/shared/config';
import { pickFrom } from '../lib/route-address';
import {
  type AddressPartsByPoint,
  type AddressTexts,
  EMPTY_TEXTS,
  NO_PARTS,
  type RouteAddressValues,
} from './route-address';

// The text of each address field and its address parts. `initial` is read on the first render.
export function useAddressTexts(initial?: RouteAddressValues) {
  const [texts, setTexts] = useState<AddressTexts>(() =>
    initial === undefined ? EMPTY_TEXTS : pickFrom(initial, (value) => value.text),
  );
  const [parts, setParts] = useState<AddressPartsByPoint>(() =>
    initial === undefined ? NO_PARTS : pickFrom(initial, (value) => value.parts),
  );

  // The text and the parts of a field always change together.
  const setAddress = useCallback(
    (kind: RoutePointKind, text: string, value: AddressParts | null) => {
      setTexts((current) => ({ ...current, [kind]: text }));
      setParts((current) => ({ ...current, [kind]: value }));
    },
    [],
  );

  return { texts, parts, setAddress };
}
