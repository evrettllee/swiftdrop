import type { ReactNode } from 'react';

type SectionHeadingProps = {
  title: string;
  lead: ReactNode;
};

export function SectionHeading({ title, lead }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-heading-lg font-bold text-balance">{title}</h2>
      <p className="max-w-140 text-body font-normal text-fg-secondary text-pretty lg:text-heading-sm">
        {lead}
      </p>
    </div>
  );
}
