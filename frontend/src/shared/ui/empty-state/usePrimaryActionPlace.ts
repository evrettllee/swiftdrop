import { useState } from 'react';
import {
  type PrimaryActionList,
  type PrimaryActionPlace,
  primaryActionPlace,
} from './primary-action';

export function usePrimaryActionPlace(list: PrimaryActionList): PrimaryActionPlace {
  const [settled, setSettled] = useState<PrimaryActionPlace | null>(null);
  const place = primaryActionPlace(list, settled);

  if (!list.isLoading && place !== settled) {
    setSettled(place);
  }

  return place;
}
