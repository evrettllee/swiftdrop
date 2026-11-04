import { ArrowLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';

type BreadcrumbsProps = {
  label: string;
  parent: { label: string; to: string };
  current: string;
};

export function Breadcrumbs({ label, parent, current }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className="text-small">
      <Link
        to={parent.to}
        className={`-ms-1 inline-flex min-h-11 items-center gap-2 rounded-sm px-1 font-semibold text-accent lg:hidden ${COLOR_TRANSITION_CLASS}`}
      >
        <ArrowLeftIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        {parent.label}
      </Link>
      <ol className="hidden items-center gap-2 lg:flex">
        <li>
          <Link
            to={parent.to}
            className={`rounded-sm text-fg-secondary hover:text-accent hover:underline ${COLOR_TRANSITION_CLASS}`}
          >
            {parent.label}
          </Link>
        </li>
        <li aria-hidden="true" className="text-fg-muted">
          <CaretRightIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} />
        </li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
