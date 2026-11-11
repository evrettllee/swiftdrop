import { useCallback, useState } from 'react';
import type { ManagerOrderListItem } from '@/shared/staff-api';

export function useCourierName(courierId: number | null, items: readonly ManagerOrderListItem[]) {
  const [names, setNames] = useState<Record<number, string>>({});

  const rememberCourier = useCallback((id: number, name: string) => {
    setNames((previous) => ({ ...previous, [id]: name }));
  }, []);

  const fromRows =
    courierId === null
      ? null
      : (items.find((item) => item.courier?.id === courierId)?.courier?.name ?? null);

  return {
    courierName: courierId === null ? null : (names[courierId] ?? fromRows),
    rememberCourier,
  };
}
