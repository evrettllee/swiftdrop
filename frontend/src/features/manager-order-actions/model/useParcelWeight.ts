import { useEffect, useState } from 'react';
import { getManagerOrder } from '@/shared/staff-api';
import type { StaffOrderTarget } from './order-target';

type WeightAnswer = { orderId: number; weightKg: number | null };

export type ParcelWeight = { weightKg: number | null; isLoading: boolean };

export function useParcelWeight(target: StaffOrderTarget, isOpen: boolean): ParcelWeight {
  const { orderId, parcelWeightKg } = target;
  const isNeeded = isOpen && parcelWeightKg === null;
  const [answer, setAnswer] = useState<WeightAnswer | null>(null);

  useEffect(() => {
    if (!isNeeded) {
      return undefined;
    }

    const controller = new AbortController();

    getManagerOrder(orderId, { signal: controller.signal }).then(
      (order) => setAnswer({ orderId, weightKg: order.parcel.weight }),
      () => {
        if (!controller.signal.aborted) {
          setAnswer({ orderId, weightKg: null });
        }
      },
    );

    return () => controller.abort();
  }, [orderId, isNeeded]);

  if (parcelWeightKg !== null) {
    return { weightKg: parcelWeightKg, isLoading: false };
  }

  const isAnswered = answer !== null && answer.orderId === orderId;

  return { weightKg: isAnswered ? answer.weightKg : null, isLoading: isNeeded && !isAnswered };
}
