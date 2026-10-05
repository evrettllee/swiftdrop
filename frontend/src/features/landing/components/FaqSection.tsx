import { useState } from 'react';
import { FAQ, LANDING_SECTION_ID } from '../constants';
import { FaqItem } from './FaqItem';
import { LandingSection } from './LandingSection';

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ.ITEMS[FAQ.OPEN_BY_DEFAULT_INDEX].id);

  return (
    <LandingSection id={LANDING_SECTION_ID.FAQ}>
      <div className="flex flex-col items-center gap-6 lg:gap-12">
        <h2 className="text-center text-heading-lg font-bold text-fg">{FAQ.TITLE}</h2>
        <div className="w-full max-w-190">
          {FAQ.ITEMS.map((item) => (
            <FaqItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
