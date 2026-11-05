import { z } from 'zod';
import { isCalendarDate } from '@/shared/lib/calendar';
import type { ListParamsConfig } from '@/shared/lib/list-params';
import {
  ORDER_STATUS_GROUP,
  ORDERS_FIRST_PAGE,
  ORDERS_PAGE_MAX,
  ORDERS_SEARCH_MAX_LENGTH,
  ORDERS_SORT,
  type OrderStatusGroup,
  type OrdersSort,
} from './list';

const dateParam = z.string().refine(isCalendarDate);

export type OrdersParams = {
  status: OrderStatusGroup | null;
  q: string | null;
  from: string | null;
  to: string | null;
  sort: OrdersSort | null;
  page: number;
};

export const ORDERS_PARAMS_CONFIG: ListParamsConfig<OrdersParams> = {
  schema: z.object({
    status: z.enum(ORDER_STATUS_GROUP),
    q: z.string().trim().min(1).max(ORDERS_SEARCH_MAX_LENGTH),
    from: dateParam,
    to: dateParam,
    sort: z.enum(ORDERS_SORT),
    page: z.coerce.number().int().min(ORDERS_FIRST_PAGE).max(ORDERS_PAGE_MAX),
  }),
  defaults: {
    status: null,
    q: null,
    from: null,
    to: null,
    sort: null,
    page: ORDERS_FIRST_PAGE,
  },
  pageKey: 'page',
  searchKey: 'q',
};

export const FILTERS_RESET: Partial<OrdersParams> = { q: null, from: null, to: null };
