import type { ManagerOrderListItem, ManagerOrdersSort } from '@/shared/staff-api';
import { Pagination } from '@/shared/ui/pagination';
import {
  headerSortState,
  nextHeaderSort,
  Table,
  TABLE_ALIGN,
  TableHeaderCell,
} from '@/shared/ui/table';
import { ORDERS_TAB, type OrdersTab, type PageSize } from '../config/list';
import { SORT_KEY, type SortableKey } from '../config/table';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';
import type { RowAction } from '../lib/row-actions';
import { OrderRow } from './OrderRow';
import { PageSizeSelect } from './PageSizeSelect';

type OrdersTableHeadProps = {
  isAttention: boolean;
  sort: ManagerOrdersSort;
  sorts: readonly ManagerOrdersSort[];
  onSort: (sort: ManagerOrdersSort) => void;
};

function OrdersTableHead({ isAttention, sort, sorts, onSort }: OrdersTableHeadProps) {
  const sortProps = (key: SortableKey) => {
    const next = nextHeaderSort(sort, key);

    return {
      sort: headerSortState(sort, key),
      onSort: sorts.includes(next) ? () => onSort(next) : undefined,
    };
  };

  return (
    <thead>
      <tr>
        <TableHeaderCell {...sortProps(SORT_KEY.CREATED_AT)}>
          {MANAGER_ORDERS_TEXTS.COLUMN_ORDER}
        </TableHeaderCell>
        <TableHeaderCell className="w-48">{MANAGER_ORDERS_TEXTS.COLUMN_CLIENT}</TableHeaderCell>
        <TableHeaderCell>{MANAGER_ORDERS_TEXTS.COLUMN_ROUTE}</TableHeaderCell>
        {isAttention ? (
          <TableHeaderCell {...sortProps(SORT_KEY.STATUS_CHANGED_AT)}>
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
        <TableHeaderCell align={TABLE_ALIGN.END} {...sortProps(SORT_KEY.PRICE)}>
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
  sorts: readonly ManagerOrdersSort[];
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
  onSort: (sort: ManagerOrdersSort) => void;
};

export function OrdersTable({
  tab,
  sort,
  sorts,
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
  onSort,
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
        <OrdersTableHead isAttention={isAttention} sort={sort} sorts={sorts} onSort={onSort} />
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
