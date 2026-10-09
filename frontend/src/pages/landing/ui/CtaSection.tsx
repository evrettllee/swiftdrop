import { LinkButton } from '@/shared/ui/button';
import { LANDING_SECTION_ID, LANDING_SIGN_UP_ROUTE } from '../config/navigation';
import { CTA_TEXTS } from '../config/sections';
import { LandingSection } from './LandingSection';

export function CtaSection() {
  return (
    <LandingSection id={LANDING_SECTION_ID.CTA} tone="surface-top">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-primary px-6 py-8 text-center text-on-primary lg:gap-6 lg:p-12">
        <h2 className="max-w-160 text-heading-lg font-bold text-balance">{CTA_TEXTS.TITLE}</h2>
        <p className="max-w-140 text-body text-pretty lg:text-heading-sm">
          {CTA_TEXTS.LEAD}
          <span className="hidden lg:inline"> {CTA_TEXTS.LEAD_EXTRA}</span>
        </p>
        {/* A phone shows the button on the full width, a desktop shows it as wide as its label. */}
        <div className="w-full lg:w-auto">
          <LinkButton variant="inverse" to={LANDING_SIGN_UP_ROUTE} fullWidth>
            {CTA_TEXTS.BUTTON}
          </LinkButton>
        </div>
      </div>
    </LandingSection>
  );
}
