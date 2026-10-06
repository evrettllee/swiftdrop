import type { ReactNode } from 'react';
import { LANDING_CONTAINER_CLASS, LANDING_SCROLL_OFFSET_CLASS } from '../constants';

type LandingSectionProps = {
  id: string;
  // `surface` is a full-width band with borders, `page` has no background of its own. `surface-top`
  // has only the top border: the last band sits on the footer, which already has its own border.
  tone?: 'page' | 'surface' | 'surface-top';
  children: ReactNode;
};

const TONE_CLASS = {
  page: '',
  surface: 'border-y border-border bg-surface',
  'surface-top': 'border-t border-border bg-surface',
} as const;

// A section of the landing: the band spans the page, its content has the width of the page grid
// and 96px above and below.
export function LandingSection({ id, tone = 'page', children }: LandingSectionProps) {
  return (
    <section id={id} className={`${LANDING_SCROLL_OFFSET_CLASS} ${TONE_CLASS[tone]}`}>
      <div className={`${LANDING_CONTAINER_CLASS} w-full py-24`}>{children}</div>
    </section>
  );
}
