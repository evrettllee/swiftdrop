import { eq, ilike, or, type SQL, sql } from 'drizzle-orm';
import { escapeLike } from '@/common/utils/escape-like';
import { searchDigits, searchPhoneOf } from '@/common/utils/search-phone';
import { users } from '@/database/schema';
import { fullNameSql } from '@/database/sql-expressions';
import { PHONE_SEARCH_MIN_DIGITS } from '../constants/admin-users.constants';
import type { AdminUserSearch } from '../types/admin-users.types';

export function parseUserSearch(query: string): AdminUserSearch {
  const digits = searchDigits(query);

  if (digits !== null && digits.length >= PHONE_SEARCH_MIN_DIGITS) {
    return { kind: 'phone', phone: searchPhoneOf(digits) };
  }

  return { kind: 'text', pattern: `%${escapeLike(query)}%` };
}

export function userSearchCondition(search: AdminUserSearch | null): SQL | undefined {
  if (search === null) {
    return undefined;
  }

  if (search.kind === 'phone') {
    return search.phone === null ? sql`false` : eq(users.phone, search.phone);
  }

  return or(
    ilike(fullNameSql(users.firstName, users.lastName), search.pattern),
    ilike(users.email, search.pattern),
  );
}
