import { ORDER_STATUS_LABELS, PAYMENT_STATE_LABELS } from '../constants/manager-labels.constants';
import type {
  ExportCell,
  ExportColumn,
  ExportTable,
  ManagerExportRow,
} from '../types/manager-export.types';
import type { ManagerOrderStreet } from '../types/manager-orders.types';

type ColumnSpec = ExportColumn & {
  phone: boolean;
  value: (row: ManagerExportRow) => ExportCell;
};

function personName(person: { firstName: string; lastName: string } | null): string | null {
  return person === null ? null : `${person.firstName} ${person.lastName}`;
}

function streetLine({ street, house }: ManagerOrderStreet): string {
  return `${street}, ${house}`;
}

const COLUMNS: ColumnSpec[] = [
  { header: '№', kind: 'number', width: 8, phone: false, value: (row) => row.orderId },
  { header: 'Создан', kind: 'date', width: 17, phone: false, value: (row) => row.createdAt },
  {
    header: 'Статус',
    kind: 'text',
    width: 18,
    phone: false,
    value: (row) => ORDER_STATUS_LABELS[row.status],
  },
  {
    header: 'Клиент',
    kind: 'text',
    width: 24,
    phone: false,
    value: (row) => personName(row.client),
  },
  {
    header: 'Телефон клиента',
    kind: 'text',
    width: 17,
    phone: true,
    value: (row) => row.client.phone ?? null,
  },
  {
    header: 'Откуда',
    kind: 'text',
    width: 32,
    phone: false,
    value: (row) => streetLine(row.pickup),
  },
  {
    header: 'Куда',
    kind: 'text',
    width: 32,
    phone: false,
    value: (row) => streetLine(row.delivery),
  },
  {
    header: 'Курьер',
    kind: 'text',
    width: 24,
    phone: false,
    value: (row) => personName(row.courier),
  },
  {
    header: 'Телефон курьера',
    kind: 'text',
    width: 17,
    phone: true,
    value: (row) => row.courier?.phone ?? null,
  },
  {
    header: 'Стоимость',
    kind: 'money',
    width: 11,
    phone: false,
    value: (row) => Number(row.price),
  },
  {
    header: 'Оплата',
    kind: 'text',
    width: 13,
    phone: false,
    value: (row) => PAYMENT_STATE_LABELS[row.paymentState],
  },
  { header: 'Завершён', kind: 'date', width: 17, phone: false, value: (row) => row.finishedAt },
];

export function buildExportTable(
  rows: readonly ManagerExportRow[],
  withPhones: boolean,
): ExportTable {
  const specs = COLUMNS.filter((column) => withPhones || !column.phone);

  return {
    columns: specs.map(({ header, kind, width }) => ({ header, kind, width })),
    rows: rows.map((row) => specs.map((column) => column.value(row))),
  };
}
