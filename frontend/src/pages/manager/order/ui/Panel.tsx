import { type ReactNode, useId } from 'react';

const PANEL_CLASS =
  'flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border';

const PLAIN_ON_PHONE_CLASS =
  'max-lg:gap-3 max-lg:rounded-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none max-lg:dark:border-0';

type PanelProps = {
  title: string;
  isPlainOnPhone?: boolean;
  className?: string;
  children: ReactNode;
};

export function Panel({ title, isPlainOnPhone = false, className = '', children }: PanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={`${PANEL_CLASS} ${isPlainOnPhone ? PLAIN_ON_PHONE_CLASS : ''} ${className}`}
    >
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {title}
      </h2>
      {children}
    </section>
  );
}
