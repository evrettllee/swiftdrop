import { MS_PER_MINUTE } from '@/shared/config';
import { useNow } from './useNow';

export function useMinuteNow(): number {
  return useNow(MS_PER_MINUTE);
}
