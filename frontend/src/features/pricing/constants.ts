import { HTTP_STATUS } from '../../shared/constants';

// API
export const PRICING_API_PATHS = {
  ESTIMATES: '/pricing/estimates',
} as const;

// The backend explains a 422 itself (out of the zone, too heavy), so only two statuses are replaced:
// 429 comes from the throttler without a Russian text, 503 means the routing service is down.
export const ESTIMATE_STATUS_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Слишком много расчётов подряд. Подождите минуту и повторите',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Не удалось построить маршрут. Попробуйте ещё раз чуть позже',
};
