import { FunnelIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { TICKET_TOPIC_LABELS, TICKET_TOPICS } from '@/entities/support-ticket';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { PERIOD_PRESET, PERIOD_PRESETS } from '@/shared/lib/calendar';
import { COUNT_BADGE_PLACEMENT, CountBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import type { SupportView } from '@/shared/support-api';
import { PeriodControl, PeriodForm, type PeriodFormLayout } from '@/shared/ui/period-picker';
import { FILTER_TEXTS, PERIOD_LABELS } from '../config/texts';
import {
  CLEARED_DRAFT,
  countFilters,
  filterDraftOf,
  filterPatch,
  isFilterDraftValid,
  type SupportFilterDraft,
  type SupportFilters as SupportFilterValues,
  toggleTopic,
} from '../model/support-filters';
import { type QueueFilters, useTicketsCount } from '../model/ticket-counts';

const PRESET_OPTIONS = PERIOD_PRESETS.map((value) => ({ value, label: PERIOD_LABELS[value] }));

const PERIOD_FORM_TEXTS = {
  legend: FILTER_TEXTS.PERIOD,
  from: FILTER_TEXTS.PERIOD_FROM,
  to: FILTER_TEXTS.PERIOD_TO,
  invalid: FILTER_TEXTS.PERIOD_INVALID,
  reset: FILTER_TEXTS.RESET,
};

type SupportFiltersProps = {
  isDesktop: boolean;
  value: SupportFilterValues;
  view: SupportView;
  applied: QueueFilters;
  now: Date;
  onApply: (filters: SupportFilterValues) => void;
};

function SupportFiltersForm({
  value,
  view,
  applied,
  now,
  layout,
  onApply,
}: Omit<SupportFiltersProps, 'isDesktop'> & { layout: PeriodFormLayout }) {
  const [draft, setDraft] = useState<SupportFilterDraft>(() => filterDraftOf(value, now));
  const isValid = isFilterDraftValid(draft);
  const draftFilters = useMemo<QueueFilters | null>(() => {
    const patch = filterPatch(draft, now);

    return isValid ? { ...applied, topics: patch.topic, from: patch.from, to: patch.to } : null;
  }, [applied, draft, isValid, now]);
  const count = useTicketsCount(view, draftFilters, FILTER_TEXTS.COUNT_DELAY_MS);

  return (
    <PeriodForm
      layout={layout}
      presets={PRESET_OPTIONS}
      customValue={PERIOD_PRESET.CUSTOM}
      draft={draft}
      defaultDraft={CLEARED_DRAFT}
      isValid={isValid}
      texts={{
        ...PERIOD_FORM_TEXTS,
        apply: count === null ? FILTER_TEXTS.APPLY : FILTER_TEXTS.showTickets(count),
      }}
      onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
      onReset={() => setDraft(CLEARED_DRAFT)}
      onApply={() => onApply(filterPatch(draft, now))}
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-caption font-semibold text-fg-secondary uppercase">
          {FILTER_TEXTS.TOPIC}
        </legend>
        {TICKET_TOPICS.map((topic) => (
          <Checkbox
            key={topic}
            label={TICKET_TOPIC_LABELS[topic]}
            checked={draft.topics.includes(topic)}
            onChange={() =>
              setDraft((current) => ({ ...current, topics: toggleTopic(current.topics, topic) }))
            }
          />
        ))}
      </fieldset>
    </PeriodForm>
  );
}

export function SupportFilters({ isDesktop, onApply, ...props }: SupportFiltersProps) {
  const count = countFilters(props.value);

  return (
    <PeriodControl
      isDesktop={isDesktop}
      title={FILTER_TEXTS.FILTERS}
      label={FILTER_TEXTS.FILTERS}
      renderTrigger={(trigger) => (
        <Button
          variant="secondary"
          icon={<FunnelIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />}
          {...trigger}
        >
          {FILTER_TEXTS.FILTERS}
          <CountBadge count={count} placement={COUNT_BADGE_PLACEMENT.INLINE} />
        </Button>
      )}
    >
      {(layout, close) => (
        <SupportFiltersForm
          {...props}
          layout={layout}
          onApply={(filters) => {
            onApply(filters);
            close();
          }}
        />
      )}
    </PeriodControl>
  );
}
