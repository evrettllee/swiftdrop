import { MS_PER_SECOND } from '@/common/constants/time.constants';

export function isIssuedBeforeCutoff(
  issuedAtSeconds: number | undefined,
  sessionsValidAfter: Date | null,
): boolean {
  if (sessionsValidAfter === null) {
    return false;
  }

  const cutoffSeconds = Math.floor(sessionsValidAfter.getTime() / MS_PER_SECOND);

  return issuedAtSeconds === undefined || issuedAtSeconds < cutoffSeconds;
}
