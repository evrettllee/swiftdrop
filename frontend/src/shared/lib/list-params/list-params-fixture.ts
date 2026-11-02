import { z } from 'zod';
import type { ListParamsConfig } from './list-params';

type Values = {
  status: 'all' | 'active';
  page: number;
  limit: number;
  q: string | null;
  payment: readonly string[];
  fragile: boolean;
};

export const LIST_TEST_CONFIG: ListParamsConfig<Values> = {
  schema: z.object({
    status: z.enum(['all', 'active']),
    page: z.coerce.number().int().min(1),
    limit: z.coerce.number().pipe(z.union([z.literal(20), z.literal(50), z.literal(100)])),
    q: z.string().trim().min(1).max(100),
    payment: z
      .string()
      .transform((raw) => raw.split(','))
      .pipe(z.array(z.enum(['paid', 'unpaid'])).min(1)),
    fragile: z.literal('true').transform(() => true),
  }),
  defaults: { status: 'all', page: 1, limit: 20, q: null, payment: [], fragile: false },
  pageKey: 'page',
  searchKey: 'q',
};

export function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}
