import { useEffect, useState } from 'react';
import { getTariffOptions, type TariffOption } from '@/shared/staff-api';

export function useTariffs(isEnabled: boolean): readonly TariffOption[] {
  const [tariffs, setTariffs] = useState<readonly TariffOption[]>([]);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();

    getTariffOptions({ signal: controller.signal }).then(setTariffs, () => undefined);

    return () => controller.abort();
  }, [isEnabled]);

  return tariffs;
}
