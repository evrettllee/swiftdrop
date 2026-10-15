import { type ReactNode, useId } from 'react';

type SectionProps = {
  title: string;
  children: ReactNode;
};

// A titled block of a page; the title names the section for screen readers.
export function Section({ title, children }: SectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {title}
      </h2>
      {children}
    </section>
  );
}
