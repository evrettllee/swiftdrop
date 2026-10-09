import { WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';

type FieldErrorProps = {
  id: string;
  children: ReactNode;
};

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <p id={id} className="flex items-start gap-1 text-small text-danger">
      <WarningCircleIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      />
      {children}
    </p>
  );
}
