import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { FAILURE_MERGE_WINDOW_MIN } from '../constants/service-failures.constants';

const MERGE_WINDOW_MS = FAILURE_MERGE_WINDOW_MIN * MS_PER_MINUTE;

export function canMergeFailure(lastAt: Date | null, now: Date): boolean {
  return lastAt !== null && now.getTime() - lastAt.getTime() <= MERGE_WINDOW_MS;
}

export function clipText(text: string, maxLength: number): string {
  return Array.from(text).slice(0, maxLength).join('');
}
