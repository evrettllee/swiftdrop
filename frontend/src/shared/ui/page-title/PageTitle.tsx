import type { ReactNode, Ref } from 'react';
import { joinClassNames } from '@/shared/lib/class-names';

const BASE_CLASS = 'text-heading-md font-bold text-balance lg:text-heading-lg';

type PageTitleProps = {
  // Extra classes, for example `tabular-nums` for a title with a number.
  className?: string;
  // For a title the focus is moved to when the screen changes under the user (with tabIndex -1).
  ref?: Ref<HTMLHeadingElement>;
  tabIndex?: number;
  children: ReactNode;
};

// The title of a page of the account area.
export function PageTitle({ className = '', ref, tabIndex, children }: PageTitleProps) {
  return (
    <h1 ref={ref} tabIndex={tabIndex} className={joinClassNames(BASE_CLASS, className)}>
      {children}
    </h1>
  );
}
