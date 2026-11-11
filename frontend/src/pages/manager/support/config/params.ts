import { z } from 'zod';
import { isCalendarDate } from '@/shared/lib/calendar';
import type { ListParamsConfig } from '@/shared/lib/list-params';
import {
  LIST_VALUES_SEPARATOR,
  MANAGER_SEARCH_MAX_LENGTH,
  TICKET_TOPIC,
  type TicketTopic,
} from '@/shared/staff-api';
import {
  SUPPORT_AUTHOR_ROLE,
  SUPPORT_SORT,
  SUPPORT_VIEW,
  type SupportAuthorRole,
  type SupportSort,
  type SupportView,
} from '@/shared/support-api';

const PAGE_MAX = 10_000;
const ID_MAX = 2_147_483_647;

const dateParam = z.string().refine(isCalendarDate);

export type SupportParams = {
  view: SupportView;
  role: SupportAuthorRole | null;
  topic: readonly TicketTopic[];
  from: string | null;
  to: string | null;
  q: string | null;
  sort: SupportSort | null;
  page: number;
  ticket: number | null;
};

export const SUPPORT_PARAMS_CONFIG: ListParamsConfig<SupportParams> = {
  schema: z.object({
    view: z.enum(SUPPORT_VIEW),
    role: z.enum(SUPPORT_AUTHOR_ROLE),
    topic: z
      .string()
      .transform((raw) => [...new Set(raw.split(LIST_VALUES_SEPARATOR))])
      .pipe(z.array(z.enum(TICKET_TOPIC)).min(1)),
    from: dateParam,
    to: dateParam,
    q: z.string().trim().min(1).max(MANAGER_SEARCH_MAX_LENGTH),
    sort: z.enum(SUPPORT_SORT),
    page: z.coerce.number().int().min(1).max(PAGE_MAX),
    ticket: z.coerce.number().int().positive().max(ID_MAX),
  }),
  defaults: {
    view: SUPPORT_VIEW.AWAITING,
    role: null,
    topic: [],
    from: null,
    to: null,
    q: null,
    sort: null,
    page: 1,
    ticket: null,
  },
  pageKey: 'page',
  searchKey: 'q',
};

export const DEFAULT_SORTS: Record<SupportView, SupportSort> = {
  [SUPPORT_VIEW.AWAITING]: SUPPORT_SORT.LONGEST_WAITING,
  [SUPPORT_VIEW.OPEN]: SUPPORT_SORT.NEWEST,
  [SUPPORT_VIEW.CLOSED]: SUPPORT_SORT.NEWEST,
};

export const FILTERS_RESET: Pick<SupportParams, 'topic' | 'from' | 'to'> = {
  topic: [],
  from: null,
  to: null,
};
