import { Link } from 'react-router';
import { LANDING_SIGN_UP_ROUTE, CTA_TEXTS } from '../constants';

export function CtaSection() {
  return (
    <section className="border-t border-border bg-surface py-12 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 lg:px-12">
        <div className="flex flex-col items-center gap-4 rounded-xl bg-primary px-6 py-8 text-center text-on-primary lg:gap-6 lg:p-12">
          <h2 className="max-w-160 text-heading-lg font-bold">{CTA_TEXTS.TITLE}</h2>
          <p className="max-w-140 text-body lg:text-heading-sm">
            {CTA_TEXTS.LEAD}
            <span className="hidden lg:inline"> {CTA_TEXTS.LEAD_EXTRA}</span>
          </p>
          <Link
            to={LANDING_SIGN_UP_ROUTE}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-inverse px-4 py-2.5 text-body font-semibold text-on-inverse transition-opacity hover:opacity-90 motion-reduce:transition-none lg:w-auto"
          >
            {CTA_TEXTS.BUTTON}
          </Link>
        </div>
      </div>
    </section>
  );
}
