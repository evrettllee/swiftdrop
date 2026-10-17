import { type ClipboardEvent, type Ref, useId } from 'react';
import { COLOR_TRANSITION_CLASS, ID_PART } from '@/shared/config';
import { joinClassNames } from '@/shared/lib/class-names';
import { FieldError } from '@/shared/ui/field-error';
import { DELIVERY_CODE_LENGTH } from '../config/delivery-code';
import { DELIVERY_CODE_TEXTS } from '../config/texts';
import { pasteIntoDeliveryCode, toDeliveryCode } from '../lib/delivery-code';

const CELLS = Array.from({ length: DELIVERY_CODE_LENGTH }, (_, index) => index);

const CELL_CLASS = `grid h-14 place-items-center rounded-sm border bg-surface text-heading-md font-semibold tabular-nums shadow-sm ${COLOR_TRANSITION_CLASS}`;

type DeliveryCodeFieldProps = {
  code: string;
  error: string | null;
  isWrong: boolean;
  isPending: boolean;
  // The text under the title that tells where the code comes from.
  hintId: string;
  inputRef: Ref<HTMLInputElement>;
  onChange: (code: string) => void;
};

function getCellBorder(index: number, code: string, isWrong: boolean): string {
  if (isWrong) {
    return 'border-danger';
  }

  // The cell of the next digit; the last one once the code is full.
  const isActive = index === Math.min(code.length, DELIVERY_CODE_LENGTH - 1);

  return isActive ? 'border-border peer-focus:border-accent' : 'border-border';
}

// One field for the whole code, so screen readers, autofill and paste see one value; the cells are
// only its picture. The field lies unseen over them and takes the taps.
export function DeliveryCodeField(props: DeliveryCodeFieldProps) {
  const { code, error, isWrong, isPending, hintId, inputRef, onChange } = props;
  const id = useId();
  const errorId = `${id}-${ID_PART.ERROR}`;

  function handlePaste(event: ClipboardEvent<HTMLInputElement>): void {
    const field = event.currentTarget;
    event.preventDefault();
    onChange(
      pasteIntoDeliveryCode(
        field.value,
        event.clipboardData.getData('text'),
        field.selectionStart ?? field.value.length,
        field.selectionEnd ?? field.value.length,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-semibold">
        {DELIVERY_CODE_TEXTS.LABEL}
      </label>
      <div className="relative grid auto-cols-fr grid-flow-col gap-2">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={DELIVERY_CODE_LENGTH}
          value={code}
          readOnly={isPending}
          aria-invalid={isWrong}
          aria-describedby={error === null ? hintId : errorId}
          className="peer absolute inset-0 size-full text-body opacity-0"
          onChange={(event) => onChange(toDeliveryCode(event.target.value))}
          onPaste={handlePaste}
        />
        {CELLS.map((index) => (
          <span
            key={index}
            aria-hidden="true"
            className={joinClassNames(CELL_CLASS, getCellBorder(index, code, isWrong))}
          >
            {code[index]}
          </span>
        ))}
      </div>
      {error === null ? null : (
        <div role="alert">
          <FieldError id={errorId}>{error}</FieldError>
        </div>
      )}
    </div>
  );
}
