import { z } from 'zod';
import type { ListParamsConfig } from '@/shared/lib/list-params';
import { MANAGER_SEARCH_MAX_LENGTH } from '@/shared/staff-api';
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

export const SUPPORT_PAGE_SIZE = 20;

export type SupportParams = {
  view: SupportView;
  role: SupportAuthorRole | null;
  q: string | null;
  sort: SupportSort | null;
  page: number;
  ticket: number | null;
};

export const SUPPORT_PARAMS_CONFIG: ListParamsConfig<SupportParams> = {
  schema: z.object({
    view: z.enum(SUPPORT_VIEW),
    role: z.enum(SUPPORT_AUTHOR_ROLE),
    q: z.string().trim().min(1).max(MANAGER_SEARCH_MAX_LENGTH),
    sort: z.enum(SUPPORT_SORT),
    page: z.coerce.number().int().min(1).max(PAGE_MAX),
    ticket: z.coerce.number().int().positive().max(ID_MAX),
  }),
  defaults: {
    view: SUPPORT_VIEW.AWAITING,
    role: null,
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
