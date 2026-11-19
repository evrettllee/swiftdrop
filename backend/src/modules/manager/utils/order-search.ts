import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { escapeLike } from '@/common/utils/escape-like';
import { searchDigits, searchPhoneOf } from '@/common/utils/search-phone';
import { ORDER_ID_MAX_DIGITS } from '../constants/manager-orders.constants';
import type { OrderSearch } from '../types/manager-orders.types';

function orderIdOf(digits: string): number | null {
  const value = Number(digits);

  return digits.length <= ORDER_ID_MAX_DIGITS && value > 0 && value <= DB_INTEGER_MAX
    ? value
    : null;
}

export function parseOrderSearch(query: string): OrderSearch {
  const digits = searchDigits(query);

  if (digits !== null && digits.length > 0) {
    return { kind: 'number', orderId: orderIdOf(digits), phone: searchPhoneOf(digits) };
  }

  return { kind: 'text', pattern: `%${escapeLike(query)}%` };
}
