import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { LIST_CURSOR_MAX_LENGTH, SORT_DIRECTION_VALUES } from '@/common/constants/list.constants';

const BASE64URL = /^[A-Za-z0-9_-]+$/;
const CURSOR_VALUE_MAX_LENGTH = 32;
const CURSOR_KEY_MAX_LENGTH = 32;

const listCursorSchema = z.strictObject({
  k: z.string().min(1).max(CURSOR_KEY_MAX_LENGTH),
  d: z.enum(SORT_DIRECTION_VALUES),
  v: z.string().min(1).max(CURSOR_VALUE_MAX_LENGTH),
  id: z.number().int().positive().max(DB_INTEGER_MAX),
});

export type ListCursor = z.infer<typeof listCursorSchema>;

export function encodeListCursor(cursor: ListCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function decodeListCursor(raw: string): ListCursor | null {
  if (raw.length > LIST_CURSOR_MAX_LENGTH || !BASE64URL.test(raw)) {
    return null;
  }

  const parsed = listCursorSchema.safeParse(
    parseJson(Buffer.from(raw, 'base64url').toString('utf8')),
  );

  return parsed.success ? parsed.data : null;
}
