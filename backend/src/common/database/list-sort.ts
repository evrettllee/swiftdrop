import { asc, desc, type SQL, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  SORT_DIRECTION,
  SORT_DIRECTION_VALUES,
  SORT_VALUE_KIND,
  SORT_VALUE_PATTERNS,
} from '@/common/constants/list.constants';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import type { KeysetPosition } from '@/common/types/page.types';

export type SortDirection = (typeof SORT_DIRECTION_VALUES)[number];

export type SortValueKind = (typeof SORT_VALUE_KIND)[keyof typeof SORT_VALUE_KIND];

export type SortField = {
  column: AnyPgColumn;
  kind: SortValueKind;
};

export type SortWhitelist<K extends string> = Record<K, SortField>;

export type ListSort<K extends string = string> = {
  key: K;
  direction: SortDirection;
};

export type SortSpec<K extends string> = {
  whitelist: SortWhitelist<K>;
  idColumn: AnyPgColumn;
  defaultSort: ListSort<K>;
};

function isIdField(field: SortField, idColumn: AnyPgColumn): boolean {
  return field.column === idColumn;
}

export function isSortValueValid(kind: SortValueKind, value: string): boolean {
  if (!SORT_VALUE_PATTERNS[kind].test(value)) {
    return false;
  }

  return kind !== SORT_VALUE_KIND.INTEGER || Math.abs(Number(value)) <= DB_INTEGER_MAX;
}

export function sortOrderBy(field: SortField, idColumn: AnyPgColumn, sort: ListSort): SQL[] {
  const order = sort.direction === SORT_DIRECTION.ASC ? asc : desc;

  return isIdField(field, idColumn) ? [order(idColumn)] : [order(field.column), order(idColumn)];
}

export function sortValueSql(field: SortField): SQL<string> {
  return field.kind === SORT_VALUE_KIND.TIMESTAMP
    ? sql<string>`(extract(epoch from ${field.column}) * 1000000)::bigint::text`
    : sql<string>`${field.column}::text`;
}

function castSortValue(kind: SortValueKind, value: string): SQL {
  if (kind === SORT_VALUE_KIND.TIMESTAMP) {
    return sql`(timestamptz 'epoch' + ${value}::bigint * interval '1 microsecond')`;
  }

  return kind === SORT_VALUE_KIND.DECIMAL ? sql`${value}::numeric` : sql`${value}::integer`;
}

export function keysetCondition(
  field: SortField,
  idColumn: AnyPgColumn,
  direction: SortDirection,
  position: KeysetPosition,
): SQL {
  const operator = sql.raw(direction === SORT_DIRECTION.ASC ? '>' : '<');
  const id = sql`${position.id}::integer`;

  return isIdField(field, idColumn)
    ? sql`${idColumn} ${operator} ${id}`
    : sql`(${field.column}, ${idColumn}) ${operator} (${castSortValue(field.kind, position.value)}, ${id})`;
}
