import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { PHONE_MAX_DIGITS, PHONE_MIN_DIGITS } from '@/common/constants/person-validation.constants';
import { escapeLike } from '@/common/utils/escape-like';
import {
  BELARUS_COUNTRY_CODE,
  BELARUS_NATIONAL_DIGITS,
  BELARUS_TRUNK_PREFIX,
  NON_DIGITS,
  NUMERIC_SEARCH,
  ORDER_ID_MAX_DIGITS,
  PHONE_PREFIX,
} from '../constants/manager-orders.constants';
import type { OrderSearch } from '../types/manager-orders.types';

const BELARUS_TRUNK_DIGITS = BELARUS_TRUNK_PREFIX.length + BELARUS_NATIONAL_DIGITS;

function orderIdOf(digits: string): number | null {
  const value = Number(digits);

  return digits.length <= ORDER_ID_MAX_DIGITS && value > 0 && value <= DB_INTEGER_MAX
    ? value
    : null;
}

function internationalDigits(digits: string): string {
  if (digits.length === BELARUS_TRUNK_DIGITS && digits.startsWith(BELARUS_TRUNK_PREFIX)) {
    return `${BELARUS_COUNTRY_CODE}${digits.slice(BELARUS_TRUNK_PREFIX.length)}`;
  }

  return digits.length === BELARUS_NATIONAL_DIGITS ? `${BELARUS_COUNTRY_CODE}${digits}` : digits;
}

function phoneOf(digits: string): string | null {
  const international = internationalDigits(digits);

  return international.length >= PHONE_MIN_DIGITS && international.length <= PHONE_MAX_DIGITS
    ? `${PHONE_PREFIX}${international}`
    : null;
}

export function parseOrderSearch(query: string): OrderSearch {
  const digits = query.replace(NON_DIGITS, '');

  if (NUMERIC_SEARCH.test(query) && digits.length > 0) {
    return { kind: 'number', orderId: orderIdOf(digits), phone: phoneOf(digits) };
  }

  return { kind: 'text', pattern: `%${escapeLike(query)}%` };
}
