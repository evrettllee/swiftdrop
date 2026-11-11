import { PgDialect } from 'drizzle-orm/pg-core';
import { SORT_VALUE_KIND } from '@/common/constants/list.constants';
import type { CursorPage, ListQuery, Page } from '@/common/types/page.types';
import type { DateRange } from '@/common/utils/date-range';
import { decodeListCursor } from '@/common/utils/list-cursor';
import { orders } from '@/database/schema';
import { type ListFetch, type ListSource, paginate } from './paginate';

type Row = { orderId: number; price: string; sortValue: string };
type SortKey = 'price';

const dialect = new PgDialect({ casing: 'snake_case' });
const NO_PERIOD: DateRange = { start: null, end: null };
const PRICES = ['30.00', '20.00', '20.00', '20.00', '10.00', '20.00', '5.00'];

function table(): Row[] {
  return PRICES.map((price, index) => ({ orderId: index + 1, price, sortValue: price }));
}

function byPriceThenIdDesc(first: Row, second: Row): number {
  return Number(second.price) - Number(first.price) || second.orderId - first.orderId;
}

function belowPosition(row: Row, value: string, id: number): boolean {
  return (
    Number(row.price) < Number(value) || (Number(row.price) === Number(value) && row.orderId < id)
  );
}

function fakeSource(rows: Row[]) {
  const fetch = jest.fn(({ where, limit, offset }: ListFetch) => {
    const { sql, params } = where ? dialect.sqlToQuery(where) : { sql: '', params: [] };
    const until = sql.includes('<=') ? Number(params[0]) : Infinity;
    const keyset = sql.includes('>') || sql.includes(') <') ? params.slice(-2) : null;
    const visible = rows
      .filter((row) => row.orderId <= until)
      .filter((row) => !keyset || belowPosition(row, String(keyset[0]), Number(keyset[1])))
      .sort(byPriceThenIdDesc);

    return Promise.resolve(visible.slice(offset, offset + limit));
  });
  const source: ListSource<SortKey, Row> = {
    whitelist: { price: { column: orders.price, kind: SORT_VALUE_KIND.DECIMAL } },
    idColumn: orders.orderId,
    where: undefined,
    fetch,
    count: jest.fn((where) => {
      const sql = where ? dialect.sqlToQuery(where) : null;
      const until = sql ? Number(sql.params[0]) : Infinity;

      return Promise.resolve(rows.filter((row) => row.orderId <= until).length);
    }),
    maxId: jest.fn(() => Promise.resolve(Math.max(...rows.map((row) => row.orderId)))),
    idOf: (row) => row.orderId,
  };

  return { source, fetch };
}

function pageQuery(page: number, limit: number, until: number | null = null): ListQuery<SortKey> {
  return {
    pagination: { mode: 'page', page, limit, until },
    sort: { key: 'price', direction: 'desc' },
    period: NO_PERIOD,
  };
}

function cursorQuery(limit: number, cursor: string | null): ListQuery<SortKey> {
  const decoded = cursor === null ? null : decodeListCursor(cursor);

  return {
    pagination: {
      mode: 'cursor',
      limit,
      position: decoded ? { value: decoded.v, id: decoded.id } : null,
    },
    sort: { key: 'price', direction: 'desc' },
    period: NO_PERIOD,
  };
}

describe('paginate in the page mode', () => {
  it('should take the largest id as the bound when none is given and return it', async () => {
    const { source } = fakeSource(table());

    const page = (await paginate(pageQuery(1, 3), source)) as Page<Row>;

    expect(page).toMatchObject({ page: 1, limit: 3, until: PRICES.length, total: PRICES.length });
    expect(source.maxId).toHaveBeenCalledTimes(1);
  });

  it('should leave out rows added after the bound and count without them', async () => {
    const rows = table();
    const { source } = fakeSource(rows);
    const first = (await paginate(pageQuery(1, 3), source)) as Page<Row>;
    rows.push({ orderId: 100, price: '99.00', sortValue: '99.00' });

    const second = (await paginate(pageQuery(1, 3, first.until), source)) as Page<Row>;

    expect(second.items.map((row) => row.orderId)).toEqual(first.items.map((row) => row.orderId));
    expect(second.total).toBe(PRICES.length);
    expect(source.maxId).toHaveBeenCalledTimes(1);
  });

  it('should skip (page - 1) × limit rows', async () => {
    const { source, fetch } = fakeSource(table());

    await paginate(pageQuery(3, 2), source);

    expect(fetch).toHaveBeenCalledWith(expect.objectContaining({ limit: 2, offset: 4 }));
  });

  it('should answer an empty list with no bound', async () => {
    const { source } = fakeSource([]);
    source.maxId = jest.fn(() => Promise.resolve(null));

    await expect(paginate(pageQuery(1, 3), source)).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 3,
      until: null,
    });
  });
});

describe('paginate in the cursor mode', () => {
  it('should walk the list without repeats or gaps when the sort values are equal', async () => {
    const { source } = fakeSource(table());
    const seen: number[] = [];
    let cursor: string | null = null;
    let first: CursorPage<Row> | null = null;

    do {
      const page = (await paginate(cursorQuery(2, cursor), source)) as CursorPage<Row>;
      first ??= page;
      seen.push(...page.items.map((row) => row.orderId));
      cursor = page.nextCursor;
    } while (cursor !== null);

    expect(seen).toEqual([...table()].sort(byPriceThenIdDesc).map((row) => row.orderId));
    expect(first?.total).toBe(PRICES.length);
  });

  it('should give the total only on the first page', async () => {
    const { source } = fakeSource(table());
    const first = (await paginate(cursorQuery(3, null), source)) as CursorPage<Row>;

    const second = (await paginate(cursorQuery(3, first.nextCursor), source)) as CursorPage<Row>;

    expect(first.total).toBe(PRICES.length);
    expect(second).not.toHaveProperty('total');
  });

  it('should end with no next cursor when the rows run out exactly', async () => {
    const { source } = fakeSource(table());

    const page = (await paginate(cursorQuery(PRICES.length, null), source)) as CursorPage<Row>;

    expect(page.items).toHaveLength(PRICES.length);
    expect(page.nextCursor).toBeNull();
  });

  it('should write the sort and the last row into the next cursor', async () => {
    const { source } = fakeSource(table());

    const page = (await paginate(cursorQuery(2, null), source)) as CursorPage<Row>;

    expect(decodeListCursor(page.nextCursor ?? '')).toEqual({
      k: 'price',
      d: 'desc',
      v: '20.00',
      id: 6,
    });
  });
});
