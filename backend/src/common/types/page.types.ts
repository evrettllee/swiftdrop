import type { DateRange } from '@/common/utils/date-range';

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  until: number | null;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  total?: number;
};

export type ListPage<T> = Page<T> | CursorPage<T>;

export type KeysetPosition = { value: string; id: number };

export type PagePagination = {
  mode: 'page';
  page: number;
  limit: number;
  until: number | null;
};

export type CursorPagination = {
  mode: 'cursor';
  limit: number;
  position: KeysetPosition | null;
};

export type ListPagination = PagePagination | CursorPagination;

export type ListQuery<K extends string> = {
  pagination: ListPagination;
  sort: { key: K; direction: 'asc' | 'desc' };
  period: DateRange;
};
