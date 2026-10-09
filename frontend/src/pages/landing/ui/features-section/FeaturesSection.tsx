import { LANDING_SECTION_ID } from '../../config/navigation';
import { FEATURES } from '../../config/sections';
import { LandingSection } from '../LandingSection';
import { SectionHeading } from '../SectionHeading';
import { ChatCard } from './ChatCard';
import { CodeCard } from './CodeCard';
import { RatingCard } from './RatingCard';
import { RepeatCard } from './RepeatCard';
import { TransportCard } from './TransportCard';

export function FeaturesSection() {
  return (
    <LandingSection id={LANDING_SECTION_ID.FEATURES} tone="surface">
      <div className="flex flex-col gap-8 lg:gap-12">
        <SectionHeading title={FEATURES.TITLE} lead={FEATURES.LEAD} />
        {/* On a desktop: six columns, 4 + 2 in the first row and 2 + 2 + 2 in the second. */}
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-6 lg:gap-6">
          <TransportCard />
          <CodeCard />
          <ChatCard />
          <RepeatCard />
          <RatingCard />
        </div>
      </div>
    </LandingSection>
  );
}
