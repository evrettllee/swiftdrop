import { SkipLink } from '../../../shared/ui/SkipLink';
import { CalculatorCard } from '../components/CalculatorCard';
import { HeroSection } from '../components/HeroSection';
import { HowItWorks } from '../components/HowItWorks';
import { LandingFooter } from '../components/LandingFooter';
import { LandingHeader } from '../components/LandingHeader';
import { TrackingSection } from '../components/TrackingSection';

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <LandingHeader />
      <main id="main" className="flex-1">
        {/* The first screen has the width of the page grid; the next sections are bands. */}
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 lg:gap-24 lg:px-12 lg:py-24">
          <HeroSection />
          <CalculatorCard />
        </div>
        <HowItWorks />
        <TrackingSection />
      </main>
      <LandingFooter />
    </div>
  );
}
