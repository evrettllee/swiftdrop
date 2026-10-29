import { LIST_CURSOR_MAX_LENGTH } from '@/common/constants/list.constants';
import { decodeListCursor, encodeListCursor, type ListCursor } from './list-cursor';

const CURSOR: ListCursor = { k: 'createdAt', d: 'desc', v: '1793000000123456', id: 42 };

function encodeRaw(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

describe('list cursor', () => {
  it('should decode what it encoded', () => {
    expect(decodeListCursor(encodeListCursor(CURSOR))).toEqual(CURSOR);
  });

  it('should encode to base64url only', () => {
    expect(encodeListCursor(CURSOR)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    ['not base64url', 'abc$%'],
    ['not JSON', Buffer.from('{oops', 'utf8').toString('base64url')],
    ['JSON of a wrong shape', encodeRaw({ k: 'createdAt' })],
    ['an extra field', encodeRaw({ ...CURSOR, extra: 1 })],
    ['an unknown direction', encodeRaw({ ...CURSOR, d: 'up' })],
    ['a string id', encodeRaw({ ...CURSOR, id: '42' })],
    ['an id beyond the integer column', encodeRaw({ ...CURSOR, id: 2 ** 31 })],
    ['an empty value', encodeRaw({ ...CURSOR, v: '' })],
    ['an array', encodeRaw([CURSOR])],
    ['a string that is too long', 'a'.repeat(LIST_CURSOR_MAX_LENGTH + 1)],
  ])('should refuse %s', (_, raw) => {
    expect(decodeListCursor(raw)).toBeNull();
  });
});
