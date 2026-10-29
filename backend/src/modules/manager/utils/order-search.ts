import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { PHONE_MAX_DIGITS, PHONE_MIN_DIGITS } from '@/common/constants/person-validation.constants';
import { escapeLike } from '@/common/utils/escape-like';
import {
  NON_DIGITS,
  NUMERIC_SEARCH,
  ORDER_ID_MAX_DIGITS,
  PHONE_PREFIX,
} from '../constants/manager-orders.constants';
import type { OrderSearch } from '../types/manager-orders.types';

function orderIdOf(digits: string): number | null {
  const value = Number(digits);

  return digits.length <= ORDER_ID_MAX_DIGITS && value > 0 && value <= DB_INTEGER_MAX
    ? value
    : null;
}

function phoneOf(digits: string): string | null {
  return digits.length >= PHONE_MIN_DIGITS && digits.length <= PHONE_MAX_DIGITS
    ? `${PHONE_PREFIX}${digits}`
    : null;
}

export function parseOrderSearch(query: string): OrderSearch {
  const digits = query.replace(NON_DIGITS, '');

  if (NUMERIC_SEARCH.test(query) && digits.length > 0) {
    return { kind: 'number', orderId: orderIdOf(digits), phone: phoneOf(digits) };
  }

  return { kind: 'text', pattern: `%${escapeLike(query)}%` };
}
