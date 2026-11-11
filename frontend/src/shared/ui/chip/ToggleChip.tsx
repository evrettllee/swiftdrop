import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';

type ToggleChipProps = {
  label: string;
  count?: number;
  isPressed: boolean;
  onClick: () => void;
};

export function ToggleChip({ label, count, isPressed, onClick }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={isPressed}
      onClick={onClick}
      className={joinClassNames(
        'inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md border px-3 text-small whitespace-nowrap lg:min-h-9',
        COLOR_TRANSITION_CLASS,
        isPressed
          ? 'border-accent bg-selected font-semibold text-accent'
          : 'border-border bg-surface text-fg hover:bg-surface-muted',
      )}
    >
      {label}
      {count === undefined ? null : (
        <span className="font-normal text-fg-secondary tabular-nums">{count}</span>
      )}
    </button>
  );
}
