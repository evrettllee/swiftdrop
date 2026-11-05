import { MANAGER_ORDERS_SORT, type ManagerOrdersSort } from '@/shared/staff-api';
import { ORDERS_TAB, type OrdersTab } from './list';

export const SORT_LABELS: Record<ManagerOrdersSort, string> = {
  [MANAGER_ORDERS_SORT.NEWEST]: 'Сначала новые',
  [MANAGER_ORDERS_SORT.OLDEST]: 'Сначала старые',
  [MANAGER_ORDERS_SORT.PRICE_HIGH]: 'Сначала дороже',
  [MANAGER_ORDERS_SORT.PRICE_LOW]: 'Сначала дешевле',
  [MANAGER_ORDERS_SORT.LONGEST_WAITING]: 'Дольше без изменений',
  [MANAGER_ORDERS_SORT.RECENTLY_CHANGED]: 'Недавно изменённые',
};

const ATTENTION_SORT_LABELS: Partial<Record<ManagerOrdersSort, string>> = {
  [MANAGER_ORDERS_SORT.LONGEST_WAITING]: 'Дольше всего ждёт',
  [MANAGER_ORDERS_SORT.RECENTLY_CHANGED]: 'Недавно появились',
};

export function sortLabel(tab: OrdersTab, sort: ManagerOrdersSort): string {
  return (
    (tab === ORDERS_TAB.ATTENTION ? ATTENTION_SORT_LABELS[sort] : undefined) ?? SORT_LABELS[sort]
  );
}
