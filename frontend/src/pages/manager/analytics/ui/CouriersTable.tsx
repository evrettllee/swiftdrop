import type { ReactNode } from 'react';
import {
  ANALYTICS_COURIER_SORT_KEY as KEY,
  type AnalyticsCourierSort,
  type AnalyticsCourierSortKey,
} from '@/shared/analytics-api';
import {
  HEADER_SORT_DIRECTION,
  headerSortState,
  nextHeaderSort,
  Table,
  TABLE_ALIGN,
  type TableAlign,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@/shared/ui/table';
import { COURIER_TEXTS as TEXTS } from '../config/texts';
import type { CourierRow } from '../lib/courier-row';

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

type Column = { key: AnalyticsCourierSortKey; label: string };

function CouriersHeaderCell({
  column,
  sort,
  onSort,
  align,
}: HeaderProps & { column: Column; align?: TableAlign }) {
  const firstDirection =
    column.key === KEY.NAME ? HEADER_SORT_DIRECTION.ASC : HEADER_SORT_DIRECTION.DESC;

  return (
    <TableHeaderCell
      align={align}
      sort={headerSortState(sort, column.key)}
      onSort={
        onSort === undefined
          ? undefined
          : () => onSort(nextHeaderSort(sort, column.key, firstDirection))
      }
    >
      {column.label}
    </TableHeaderCell>
  );
}

function CouriersHead({ sort, onSort }: HeaderProps) {
  return (
    <thead>
      <tr>
        <CouriersHeaderCell column={NAME_COLUMN} sort={sort} onSort={onSort} />
        {COLUMNS.map((column) => (
          <CouriersHeaderCell
            key={column.key}
            column={column}
            sort={sort}
            onSort={onSort}
            align={TABLE_ALIGN.END}
          />
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
