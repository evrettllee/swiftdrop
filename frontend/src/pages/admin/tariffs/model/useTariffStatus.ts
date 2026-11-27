import { useState } from 'react';
import { showToast } from '@/shared/ui/toast';
import { type AdminTariff, setTariffActive } from '../api/admin-tariffs';
import { offError } from '../lib/server-errors';

const TOAST_KEY = 'tariff-status';

export function useTariffStatus(onChanged: (tariff: AdminTariff) => void) {
  const [confirming, setConfirming] = useState<AdminTariff | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function run(tariff: AdminTariff, isActive: boolean): Promise<void> {
    setBusyId(tariff.tariffId);

    try {
      onChanged(await setTariffActive(tariff.tariffId, isActive));
    } catch (error) {
      showToast({ key: TOAST_KEY, variant: 'error', ...offError(error) });
    } finally {
      setBusyId(null);
    }
  }

  function toggle(tariff: AdminTariff, isOn: boolean): void {
    if (isOn) {
      void run(tariff, true);
    } else {
      setConfirming(tariff);
    }
  }

  function confirmOff(): void {
    const tariff = confirming;

    setConfirming(null);

    if (tariff !== null) {
      void run(tariff, false);
    }
  }

  return {
    confirming,
    busyId,
    toggle,
    confirmOff,
    cancelOff: () => setConfirming(null),
  };
}
