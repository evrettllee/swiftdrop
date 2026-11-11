import { and, lte, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { LIST_FIRST_PAGE } from '@/common/constants/list.constants';
import type {
  CursorPage,
  CursorPagination,
  ListPage,
  ListQuery,
  Page,
  PagePagination,
} from '@/common/types/page.types';
import { encodeListCursor } from '@/common/utils/list-cursor';
import {
  keysetCondition,
  type SortField,
  sortOrderBy,
  sortValueSql,
  type SortWhitelist,
} from './list-sort';

export type SortedRow = { sortValue: string };

export type ListFetch = {
  where: SQL | undefined;
  orderBy: SQL[];
  limit: number;
  offset: number;
  sortValue: SQL<string>;
};

export type ListSource<K extends string, TRow extends SortedRow> = {
  whitelist: SortWhitelist<K>;
  idColumn: AnyPgColumn;
  where: SQL | undefined;
  fetch: (options: ListFetch) => Promise<TRow[]>;
  count: (where: SQL | undefined) => Promise<number>;
  maxId: (where: SQL | undefined) => Promise<number | null>;
  idOf: (row: TRow) => number;
};

type Resolved<K extends string, TRow extends SortedRow> = {
  source: ListSource<K, TRow>;
  field: SortField;
  orderBy: SQL[];
  sortValue: SQL<string>;
};

async function pageMode<K extends string, TRow extends SortedRow>(
  { source, orderBy, sortValue }: Resolved<K, TRow>,
  pagination: PagePagination,
): Promise<Page<TRow>> {
  const { page, limit } = pagination;
  const until = pagination.until ?? (await source.maxId(source.where));
  const where = until === null ? source.where : and(source.where, lte(source.idColumn, until));
  const offset = (page - LIST_FIRST_PAGE) * limit;
  const [items, total] = await Promise.all([
    source.fetch({ where, orderBy, limit, offset, sortValue }),
    source.count(where),
  ]);

  return { items, total, page, limit, until };
}

async function cursorMode<K extends string, TRow extends SortedRow>(
  { source, field, orderBy, sortValue }: Resolved<K, TRow>,
  pagination: CursorPagination,
  sort: ListQuery<K>['sort'],
): Promise<CursorPage<TRow>> {
  const { limit, position } = pagination;
  const where =
    position === null
      ? source.where
      : and(source.where, keysetCondition(field, source.idColumn, sort.direction, position));
  const [rows, total] = await Promise.all([
    source.fetch({ where, orderBy, limit: limit + 1, offset: 0, sortValue }),
    position === null ? source.count(source.where) : Promise.resolve(undefined),
  ]);
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  const nextCursor =
    rows.length > limit && last
      ? encodeListCursor({
          k: sort.key,
          d: sort.direction,
          v: last.sortValue,
          id: source.idOf(last),
        })
      : null;

  return total === undefined ? { items, nextCursor } : { items, nextCursor, total };
}

export function paginate<K extends string, TRow extends SortedRow>(
  query: ListQuery<K>,
  source: ListSource<K, TRow>,
): Promise<ListPage<TRow>> {
  const field = source.whitelist[query.sort.key];
  const resolved: Resolved<K, TRow> = {
    source,
    field,
    orderBy: sortOrderBy(field, source.idColumn, query.sort),
    sortValue: sortValueSql(field),
  };

  return query.pagination.mode === 'page'
    ? pageMode(resolved, query.pagination)
    : cursorMode(resolved, query.pagination, query.sort);
}

export function mapPageItems<T, U>(page: ListPage<T>, map: (item: T) => U): ListPage<U> {
  return { ...page, items: page.items.map(map) };
}
