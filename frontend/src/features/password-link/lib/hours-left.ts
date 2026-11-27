const MS_PER_HOUR = 3_600_000;

export function hoursLeft(expiresAt: Date, now: number): number {
  return Math.max(0, Math.round((expiresAt.getTime() - now) / MS_PER_HOUR));
}
