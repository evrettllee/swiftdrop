import { CheckCircleIcon, CircleIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants/styles';
import { AUTH_TEXTS } from '../constants/texts';
import { PASSWORD_RULES, STRENGTH_LABELS } from '../constants/validation';

type PasswordRequirementsProps = {
  value: string;
};

// Indexed by the number of met rules (0 to 4), like STRENGTH_LABELS.
const SEGMENT_TONES = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-accent', 'bg-success'] as const;
const LABEL_TONES = [
  'text-danger',
  'text-danger',
  'text-warning',
  'text-accent',
  'text-success',
] as const;

export function PasswordRequirements({ value }: PasswordRequirementsProps) {
  const titleId = useId();
  const metCount = PASSWORD_RULES.filter((rule) => rule.isMet(value)).length;
  // Once something is typed, at least the first segment is filled.
  const filledCount = Math.max(metCount, 1);
  const strengthLabel = STRENGTH_LABELS[metCount];

  return (
    <div>
      <p id={titleId} className="text-small text-fg-secondary">
        {AUTH_TEXTS.PASSWORD_REQUIREMENTS}
      </p>
      <ul aria-labelledby={titleId} className="mt-2 flex flex-col gap-2">
        {PASSWORD_RULES.map((rule) => {
          const isMet = rule.isMet(value);
          const RuleIcon = isMet ? CheckCircleIcon : CircleIcon;

          return (
            <li key={rule.id} className="flex items-center gap-2 text-small">
              <RuleIcon
                size={ICON_SIZE.SMALL}
                weight={ICON_WEIGHT}
                aria-hidden="true"
                className={isMet ? 'text-success' : 'text-fg-muted'}
              />
              <span className={isMet ? 'text-fg' : 'text-fg-secondary'}>{rule.label}</span>
              <span className="sr-only">
                : {isMet ? AUTH_TEXTS.RULE_MET : AUTH_TEXTS.RULE_NOT_MET}
              </span>
            </li>
          );
        })}
      </ul>
      {value === '' ? null : (
        <div className="mt-3 flex items-center gap-3">
          <div
            role="img"
            aria-label={`${AUTH_TEXTS.STRENGTH}: ${strengthLabel}`}
            className="flex flex-1 gap-1"
          >
            {PASSWORD_RULES.map((rule, index) => (
              <span
                key={rule.id}
                className={`h-1 flex-1 rounded-full ${index < filledCount ? SEGMENT_TONES[metCount] : 'bg-border'}`}
              />
            ))}
          </div>
          <span
            aria-live="polite"
            className={`min-w-18 text-end text-small font-semibold ${LABEL_TONES[metCount]}`}
          >
            {strengthLabel}
          </span>
        </div>
      )}
    </div>
  );
}
