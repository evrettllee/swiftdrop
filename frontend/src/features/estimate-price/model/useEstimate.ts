import { useEffect, useState } from 'react';
import {
  API_ERROR_MESSAGES,
  getApiErrorMessage,
  type PackageParams,
  type PriceEstimate,
} from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import { estimatePrice } from '../api/estimate-price';
import { ESTIMATE_DEBOUNCE_MS, ESTIMATE_STATUS } from '../config/estimate';
import type { EstimateInput } from './estimate-input';
import { useEstimateInput } from './useEstimateInput';

type PendingStatus =
  | typeof ESTIMATE_STATUS.NEEDS_ADDRESSES
  | typeof ESTIMATE_STATUS.NEEDS_PACKAGE
  | typeof ESTIMATE_STATUS.LOADING;

type ReadyView = { status: typeof ESTIMATE_STATUS.READY; estimate: PriceEstimate };
type ErrorView = { status: typeof ESTIMATE_STATUS.ERROR; message: string };

export type EstimateView = { status: PendingStatus } | ReadyView | ErrorView;

// The answer together with the request it was given for.
type Settled = { input: EstimateInput; view: ReadyView | ErrorView };

const LOADING_VIEW: EstimateView = { status: ESTIMATE_STATUS.LOADING };

// The price for the route and the package: the request goes out when the input has stopped
// changing, and a request for an outdated input is cancelled, so its answer is never shown.
export function useEstimate(
  pickup: GeoPoint | null,
  delivery: GeoPoint | null,
  params: PackageParams | null,
): EstimateView {
  const [settled, setSettled] = useState<Settled | null>(null);
  const input = useEstimateInput(pickup, delivery, params);

  useEffect(() => {
    if (input === null) {
      return undefined;
    }

    const controller = new AbortController();

    async function load(current: EstimateInput): Promise<void> {
      try {
        const estimate = await estimatePrice(current, { signal: controller.signal });

        if (!controller.signal.aborted) {
          setSettled({ input: current, view: { status: ESTIMATE_STATUS.READY, estimate } });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = getApiErrorMessage(error, API_ERROR_MESSAGES.GENERIC);
          setSettled({ input: current, view: { status: ESTIMATE_STATUS.ERROR, message } });
        }
      }
    }

    const timer = window.setTimeout(() => {
      void load(input);
    }, ESTIMATE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  if (input === null) {
    const isMissingAddress = pickup === null || delivery === null;

    return {
      status: isMissingAddress ? ESTIMATE_STATUS.NEEDS_ADDRESSES : ESTIMATE_STATUS.NEEDS_PACKAGE,
    };
  }

  return settled !== null && settled.input === input ? settled.view : LOADING_VIEW;
}
