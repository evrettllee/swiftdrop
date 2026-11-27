import type { KeyboardEvent } from 'react';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { TABLE_ALIGN, TableCell } from '@/shared/ui/table';
import type { AdminTariff } from '../api/admin-tariffs';
import { NAME_MAX_LENGTH, PRICE_FIELDS, TARIFF_FIELD, type PriceField } from '../config/limits';
import { ADMIN_TARIFFS_TEXTS as TEXTS, EDIT_TEXTS } from '../config/texts';
import { zonesText } from '../lib/zones';
import { NEW_TARIFF, type TariffEdit } from '../model/useTariffEdit';
import { CellField } from './CellField';
import { ChangedText } from './ChangedText';

const PRICE_LABELS: Record<PriceField, string> = {
  pricePerKm: EDIT_TEXTS.KM_LABEL,
  pricePerKg: EDIT_TEXTS.KG_LABEL,
  minPrice: EDIT_TEXTS.MIN_LABEL,
  fragileFee: EDIT_TEXTS.FRAGILE_LABEL,
};

function StatusCell({ tariff }: { tariff: AdminTariff | null }) {
  const isOn = tariff?.isActive ?? true;

  return (
    <TableCell className="py-2 align-middle">
      <Switch
        isOn={isOn}
        disabled
        className="disabled:opacity-100!"
        label={tariff === null ? TEXTS.NEW : TEXTS.switchLabel(tariff.name)}
        onChange={() => undefined}
      >
        {isOn ? TEXTS.ON : TEXTS.OFF}
      </Switch>
    </TableCell>
  );
}

type TariffEditRowProps = {
  tariff: AdminTariff | null;
  edit: TariffEdit;
};

export function TariffEditRow({ tariff, edit }: TariffEditRowProps) {
  const { draft, errors } = edit;

  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      edit.cancel();
    } else if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      void edit.submit();
    }
  }

  if (draft === null) {
    return null;
  }

  return (
    <tr className="bg-selected align-top" onKeyDown={handleKeyDown}>
      <TableCell className="py-2">
        <CellField
          autoFocus
          label={EDIT_TEXTS.NAME_LABEL}
          placeholder={EDIT_TEXTS.NAME_PLACEHOLDER}
          maxLength={NAME_MAX_LENGTH}
          value={draft.name}
          error={errors[TARIFF_FIELD.NAME]}
          onChange={(value) => edit.change(TARIFF_FIELD.NAME, value)}
        />
      </TableCell>
      {PRICE_FIELDS.map((field) => (
        <TableCell key={field} align={TABLE_ALIGN.END} className="py-2">
          <div className="flex justify-end">
            <CellField
              isNumber
              label={PRICE_LABELS[field]}
              placeholder={EDIT_TEXTS.PRICE_PLACEHOLDER}
              value={draft[field]}
              error={errors[field]}
              onChange={(value) => edit.change(field, value)}
            />
          </div>
        </TableCell>
      ))}
      <TableCell className="py-2 align-middle text-fg-secondary">
        {zonesText(tariff?.zones ?? [], false)}
      </TableCell>
      <TableCell className="py-2 align-middle">
        <ChangedText tariff={tariff} />
      </TableCell>
      <StatusCell tariff={tariff} />
      <TableCell className="py-2">
        <div className="flex flex-col gap-2">
          <Button loading={edit.isSubmitting} onClick={() => void edit.submit()}>
            {edit.target === NEW_TARIFF ? EDIT_TEXTS.CREATE : EDIT_TEXTS.SAVE}
          </Button>
          <Button variant="text" disabled={edit.isSubmitting} onClick={edit.cancel}>
            {EDIT_TEXTS.CANCEL}
          </Button>
        </div>
      </TableCell>
    </tr>
  );
}
