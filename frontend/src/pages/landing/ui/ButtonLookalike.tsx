import type { ReactNode } from 'react';

type ButtonLookalikeProps = {
  // The caller sets the display (`inline-flex`, `hidden lg:inline-flex`, ...).
  className: string;
  children: ReactNode;
};

// A secondary button drawn inside an illustration. It is a picture, not a control, so it cannot be
// focused and screen readers skip it.
export function ButtonLookalike({ className, children }: ButtonLookalikeProps) {
  return (
    <span
      aria-hidden="true"
      className={`min-h-11 items-center gap-2 rounded-md border border-border-button bg-surface px-4 font-semibold text-accent ${className}`}
    >
      {children}
    </span>
  );
}
