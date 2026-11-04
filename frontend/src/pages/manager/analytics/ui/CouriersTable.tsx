import type { ReactNode } from 'react';
import {
  ANALYTICS_COURIER_SORT_KEY as KEY,
  type AnalyticsCourierSort,
  type AnalyticsCourierSortKey,
} from '@/shared/analytics-api';
import { Table, TABLE_ALIGN, TableCell, TableHeaderCell, TableRow } from '@/shared/ui/table';
import { COURIER_TEXTS as TEXTS } from '../config/texts';
import type { CourierRow } from '../lib/courier-row';
import { nextSort, tableSortOf } from '../lib/courier-sort';

const COLUMNS: readonly { key: AnalyticsCourierSortKey; label: string }[] = [
  { key: KEY.DELIVERED, label: TEXTS.DELIVERED },
  { key: KEY.ON_TIME, label: TEXTS.ON_TIME },
  { key: KEY.AVG_DELIVERY, label: TEXTS.AVG_TIME },
  { key: KEY.DECLINED, label: TEXTS.DECLINED },
  { key: KEY.HOURS_ONLINE, label: TEXTS.HOURS },
];

const NAME_COLUMN = { key: KEY.NAME, label: TEXTS.COURIER };

type HeaderProps = {
  sort: AnalyticsCourierSort;
  onSort?: (sort: AnalyticsCourierSort) => void;
};

function HeaderLabel({ column, sort, onSort }: HeaderProps & { column: (typeof COLUMNS)[0] }) {
  if (onSort === undefined) {
    return column.label;
  }

  return (
    <button
      type="button"
      onClick={() => onSort(nextSort(sort, column.key))}
      className="-mx-1 rounded-sm px-1 uppercase hover:text-accent"
    >
      {column.label}
    </button>
  );
}

function CouriersHead({ sort, onSort }: HeaderProps) {
  return (
    <thead>
      <tr>
        <TableHeaderCell sort={tableSortOf(sort, KEY.NAME)}>
          <HeaderLabel column={NAME_COLUMN} sort={sort} onSort={onSort} />
        </TableHeaderCell>
        {COLUMNS.map((column) => (
          <TableHeaderCell
            key={column.key}
            align={TABLE_ALIGN.END}
            sort={tableSortOf(sort, column.key)}
          >
            <HeaderLabel column={column} sort={sort} onSort={onSort} />
          </TableHeaderCell>
        ))}
      </tr>
    </thead>
  );
}

type CouriersTableProps = HeaderProps & {
  rows: readonly CourierRow[];
  footer?: ReactNode;
};

export function CouriersTable({ rows, sort, onSort, footer }: CouriersTableProps) {
  return (
    <Table label={TEXTS.TABLE} footer={footer}>
      <CouriersHead sort={sort} onSort={onSort} />
      <tbody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="flex flex-col">
                <span>{row.name}</span>
                {row.vehicle === null ? null : (
                  <span className="text-caption text-fg-secondary">{row.vehicle}</span>
                )}
              </div>
            </TableCell>
            <TableCell align={TABLE_ALIGN.END} className="font-semibold tabular-nums">
              {row.delivered}
            </TableCell>
            {[row.onTime, row.avgTime, row.declined, row.hours].map((value, index) => (
              <TableCell
                key={COLUMNS[index + 1].key}
                align={TABLE_ALIGN.END}
                className="tabular-nums"
              >
                {value}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
