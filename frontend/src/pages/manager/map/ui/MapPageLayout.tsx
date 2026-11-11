import type { ReactNode } from 'react';
import { MANAGER_MAP_TEXTS as TEXTS } from '../config/texts';

const PANEL_CLASS = 'rounded-lg bg-surface shadow-md dark:border dark:border-border';

type MapPageLayoutProps = {
  isDesktop: boolean;
  toolbar: ReactNode;
  failure: ReactNode;
  map: ReactNode;
  card: { label: string; content: ReactNode } | null;
  list: ReactNode;
};

export function MapPageLayout({
  isDesktop,
  toolbar,
  failure,
  map,
  card,
  list,
}: MapPageLayoutProps) {
  if (isDesktop) {
    return (
      <div className="grid h-[calc(100dvh-11.75rem)] min-h-120 grid-cols-[22.5rem_minmax(0,1fr)] gap-6">
        <section aria-label={TEXTS.PANEL_LABEL} className={`flex min-h-0 flex-col ${PANEL_CLASS}`}>
          <div className="flex flex-col gap-3 border-b border-border p-4">
            {toolbar}
            {failure}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">{list}</div>
        </section>
        {map}
      </div>
    );
  }

  return (
    <>
      {toolbar}
      {failure}
      {map}
      {card === null ? null : (
        <section aria-label={card.label} className={`p-4 ${PANEL_CLASS}`}>
          {card.content}
        </section>
      )}
      <section aria-label={TEXTS.PANEL_LABEL} className={`p-6 ${PANEL_CLASS}`}>
        {list}
      </section>
    </>
  );
}
