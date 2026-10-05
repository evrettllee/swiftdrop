import { APP_ROUTES } from '../../../shared/constants';
import { LinkButton } from '../../../shared/ui/Button';
import { LANDING_SECTION_ID, LANDING_TEXTS } from '../constants';

export function HeroSection() {
  return (
    <section
      id={LANDING_SECTION_ID.TOP}
      className="flex scroll-mt-20 flex-col items-center gap-6 text-center"
    >
      <h1 className="max-w-220 text-display-sm font-bold lg:text-display">
        {LANDING_TEXTS.HERO_TITLE}
      </h1>
      <p className="max-w-2xl text-body font-normal text-fg-secondary lg:text-heading-sm">
        {LANDING_TEXTS.HERO_LEAD}
      </p>
      {/* In a column the buttons stretch to the full width by themselves. */}
      <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
        {/* Until the order page exists, ordering starts from the sign-in page, as in the footer. */}
        <LinkButton to={APP_ROUTES.AUTH}>{LANDING_TEXTS.ORDER}</LinkButton>
        <LinkButton variant="secondary" href={`#${LANDING_SECTION_ID.HOW_IT_WORKS}`}>
          {LANDING_TEXTS.HOW_IT_WORKS}
        </LinkButton>
      </div>
    </section>
  );
}
