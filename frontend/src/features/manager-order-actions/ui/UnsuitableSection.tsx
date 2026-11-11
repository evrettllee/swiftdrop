import { CaretDownIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import type { UnsuitableCandidate } from '@/shared/staff-api';
import { Button } from '@/shared/ui/button';
import { ASSIGN_TEXTS } from '../config/texts';
import { unsuitableLine } from '../lib/candidates';
import { CandidateCard } from './CandidateCard';

type UnsuitableSectionProps = {
  candidates: readonly UnsuitableCandidate[];
  isDesktop: boolean;
};

function noop(): void {}

export function UnsuitableSection({ candidates, isDesktop }: UnsuitableSectionProps) {
  const headingId = useId();
  const name = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      {isDesktop ? (
        <h3
          id={headingId}
          className="text-caption font-semibold tracking-caps text-fg-secondary uppercase"
        >
          {ASSIGN_TEXTS.UNSUITABLE}
        </h3>
      ) : (
        <h3 id={headingId} className="-ms-4 self-start">
          <Button
            variant="text"
            aria-expanded={isOpen}
            icon={
              <CaretDownIcon
                size={ICON_SIZE.MEDIUM}
                weight={ICON_WEIGHT}
                aria-hidden="true"
                className={isOpen ? 'rotate-180' : ''}
              />
            }
            onClick={() => setIsOpen((current) => !current)}
          >
            {ASSIGN_TEXTS.unsuitableToggle(candidates.length)}
          </Button>
        </h3>
      )}
      {isDesktop || isOpen ? (
        <div className="flex flex-col gap-2">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.courierId}
              candidate={candidate}
              name={name}
              line={unsuitableLine(candidate)}
              isChecked={false}
              isDisabled
              hasIcon={isDesktop}
              onSelect={noop}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
