import type { ReactNode } from 'react';
import { joinClassNames } from '@/shared/lib/class-names';

const BASE_CLASS = 'text-heading-md font-bold text-balance lg:text-heading-lg';

type PageTitleProps = {
  // Extra classes, for example `tabular-nums` for a title with a number.
  className?: string;
  children: ReactNode;
};

// The title of a page of the account area.
export function PageTitle({ className = '', children }: PageTitleProps) {
  return <h1 className={joinClassNames(BASE_CLASS, className)}>{children}</h1>;
}
