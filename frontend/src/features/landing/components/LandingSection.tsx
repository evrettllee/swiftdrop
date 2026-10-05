import type { ReactNode } from 'react';

type LandingSectionProps = {
  id: string;
  // `surface` is a full-width band with borders, `page` has no background of its own. `surface-top`
  // has only the top border: the last band sits on the footer, which already has its own border.
  tone?: 'page' | 'surface' | 'surface-top';
  children: ReactNode;
};

// The scroll offset is the height of the sticky header, so a band stops right under it.
const BASE_CLASS = 'scroll-mt-14 lg:scroll-mt-16';
const TONE_CLASS = {
  page: '',
  surface: 'border-y border-border bg-surface',
  'surface-top': 'border-t border-border bg-surface',
} as const;

// A section of the landing: the band spans the page, its content has the width of the page grid
// and 96px above and below.
export function LandingSection({ id, tone = 'page', children }: LandingSectionProps) {
  return (
    <section id={id} className={`${BASE_CLASS} ${TONE_CLASS[tone]}`}>
      <div className="mx-auto w-full max-w-7xl px-4 py-24 lg:px-12">{children}</div>
    </section>
  );
}
