import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import type { AdminTariff } from '../api/admin-tariffs';
import { OFF_TEXTS as TEXTS } from '../config/texts';
import { activeZoneNames } from '../lib/zones';

type OffDialogProps = {
  tariff: AdminTariff | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function OffDialog({ tariff, onConfirm, onCancel }: OffDialogProps) {
  if (tariff === null) {
    return null;
  }

  const zones = activeZoneNames(tariff.zones);

  return (
    <Dialog
      isOpen
      onClose={onCancel}
      title={TEXTS.TITLE}
      actions={
        <>
          <Button onClick={onConfirm}>{TEXTS.CONFIRM}</Button>
          <Button variant="secondary" onClick={onCancel}>
            {TEXTS.CANCEL}
          </Button>
        </>
      }
    >
      <p>{zones === '' ? TEXTS.free(tariff.name) : TEXTS.used(tariff.name, zones)}</p>
    </Dialog>
  );
}
