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

const SHORT_SORT_LABELS: Record<ManagerOrdersSort, string> = {
  [MANAGER_ORDERS_SORT.NEWEST]: 'Новые',
  [MANAGER_ORDERS_SORT.OLDEST]: 'Старые',
  [MANAGER_ORDERS_SORT.PRICE_HIGH]: 'Дороже',
  [MANAGER_ORDERS_SORT.PRICE_LOW]: 'Дешевле',
  [MANAGER_ORDERS_SORT.LONGEST_WAITING]: 'Без изменений',
  [MANAGER_ORDERS_SORT.RECENTLY_CHANGED]: 'Изменённые',
};

const ATTENTION_SORT_LABELS: Partial<Record<ManagerOrdersSort, string>> = {
  [MANAGER_ORDERS_SORT.LONGEST_WAITING]: 'Дольше всего ждёт',
  [MANAGER_ORDERS_SORT.RECENTLY_CHANGED]: 'Недавно появились',
};

const SHORT_ATTENTION_SORT_LABELS: Partial<Record<ManagerOrdersSort, string>> = {
  [MANAGER_ORDERS_SORT.LONGEST_WAITING]: 'Дольше ждёт',
  [MANAGER_ORDERS_SORT.RECENTLY_CHANGED]: 'Недавние',
};

export function sortLabel(tab: OrdersTab, sort: ManagerOrdersSort): string {
  return (
    (tab === ORDERS_TAB.ATTENTION ? ATTENTION_SORT_LABELS[sort] : undefined) ?? SORT_LABELS[sort]
  );
}

export function shortSortLabel(tab: OrdersTab, sort: ManagerOrdersSort): string {
  return (
    (tab === ORDERS_TAB.ATTENTION ? SHORT_ATTENTION_SORT_LABELS[sort] : undefined) ??
    SHORT_SORT_LABELS[sort]
  );
}
