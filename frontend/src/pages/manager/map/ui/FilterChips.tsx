import { type KeyboardEvent, useRef } from 'react';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import type { MapFilter } from '../config/map';
import { FILTER_LABELS, MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';
import { type FilterChip, nextRadioIndex } from '../lib/courier-state';

type FilterChipsProps = {
  chips: readonly FilterChip[];
  filter: MapFilter | null;
  onChange: (filter: MapFilter | null) => void;
};

export function FilterChips({ chips, filter, onChange }: FilterChipsProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const nextIndex = nextRadioIndex(event.key, index, chips.length);

    if (nextIndex !== null) {
      event.preventDefault();
      onChange(chips[nextIndex].filter);
      buttonRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={TEXTS.FILTERS_LABEL}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
    >
      {chips.map((chip, index) => {
        const isSelected = chip.filter === filter;
        const label = chip.filter === null ? TEXTS.ALL : FILTER_LABELS[chip.filter];

        return (
          <button
            key={chip.filter ?? 'all'}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(chip.filter)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={joinClassNames(
              'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1 rounded-md border px-3 text-small whitespace-nowrap lg:min-h-9',
              COLOR_TRANSITION_CLASS,
              isSelected
                ? 'border-accent bg-selected font-semibold text-accent'
                : 'border-border bg-surface text-fg hover:bg-surface-muted',
            )}
          >
            {label}
            <span className="font-normal text-fg-secondary tabular-nums">{chip.count}</span>
          </button>
        );
      })}
    </div>
  );
}
