import { SkipLink } from '../../../shared/ui/SkipLink';
import { LandingHeader } from '../components/LandingHeader';
import { LANDING_SECTION_ID, LANDING_TEXTS } from '../constants';

export function LandingPage() {
  return (
    <>
      <SkipLink />
      <LandingHeader />
      <main id="main" className="mx-auto max-w-7xl px-4 py-12 lg:px-12 lg:py-24">
        {/* A temporary hero: the calculator and the other sections are added in the next steps. */}
        <h1
          id={LANDING_SECTION_ID.TOP}
          className="mx-auto max-w-4xl text-center text-display-sm font-bold lg:text-display"
        >
          {LANDING_TEXTS.HERO_TITLE}
        </h1>
      </main>
    </>
  );
}
