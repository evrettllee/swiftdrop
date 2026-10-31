import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import {
  LIST_CURSOR_MAX_LENGTH,
  LIST_FIRST_PAGE,
  LIST_LIMIT_MAX,
  LIST_LIMIT_MIN,
  LIST_VALIDATION_MESSAGES,
} from '@/common/constants/list.constants';

const { PAGE_INVALID, LIMIT_INVALID, UNTIL_INVALID, CURSOR_INVALID } = LIST_VALIDATION_MESSAGES;

function queryInteger(message: string, min: number, max: number) {
  return z.coerce
    .number({ error: message })
    .int({ error: message })
    .min(min, { error: message })
    .max(max, { error: message });
}

export function listPaginationShape(limitDefault: number) {
  return {
    page: queryInteger(PAGE_INVALID, LIST_FIRST_PAGE, DB_INTEGER_MAX).optional(),
    limit: queryInteger(LIMIT_INVALID, LIST_LIMIT_MIN, LIST_LIMIT_MAX).default(limitDefault),
    until: queryInteger(UNTIL_INVALID, 1, DB_INTEGER_MAX).optional(),
    cursor: z
      .string({ error: CURSOR_INVALID })
      .max(LIST_CURSOR_MAX_LENGTH, { error: CURSOR_INVALID })
      .optional(),
  };
}

export type RawListPagination = {
  page?: number;
  limit: number;
  until?: number;
  cursor?: string;
};
