import { z } from 'zod';
import {
  LIST_VALUES_SEPARATOR,
  MANAGER_FLAG_TRUE,
  MANAGER_ORDERS_SORT,
  MANAGER_SEARCH_MAX_LENGTH,
  MANAGER_STATUS_GROUP,
  PAYMENT_STATE,
  type ManagerOrdersSort,
  type ManagerStatusGroup,
  type PaymentState,
} from '@/shared/staff-api';
import { isCalendarDate } from '@/shared/lib/calendar';
import type { ListParamsConfig } from '@/shared/lib/list-params';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, type PageSize } from './list';

const PAGE_MAX = 10_000;
const ID_MAX = 2_147_483_647;

const dateParam = z.string().refine(isCalendarDate);

export type OrdersParams = {
  status: ManagerStatusGroup | null;
  q: string | null;
  from: string | null;
  to: string | null;
  courierId: number | null;
  payment: readonly PaymentState[];
  fragile: boolean;
  sort: ManagerOrdersSort | null;
  page: number;
  limit: PageSize;
};

export const ORDERS_PARAMS_CONFIG: ListParamsConfig<OrdersParams> = {
  schema: z.object({
    status: z.enum(MANAGER_STATUS_GROUP),
    q: z.string().trim().min(1).max(MANAGER_SEARCH_MAX_LENGTH),
    from: dateParam,
    to: dateParam,
    courierId: z.coerce.number().int().positive().max(ID_MAX),
    payment: z
      .string()
      .transform((raw) => [...new Set(raw.split(LIST_VALUES_SEPARATOR))])
      .pipe(z.array(z.enum(PAYMENT_STATE)).min(1)),
    fragile: z.literal(MANAGER_FLAG_TRUE).transform(() => true),
    sort: z.enum(MANAGER_ORDERS_SORT),
    page: z.coerce.number().int().min(1).max(PAGE_MAX),
    limit: z.coerce
      .number()
      .refine((value): value is PageSize => PAGE_SIZES.some((size) => size === value)),
  }),
  defaults: {
    status: null,
    q: null,
    from: null,
    to: null,
    courierId: null,
    payment: [],
    fragile: false,
    sort: null,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
  },
  pageKey: 'page',
  searchKey: 'q',
};
