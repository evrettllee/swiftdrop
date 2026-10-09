import { MS_PER_MINUTE, MS_PER_SECOND } from '../../common/constants/time.constants';

// The official rate of one US dollar, parammode=2 means the currency is asked by its letter code.
export const NBRB_USD_RATE_URL = 'https://api.nbrb.by/exrates/rates/USD?parammode=2';

export const NBRB_REQUEST_TIMEOUT_MS = 5 * MS_PER_SECOND;

// The rate changes once a day, so an hour in memory is enough.
export const NBRB_CACHE_TTL_MS = 60 * MS_PER_MINUTE;

// After a failed request the last known rate is used, and a new request waits this long.
export const NBRB_RETRY_DELAY_MS = 5 * MS_PER_MINUTE;

export const NBRB_ERROR_MESSAGES = {
  RATE_UNAVAILABLE: 'Не удалось получить курс валюты, попробуйте позже',
} as const;
