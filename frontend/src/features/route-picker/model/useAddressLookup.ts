import { useCallback, useEffect, useRef, useState } from 'react';
import { type AddressSuggestion, findAddressByPoint } from '@/shared/api';
import type { RoutePointKind } from '@/shared/config';
import type { GeoPoint } from '@/shared/lib/geo';
import { type LookupFlags, NO_LOOKUPS } from './route-address';

// The address of a point set on the map, looked up for each field apart. A newer change of the
// field cancels the unfinished lookup, and leaving the page cancels them all.
export function useAddressLookup() {
  const [lookingUp, setLookingUp] = useState<LookupFlags>(NO_LOOKUPS);
  const lookups = useRef<Partial<Record<RoutePointKind, AbortController>>>({});

  useEffect(() => {
    const active = lookups.current;

    return () => {
      for (const controller of Object.values(active)) {
        controller?.abort();
      }
    };
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

  // `onFound` gets null when the point has no readable address; a cancelled lookup reports nothing.
  const startLookup = useCallback(
    (kind: RoutePointKind, point: GeoPoint, onFound: (found: AddressSuggestion | null) => void) => {
      setLookingUpOf(kind, true);

      const controller = new AbortController();
      lookups.current[kind] = controller;

      async function lookUp(): Promise<void> {
        let found: AddressSuggestion | null = null;

        try {
          found = await findAddressByPoint(point, controller.signal);
        } catch {
          // The point is valid without a readable address, so no error is shown.
        }

        if (controller.signal.aborted) {
          return;
        }

        onFound(found);
        setLookingUpOf(kind, false);
      }

      void lookUp();
    },
    [setLookingUpOf],
  );

  return { lookingUp, cancelLookup, startLookup };
}
