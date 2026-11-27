import { ArrowLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { Fragment } from 'react';
import { Link } from 'react-router';
import { COLOR_TRANSITION_CLASS, ICON_SIZE, ICON_WEIGHT } from '@/shared/config';

type Crumb = { label: string; to: string };

type BreadcrumbsProps = {
  label: string;
  root?: Crumb;
  parent: Crumb;
  current: string;
};

const CRUMB_LINK_CLASS = `rounded-sm text-fg-secondary hover:text-accent hover:underline ${COLOR_TRANSITION_CLASS}`;

export function Breadcrumbs({ label, root, parent, current }: BreadcrumbsProps) {
  const trail = root === undefined ? [parent] : [root, parent];

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
        {trail.map((crumb) => (
          <Fragment key={crumb.label}>
            <li>
              <Link to={crumb.to} className={CRUMB_LINK_CLASS}>
                {crumb.label}
              </Link>
            </li>
            <li aria-hidden="true" className="text-fg-muted">
              <CaretRightIcon size={ICON_SIZE.SMALL} weight={ICON_WEIGHT} />
            </li>
          </Fragment>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
