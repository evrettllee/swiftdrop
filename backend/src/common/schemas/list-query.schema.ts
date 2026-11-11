import { z } from 'zod';
import {
  LIST_CSV_MAX_VALUES,
  LIST_CSV_SEPARATOR,
  LIST_CURSOR_FIRST_PAGE,
  LIST_FIRST_PAGE,
  LIST_OFFSET_MAX,
  LIST_SEARCH_MAX_LENGTH,
  LIST_SEARCH_MIN_LENGTH,
  LIST_SORT_SEPARATOR,
  LIST_VALIDATION_MESSAGES,
  NUL_CHARACTER,
  SORT_DIRECTION_VALUES,
} from '@/common/constants/list.constants';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import { isSortValueValid, type ListSort, type SortSpec } from '@/common/database/list-sort';
import type { ListPagination, ListQuery } from '@/common/types/page.types';
import { isCalendarDate, toDateRange } from '@/common/utils/date-range';
import { decodeListCursor } from '@/common/utils/list-cursor';
import type { RawListPagination } from './pagination.schema';

const MESSAGES = LIST_VALIDATION_MESSAGES;
const SORT_MAX_LENGTH = 64;

export const listSortParamSchema = z
  .string({ error: MESSAGES.SORT_INVALID })
  .max(SORT_MAX_LENGTH, { error: MESSAGES.SORT_INVALID })
  .optional();

const calendarDateSchema = z
  .string({ error: MESSAGES.DATE_INVALID })
  .refine(isCalendarDate, { error: MESSAGES.DATE_INVALID });

export const listPeriodShape = {
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
};

export const listSearchSchema = z
  .string({ error: MESSAGES.SEARCH_INVALID })
  .trim()
  .min(LIST_SEARCH_MIN_LENGTH, { error: MESSAGES.SEARCH_INVALID })
  .max(LIST_SEARCH_MAX_LENGTH, { error: MESSAGES.SEARCH_INVALID })
  .refine((text) => !text.includes(NUL_CHARACTER), {
    error: MESSAGES.SEARCH_FORBIDDEN_CHARACTER,
  });

export function csvEnumSchema<const T extends readonly [string, ...string[]]>(values: T) {
  const allowed = new Set<string>(values);

  return z
    .string({ error: MESSAGES.FILTER_VALUE_INVALID })
    .transform((raw) => [...new Set(raw.split(LIST_CSV_SEPARATOR).map((item) => item.trim()))])
    .refine(
      (items) =>
        items.length > 0 &&
        items.length <= LIST_CSV_MAX_VALUES &&
        items.every((item) => allowed.has(item)),
      { error: MESSAGES.FILTER_VALUE_INVALID },
    )
    .transform((items) => items as T[number][]);
}

export function unknownParameterError(issue: z.core.$ZodRawIssue): string | undefined {
  return issue.code === 'unrecognized_keys'
    ? `${MESSAGES.UNKNOWN_PARAMETER}: ${issue.keys.join(', ')}`
    : undefined;
}

export type RawListQuery = RawListPagination & {
  sort?: string;
  from?: string;
  to?: string;
};

type Problem = { path: string; message: string };

export class ListQueryError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.message);
  }
}

function fail(path: string, message: string): never {
  throw new ListQueryError({ path, message });
}

function parseSort<K extends string>(raw: string | undefined, spec: SortSpec<K>): ListSort<K> {
  if (raw === undefined) {
    return spec.defaultSort;
  }

  const [key, direction, ...rest] = raw.split(LIST_SORT_SEPARATOR);
  const isKnownKey = Object.hasOwn(spec.whitelist, key);
  const isKnownDirection = (SORT_DIRECTION_VALUES as readonly string[]).includes(direction);

  if (!isKnownKey || !isKnownDirection || rest.length > 0) {
    fail('sort', MESSAGES.SORT_INVALID);
  }

  return { key: key as K, direction: direction as ListSort<K>['direction'] };
}

function decodePosition<K extends string>(raw: string, sort: ListSort<K>, spec: SortSpec<K>) {
  const cursor = decodeListCursor(raw);

  if (!cursor || !isSortValueValid(spec.whitelist[sort.key].kind, cursor.v)) {
    fail('cursor', MESSAGES.CURSOR_INVALID);
  }

  if (cursor.k !== sort.key || cursor.d !== sort.direction) {
    fail('cursor', MESSAGES.CURSOR_SORT_MISMATCH);
  }

  return { value: cursor.v, id: cursor.id };
}

function parsePagination<K extends string>(
  raw: RawListQuery,
  sort: ListSort<K>,
  spec: SortSpec<K>,
): ListPagination {
  if (raw.cursor === undefined) {
    const page = raw.page ?? LIST_FIRST_PAGE;

    if ((page - LIST_FIRST_PAGE) * raw.limit > LIST_OFFSET_MAX) {
      fail('page', MESSAGES.TOO_DEEP);
    }

    return { mode: 'page', page, limit: raw.limit, until: raw.until ?? null };
  }

  if (raw.page !== undefined) {
    fail('cursor', MESSAGES.PAGE_AND_CURSOR);
  }

  if (raw.until !== undefined) {
    fail('until', MESSAGES.CURSOR_AND_UNTIL);
  }

  const position =
    raw.cursor === LIST_CURSOR_FIRST_PAGE ? null : decodePosition(raw.cursor, sort, spec);

  return { mode: 'cursor', limit: raw.limit, position };
}

function resolve<K extends string>(raw: RawListQuery, spec: SortSpec<K>): ListQuery<K> {
  const sort = parseSort(raw.sort, spec);
  const pagination = parsePagination(raw, sort, spec);

  if (raw.from !== undefined && raw.to !== undefined && raw.from > raw.to) {
    fail('from', MESSAGES.PERIOD_INVALID);
  }

  return { pagination, sort, period: toDateRange(raw, APP_TIME_ZONE) };
}

export function resolveListQuery<K extends string>(
  raw: RawListQuery,
  spec: SortSpec<K>,
  ctx: z.RefinementCtx,
): ListQuery<K> | null {
  try {
    return resolve(raw, spec);
  } catch (error) {
    if (!(error instanceof ListQueryError)) {
      throw error;
    }

    ctx.addIssue({ code: 'custom', path: [error.problem.path], message: error.problem.message });

    return null;
  }
}

export function resolveListSort<K extends string>(
  raw: string | undefined,
  spec: SortSpec<K>,
  ctx: z.RefinementCtx,
): ListSort<K> | null {
  try {
    return parseSort(raw, spec);
  } catch (error) {
    if (!(error instanceof ListQueryError)) {
      throw error;
    }

    ctx.addIssue({ code: 'custom', path: [error.problem.path], message: error.problem.message });

    return null;
  }
}
