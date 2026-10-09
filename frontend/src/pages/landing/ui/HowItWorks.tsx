import { LANDING_SECTION_ID } from '../config/navigation';
import { HOW_IT_WORKS } from '../config/sections';
import { LandingSection } from './LandingSection';
import { ResponsiveText } from './ResponsiveText';
import { SectionHeading } from './SectionHeading';

export function HowItWorks() {
  return (
    <LandingSection id={LANDING_SECTION_ID.HOW_IT_WORKS} tone="surface">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-6">
        <div className="lg:col-span-5">
          <SectionHeading
            title={HOW_IT_WORKS.TITLE}
            lead={<ResponsiveText full={HOW_IT_WORKS.LEAD} short={HOW_IT_WORKS.LEAD_SHORT} />}
          />
        </div>
        <ol className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7 lg:gap-8">
          {HOW_IT_WORKS.STEPS.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4">
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-md bg-selected text-heading-sm font-semibold text-accent tabular-nums"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-heading-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-fg-secondary text-pretty">
                  <ResponsiveText full={step.text} short={step.shortText} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </LandingSection>
  );
}
