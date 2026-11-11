import {
  detectPreset,
  isPeriodValid,
  PERIOD_PRESET,
  type Period,
  type PeriodPreset,
  presetPeriod,
} from '@/shared/lib/calendar';

export type PeriodDraft = Period & { preset: PeriodPreset };

export function draftOf(period: Period, now: Date): PeriodDraft {
  return { preset: detectPreset(period, now), from: period.from, to: period.to };
}

export function draftPeriod(draft: PeriodDraft, now: Date): Period {
  return draft.preset === PERIOD_PRESET.CUSTOM
    ? { from: draft.from, to: draft.to }
    : presetPeriod(draft.preset, now);
}

export function isDraftValid(draft: PeriodDraft): boolean {
  return draft.preset !== PERIOD_PRESET.CUSTOM || isPeriodValid(draft);
}
