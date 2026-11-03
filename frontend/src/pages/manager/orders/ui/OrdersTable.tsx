import type { ManagerOrderListItem, ManagerOrdersSort } from '@/shared/staff-api';
import { Pagination } from '@/shared/ui/pagination';
import { Table, TABLE_ALIGN, TABLE_SORT, TableHeaderCell } from '@/shared/ui/table';
import { ORDERS_TAB, type OrdersTab, type PageSize } from '../config/list';
import { ASCENDING_SORTS, COLUMN_OF_SORT, SORT_COLUMN, type SortColumn } from '../config/table';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import type { RowAction } from '../lib/row-actions';
import { OrderRow } from './OrderRow';
import { PageSizeSelect } from './PageSizeSelect';

type OrdersTableHeadProps = {
  isAttention: boolean;
  sort: ManagerOrdersSort;
};

function OrdersTableHead({ isAttention, sort }: OrdersTableHeadProps) {
  const direction = ASCENDING_SORTS.has(sort) ? TABLE_SORT.ASCENDING : TABLE_SORT.DESCENDING;
  const sortOf = (column: SortColumn) => (COLUMN_OF_SORT[sort] === column ? direction : undefined);

  return (
    <thead>
      <tr>
        <TableHeaderCell sort={sortOf(SORT_COLUMN.ORDER)}>
          {MANAGER_ORDERS_TEXTS.COLUMN_ORDER}
        </TableHeaderCell>
        <TableHeaderCell className="w-48">{MANAGER_ORDERS_TEXTS.COLUMN_CLIENT}</TableHeaderCell>
        <TableHeaderCell>{MANAGER_ORDERS_TEXTS.COLUMN_ROUTE}</TableHeaderCell>
        {isAttention ? (
          <TableHeaderCell sort={sortOf(SORT_COLUMN.WAITING)}>
            {MANAGER_ORDERS_TEXTS.COLUMN_WAITING}
          </TableHeaderCell>
        ) : (
          <>
            <TableHeaderCell className="w-28">
              {MANAGER_ORDERS_TEXTS.COLUMN_COURIER}
            </TableHeaderCell>
            <TableHeaderCell>{MANAGER_ORDERS_TEXTS.COLUMN_STATUS}</TableHeaderCell>
          </>
        )}
        <TableHeaderCell align={TABLE_ALIGN.END} sort={sortOf(SORT_COLUMN.SUM)}>
          {MANAGER_ORDERS_TEXTS.COLUMN_SUM}
        </TableHeaderCell>
        <TableHeaderCell>
          <span className="sr-only">{MANAGER_ORDERS_TEXTS.COLUMN_ACTIONS}</span>
        </TableHeaderCell>
      </tr>
    </thead>
  );
}

type OrdersTableProps = {
  tab: OrdersTab;
  sort: ManagerOrdersSort;
  items: readonly ManagerOrderListItem[];
  now: number;
  page: number;
  totalPages: number;
  total: number;
  limit: PageSize;
  isBusy: boolean;
  onPage: (page: number) => void;
  onLimit: (limit: PageSize) => void;
  onAction: RowAction;
};

export function OrdersTable({
  tab,
  sort,
  items,
  now,
  page,
  totalPages,
  total,
  limit,
  isBusy,
  onPage,
  onLimit,
  onAction,
}: OrdersTableProps) {
  const isAttention = tab === ORDERS_TAB.ATTENTION;

  return (
    <div aria-busy={isBusy}>
      <Table
        label={MANAGER_ORDERS_TEXTS.TABLE_LABEL}
        footer={
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={limit}
            onChange={onPage}
            start={<PageSizeSelect value={limit} onChange={onLimit} />}
          />
        }
      >
        <OrdersTableHead isAttention={isAttention} sort={sort} />
        <tbody>
          {items.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              now={now}
              isAttention={isAttention}
              onAction={onAction}
            />
          ))}
        </tbody>
      </Table>
    </div>
  );
}
