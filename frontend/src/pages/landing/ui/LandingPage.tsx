import { MAIN_CONTENT_ID } from '@/shared/config';
import { SkipLink } from '@/shared/ui/skip-link';
import { LANDING_CONTAINER_CLASS } from '../config/layout';
import { CalculatorCard } from './calculator-card/CalculatorCard';
import { CtaSection } from './CtaSection';
import { FaqSection } from './FaqSection';
import { FeaturesSection } from './features-section/FeaturesSection';
import { HeroSection } from './HeroSection';
import { HowItWorks } from './HowItWorks';
import { LandingHeader } from './landing-header/LandingHeader';
import { LandingFooter } from './LandingFooter';
import { TrackingSection } from './TrackingSection';

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
