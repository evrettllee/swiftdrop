import { SkipLink } from '../../../shared/ui/SkipLink';
import { CalculatorCard } from '../components/CalculatorCard';
import { HeroSection } from '../components/HeroSection';
import { LandingFooter } from '../components/LandingFooter';
import { LandingHeader } from '../components/LandingHeader';

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <LandingHeader />
      {/* 96px between the sections on a desktop, as in the design system. */}
      <main
        id="main"
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-12 lg:gap-24 lg:px-12 lg:py-24"
      >
        <HeroSection />
        <CalculatorCard />
      </main>
      <LandingFooter />
    </div>
  );
}
