import {
  BELARUS_COUNTRY_CODE,
  BELARUS_NATIONAL_DIGITS,
  BELARUS_TRUNK_PREFIX,
  NON_DIGITS,
  NUMERIC_SEARCH,
  PHONE_MAX_DIGITS,
  PHONE_MIN_DIGITS,
  PHONE_PREFIX,
} from '@/common/constants/person-validation.constants';

const BELARUS_TRUNK_DIGITS = BELARUS_TRUNK_PREFIX.length + BELARUS_NATIONAL_DIGITS;

function internationalDigits(digits: string): string {
  if (digits.length === BELARUS_TRUNK_DIGITS && digits.startsWith(BELARUS_TRUNK_PREFIX)) {
    return `${BELARUS_COUNTRY_CODE}${digits.slice(BELARUS_TRUNK_PREFIX.length)}`;
  }

  return digits.length === BELARUS_NATIONAL_DIGITS ? `${BELARUS_COUNTRY_CODE}${digits}` : digits;
}

export function searchDigits(query: string): string | null {
  return NUMERIC_SEARCH.test(query) ? query.replace(NON_DIGITS, '') : null;
}

export function searchPhoneOf(digits: string): string | null {
  const international = internationalDigits(digits);

  return international.length >= PHONE_MIN_DIGITS && international.length <= PHONE_MAX_DIGITS
    ? `${PHONE_PREFIX}${international}`
    : null;
}
