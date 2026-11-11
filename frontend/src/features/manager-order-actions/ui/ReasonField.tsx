import { ACTION_REASON_MAX_LENGTH } from '@/shared/staff-api';
import { TextArea } from '@/shared/ui/textarea';
import { ASSIGN_TEXTS, counterLabel } from '../config/texts';

type ReasonFieldProps = {
  value: string;
  hint: string;
  error?: string;
  isRequired?: boolean;
  onChange: (value: string) => void;
};

export function ReasonField({
  value,
  hint,
  error,
  isRequired = false,
  onChange,
}: ReasonFieldProps) {
  return (
    <TextArea
      label={ASSIGN_TEXTS.REASON}
      value={value}
      maxLength={ACTION_REASON_MAX_LENGTH}
      hint={hint}
      error={error}
      required={isRequired}
      counterLabel={counterLabel}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
