import type { ReactNode } from 'react';

type ChatDaySectionProps = {
  label: string;
  children: ReactNode;
};

export function ChatDaySection({ label, children }: ChatDaySectionProps) {
  return (
    <section aria-label={label} className="flex flex-col gap-2">
      <h3 className="self-center text-caption text-fg-secondary">{label}</h3>
      {children}
    </section>
  );
}
