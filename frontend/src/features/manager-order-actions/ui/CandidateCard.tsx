import { VEHICLE_TYPE_META } from '@/entities/courier';
import type { CourierCandidate } from '@/shared/staff-api';
import { RadioCard } from '@/shared/ui/radio-card';
import { ASSIGN_TEXTS } from '../config/texts';
import { distanceText } from '../lib/candidates';

type CandidateCardProps = {
  candidate: CourierCandidate;
  line: string;
  name: string;
  isChecked: boolean;
  isDisabled: boolean;
  hasIcon: boolean;
  onSelect: (courierId: number) => void;
};

export function CandidateCard({
  candidate,
  line,
  name,
  isChecked,
  isDisabled,
  hasIcon,
  onSelect,
}: CandidateCardProps) {
  const icon =
    hasIcon && candidate.vehicleType !== null
      ? VEHICLE_TYPE_META[candidate.vehicleType].icon
      : undefined;

  return (
    <RadioCard
      name={name}
      value={candidate.courierId}
      checked={isChecked}
      disabled={isDisabled}
      isTruncated
      icon={icon}
      title={candidate.name}
      description={line}
      onChange={() => onSelect(candidate.courierId)}
      aside={
        <span className="flex flex-col items-end">
          <span className="text-body">{distanceText(candidate)}</span>
          <span className="text-caption font-normal text-fg-secondary">{ASSIGN_TEXTS.PICKUP}</span>
        </span>
      }
    />
  );
}
