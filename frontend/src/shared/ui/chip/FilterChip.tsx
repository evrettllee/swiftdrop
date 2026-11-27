import { XIcon } from '@phosphor-icons/react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';

type FilterChipProps = {
  name: string;
  value: string;
  removeLabel: string;
  onRemove: () => void;
};

export function FilterChip({ name, value, removeLabel, onRemove }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-label={removeLabel}
      onClick={onRemove}
      className={`inline-flex min-h-11 max-w-full min-w-0 items-center gap-1 rounded-md border border-border bg-surface ps-3 pe-2 text-small whitespace-nowrap hover:bg-surface-muted lg:min-h-9 ${COLOR_TRANSITION_CLASS}`}
    >
      <span className="shrink-0 text-fg-secondary">{name}:</span>
      <span className="min-w-0 truncate font-semibold">{value}</span>
      <XIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="ms-1 shrink-0 text-fg-secondary"
      />
    </button>
  );
}
