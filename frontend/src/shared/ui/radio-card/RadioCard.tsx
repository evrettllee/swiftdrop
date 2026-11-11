import type { Icon } from '@phosphor-icons/react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';

export type RadioCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> & {
  icon?: Icon;
  title: string;
  description?: string;
  // Shown at the end of the card, for example a limit or a price.
  aside?: ReactNode;
  density?: RadioCardDensity;
  isTruncated?: boolean;
};

export type RadioCardDensity = 'regular' | 'compact' | 'centered';

const DENSITY_CLASSES: Record<RadioCardDensity, { card: string; circle: string; title: string }> = {
  regular: { card: 'items-start p-4', circle: 'mt-0.5', title: 'font-semibold' },
  compact: { card: 'items-center px-4 py-3', circle: '', title: '' },
  centered: { card: 'items-center px-4 py-3', circle: '', title: 'font-semibold' },
};

const CARD_CLASS = joinClassNames(
  'group relative flex cursor-pointer gap-3 rounded-lg border border-border bg-surface text-body',
  COLOR_TRANSITION_CLASS,
  'has-checked:border-accent has-checked:bg-selected',
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
  'has-disabled:cursor-not-allowed has-disabled:opacity-60',
);

// The dot of the chosen card is drawn by ::after of the circle.
const CIRCLE_CLASS = joinClassNames(
  'grid size-5 shrink-0 place-items-center rounded-full border border-fg-muted',
  'after:hidden after:size-2.5 after:rounded-full after:bg-accent',
  'peer-checked:border-accent peer-checked:after:block',
);

// One choice of a group shown as a card. The native radio stays in the page, so the arrows of the
// keyboard move between the cards of one name and screen readers read the group.
export function RadioCard({
  icon: CardIcon,
  title,
  description,
  aside,
  density = 'regular',
  isTruncated = false,
  ...inputProps
}: RadioCardProps) {
  const lineClass = isTruncated ? 'truncate' : '';
  const classes = DENSITY_CLASSES[density];

  return (
    <label className={joinClassNames(CARD_CLASS, classes.card)}>
      <input type="radio" className="peer sr-only" {...inputProps} />
      <span aria-hidden="true" className={joinClassNames(CIRCLE_CLASS, classes.circle)} />
      {CardIcon === undefined ? null : (
        <CardIcon
          size={ICON_SIZE.LARGE}
          weight={ICON_WEIGHT}
          aria-hidden="true"
          className="shrink-0 text-fg-secondary group-has-checked:text-accent"
        />
      )}
      <span className="flex min-w-0 grow flex-col">
        <span className={joinClassNames(classes.title, lineClass)}>{title}</span>
        {description === undefined ? null : (
          <span className={joinClassNames('text-small text-fg-secondary', lineClass)}>
            {description}
          </span>
        )}
      </span>
      {aside === undefined ? null : (
        <span className="ms-auto ps-3 font-semibold whitespace-nowrap tabular-nums">{aside}</span>
      )}
    </label>
  );
}
