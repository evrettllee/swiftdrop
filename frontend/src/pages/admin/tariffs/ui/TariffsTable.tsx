import { Table, TABLE_ALIGN, TableHeaderCell } from '@/shared/ui/table';
import type { AdminTariff } from '../api/admin-tariffs';
import { ADMIN_TARIFFS_TEXTS as TEXTS } from '../config/texts';
import type { TariffEdit } from '../model/useTariffEdit';
import { NEW_TARIFF } from '../model/useTariffEdit';
import type { useTariffStatus } from '../model/useTariffStatus';
import { TariffEditRow } from './TariffEditRow';
import { TariffRow } from './TariffRow';

type TariffsTableProps = {
  items: readonly AdminTariff[];
  edit: TariffEdit;
  status: ReturnType<typeof useTariffStatus>;
};

export function TariffsTable({ items, edit, status }: TariffsTableProps) {
  const isLocked = edit.target !== null;

  return (
    <Table
      label={TEXTS.TABLE_LABEL}
      footer={<span className="tabular-nums">{TEXTS.counter(items.length)}</span>}
    >
      <thead>
        <tr>
          <TableHeaderCell>{TEXTS.COLUMN_NAME}</TableHeaderCell>
          <TableHeaderCell align={TABLE_ALIGN.END}>{TEXTS.COLUMN_KM}</TableHeaderCell>
          <TableHeaderCell align={TABLE_ALIGN.END}>{TEXTS.COLUMN_KG}</TableHeaderCell>
          <TableHeaderCell align={TABLE_ALIGN.END}>{TEXTS.COLUMN_MIN}</TableHeaderCell>
          <TableHeaderCell align={TABLE_ALIGN.END}>{TEXTS.COLUMN_FRAGILE}</TableHeaderCell>
          <TableHeaderCell>{TEXTS.COLUMN_ZONES}</TableHeaderCell>
          <TableHeaderCell>{TEXTS.COLUMN_CHANGED}</TableHeaderCell>
          <TableHeaderCell className="min-w-38">{TEXTS.COLUMN_STATUS}</TableHeaderCell>
          <TableHeaderCell>
            <span className="sr-only">{TEXTS.COLUMN_ACTIONS}</span>
          </TableHeaderCell>
        </tr>
      </thead>
      <tbody>
        {edit.target === NEW_TARIFF ? <TariffEditRow tariff={null} edit={edit} /> : null}
        {items.map((tariff) =>
          edit.target === tariff.tariffId ? (
            <TariffEditRow key={tariff.tariffId} tariff={tariff} edit={edit} />
          ) : (
            <TariffRow
              key={tariff.tariffId}
              tariff={tariff}
              isLocked={isLocked}
              isBusy={status.busyId === tariff.tariffId}
              isFocusTarget={edit.focusId === tariff.tariffId}
              onFocused={edit.clearFocus}
              onEdit={edit.startEdit}
              onToggle={status.toggle}
            />
          ),
        )}
      </tbody>
    </Table>
  );
}
