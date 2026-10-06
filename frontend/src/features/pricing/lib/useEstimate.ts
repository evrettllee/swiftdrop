import { useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '../../../shared/api/http';
import { API_ERROR_MESSAGES } from '../../../shared/constants/api';
import type { GeoPoint } from '../../../shared/types';
import { estimatePrice } from '../api';
import { ESTIMATE_DEBOUNCE_MS, ESTIMATE_STATUS } from '../constants/estimate';
import type { EstimateInput, PackageParams, PriceEstimate } from '../types';

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
// changing, and an answer to an outdated request is never shown.
export function useEstimate(
  pickup: GeoPoint | null,
  delivery: GeoPoint | null,
  params: PackageParams | null,
): EstimateView {
  const [settled, setSettled] = useState<Settled | null>(null);

  const weightKg = params?.weightKg;
  const lengthCm = params?.lengthCm;
  const widthCm = params?.widthCm;
  const heightCm = params?.heightCm;
  const isFragile = params?.isFragile;

  // The object stays the same while the values stay the same, so the effect below
  // restarts only when something really changed.
  const input = useMemo<EstimateInput | null>(() => {
    if (
      pickup === null ||
      delivery === null ||
      weightKg === undefined ||
      lengthCm === undefined ||
      widthCm === undefined ||
      heightCm === undefined ||
      isFragile === undefined
    ) {
      return null;
    }

    return { pickup, delivery, package: { weightKg, lengthCm, widthCm, heightCm, isFragile } };
  }, [pickup, delivery, weightKg, lengthCm, widthCm, heightCm, isFragile]);

  useEffect(() => {
    if (input === null) {
      return undefined;
    }

    let isCurrent = true;

    async function load(current: EstimateInput): Promise<void> {
      try {
        const estimate = await estimatePrice(current);

        if (isCurrent) {
          setSettled({ input: current, view: { status: ESTIMATE_STATUS.READY, estimate } });
        }
      } catch (error) {
        if (isCurrent) {
          const message = getApiErrorMessage(error, API_ERROR_MESSAGES.GENERIC);
          setSettled({ input: current, view: { status: ESTIMATE_STATUS.ERROR, message } });
        }
      }
    }

    const timer = window.setTimeout(() => {
      void load(input);
    }, ESTIMATE_DEBOUNCE_MS);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
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
