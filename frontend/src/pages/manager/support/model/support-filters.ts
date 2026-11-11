import { TICKET_TOPICS } from '@/entities/support-ticket';
import {
  detectPreset,
  isPeriodValid,
  type Period,
  PERIOD_PRESET,
  type PeriodPreset,
  presetPeriod,
} from '@/shared/lib/calendar';
import type { TicketTopic } from '@/shared/staff-api';
import type { PeriodDraftOf } from '@/shared/ui/period-picker';
import type { SupportParams } from '../config/params';

export type SupportFilters = Pick<SupportParams, 'topic' | 'from' | 'to'>;

export type SupportFilterDraft = PeriodDraftOf<PeriodPreset> & { topics: readonly TicketTopic[] };

export const CLEARED_DRAFT: SupportFilterDraft = {
  preset: PERIOD_PRESET.ALL,
  from: null,
  to: null,
  topics: [],
};

export function filtersPeriod(filters: Period): Period {
  return isPeriodValid(filters) ? { from: filters.from, to: filters.to } : { from: null, to: null };
}

export function filterDraftOf(filters: SupportFilters, now: Date): SupportFilterDraft {
  const period = filtersPeriod(filters);

  return { preset: detectPreset(period, now), ...period, topics: filters.topic };
}

export function isFilterDraftValid(draft: SupportFilterDraft): boolean {
  return draft.preset !== PERIOD_PRESET.CUSTOM || isPeriodValid(draft);
}

export function filterPatch(draft: SupportFilterDraft, now: Date): SupportFilters {
  const period =
    draft.preset === PERIOD_PRESET.CUSTOM
      ? { from: draft.from, to: draft.to }
      : presetPeriod(draft.preset, now);

  return { topic: draft.topics, ...period };
}

export function toggleTopic(topics: readonly TicketTopic[], topic: TicketTopic): TicketTopic[] {
  const isOn = !topics.includes(topic);

  return TICKET_TOPICS.filter((item) => (item === topic ? isOn : topics.includes(item)));
}

export function countFilters(filters: SupportFilters): number {
  const period = filtersPeriod(filters);
  const hasPeriod = period.from !== null || period.to !== null;

  return [filters.topic.length > 0, hasPeriod].filter(Boolean).length;
}
