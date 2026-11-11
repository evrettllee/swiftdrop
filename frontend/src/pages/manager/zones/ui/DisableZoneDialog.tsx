import type { ManagerZone } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { TOGGLE_TEXTS } from '../config/texts';

type DisableZoneDialogProps = {
  zone: ManagerZone | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DisableZoneDialog({ zone, onConfirm, onCancel }: DisableZoneDialogProps) {
  return (
    <Dialog
      isOpen={zone !== null}
      onClose={onCancel}
      title={zone === null ? '' : TOGGLE_TEXTS.CONFIRM_TITLE(zone.name)}
      actions={
        <>
          <Button variant="danger" onClick={onConfirm}>
            {TOGGLE_TEXTS.CONFIRM}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {TOGGLE_TEXTS.KEEP}
          </Button>
        </>
      }
    >
      <p>{TOGGLE_TEXTS.CONFIRM_TEXT}</p>
    </Dialog>
  );
}
