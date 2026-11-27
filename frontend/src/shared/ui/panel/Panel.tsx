import { type ReactNode, useId } from 'react';

const PANEL_CLASS =
  'flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border';

const PLAIN_ON_PHONE_CLASS =
  'max-lg:gap-3 max-lg:rounded-none max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none max-lg:dark:border-0';

type PanelProps = {
  title: string;
  description?: string;
  aside?: ReactNode;
  isPlainOnPhone?: boolean;
  className?: string;
  children: ReactNode;
};

export function Panel({
  title,
  description,
  aside,
  isPlainOnPhone = false,
  className = '',
  children,
}: PanelProps) {
  const headingId = useId();
  const titleBlock = (
    <div className="flex flex-col gap-1">
      <h2 id={headingId} className="text-heading-sm font-semibold text-balance">
        {title}
      </h2>
      {description === undefined ? null : (
        <span className="text-caption text-fg-secondary">{description}</span>
      )}
    </div>
  );

  return (
    <section
      aria-labelledby={headingId}
      className={`${PANEL_CLASS} ${isPlainOnPhone ? PLAIN_ON_PHONE_CLASS : ''} ${className}`}
    >
      {aside === undefined ? (
        titleBlock
      ) : (
        <div className="flex flex-col gap-1 lg:flex-row lg:items-baseline lg:justify-between lg:gap-4">
          {titleBlock}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
