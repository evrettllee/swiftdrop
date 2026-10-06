import { MAIN_CONTENT_ID } from '../../../shared/constants/dom';
import { SkipLink } from '../../../shared/ui/SkipLink';
import { CalculatorCard } from '../components/CalculatorCard';
import { CtaSection } from '../components/CtaSection';
import { FaqSection } from '../components/FaqSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { HeroSection } from '../components/HeroSection';
import { HowItWorks } from '../components/HowItWorks';
import { LandingFooter } from '../components/LandingFooter';
import { LandingHeader } from '../components/LandingHeader';
import { TrackingSection } from '../components/TrackingSection';
import { LANDING_CONTAINER_CLASS } from '../constants/layout';

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <LandingHeader />
      <main id={MAIN_CONTENT_ID} className="flex-1">
        <div
          className={`${LANDING_CONTAINER_CLASS} flex w-full flex-col gap-12 py-12 lg:gap-24 lg:py-24`}
        >
          <HeroSection />
          <CalculatorCard />
        </div>
        <HowItWorks />
        <TrackingSection />
        <FeaturesSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
