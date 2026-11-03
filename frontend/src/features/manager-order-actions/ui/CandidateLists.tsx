import { useId } from 'react';
import type { CourierCandidates } from '@/shared/staff-api';
import { ASSIGN_TEXTS } from '../config/texts';
import { candidateLine } from '../lib/candidates';
import { CandidateCard } from './CandidateCard';
import { UnsuitableSection } from './UnsuitableSection';

type CandidateListsProps = {
  candidates: CourierCandidates;
  selectedId: number | null;
  currentCourierId: number | null;
  isDesktop: boolean;
  onSelect: (courierId: number) => void;
};

export function CandidateLists({
  candidates,
  selectedId,
  currentCourierId,
  isDesktop,
  onSelect,
}: CandidateListsProps) {
  const name = useId();
  const { suitable, unsuitable } = candidates;

  return (
    <>
      {suitable.length === 0 ? null : (
        <div
          role="radiogroup"
          aria-label={ASSIGN_TEXTS.COURIERS_LABEL}
          className="flex flex-col gap-2"
        >
          {suitable.map((candidate) => {
            const isCurrent = candidate.courierId === currentCourierId;

            return (
              <CandidateCard
                key={candidate.courierId}
                candidate={candidate}
                name={name}
                line={isCurrent ? ASSIGN_TEXTS.CURRENT : candidateLine(candidate)}
                isChecked={selectedId === candidate.courierId}
                isDisabled={isCurrent}
                hasIcon={isDesktop}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      )}
      {unsuitable.length === 0 ? null : (
        <UnsuitableSection candidates={unsuitable} isDesktop={isDesktop} />
      )}
    </>
  );
}
