import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';

type EmptyStateProps = {
  icon: Icon;
  title: string;
  text: string;
  // The button under the text, if there is an action to offer.
  children?: ReactNode;
};

// The state of a block without content: no orders yet, nothing found, the list did not load.
export function EmptyState({ icon: StateIcon, title, text, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 lg:py-24 text-center">
      <StateIcon
        size={ICON_SIZE.XLARGE}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="text-fg-secondary"
      />
      <div className="flex flex-col gap-1">
        <h2 className="text-heading-sm font-semibold text-balance">{title}</h2>
        <p className="max-w-70 text-small text-pretty text-fg-secondary">{text}</p>
      </div>
      {children}
    </div>
  );
}
