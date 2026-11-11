import type { ReactNode } from 'react';

type DrawPageLayoutProps = {
  header: ReactNode;
  toolbar: ReactNode;
  alert: ReactNode;
  map: ReactNode;
  panel: ReactNode;
};

export function DrawPageLayout({ header, toolbar, alert, map, panel }: DrawPageLayoutProps) {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {header}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="lg:hidden">{toolbar}</div>
          {alert}
          {map}
        </div>
        <section className="flex flex-col gap-4 lg:w-100 lg:shrink-0 lg:rounded-lg lg:bg-surface lg:p-6 lg:shadow-md lg:dark:border lg:dark:border-border">
          {panel}
        </section>
      </div>
    </div>
  );
}
