import type { ChangeEvent, ReactNode } from 'react';
import type { AddressSuggestion } from '@/shared/api';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';
import { NO_ACTIVE_INDEX } from './address-field';
import { AddressSuggestions } from './AddressSuggestions';
import { SEARCH_STATUS } from './search-status';
import { useAddressCombobox } from './useAddressCombobox';

type AddressFieldProps = {
  label: string;
  // A small mark before the label, for example the point of a route.
  labelAdornment?: ReactNode;
  value: string;
  placeholder?: string;
  // The user typed: the parent keeps the text.
  onChange: (value: string) => void;
  // The user chose a suggestion: the parent keeps the point and the text.
  onSelect: (suggestion: AddressSuggestion) => void;
  onFocus?: () => void;
  // The address of a point set on the map is being found: the field shows the spinner.
  isLookingUp?: boolean;
  // A mistake of the address, shown under the field instead of the hint.
  error?: string;
};

export function AddressField({
  label,
  labelAdornment,
  value,
  placeholder,
  onChange,
  onSelect,
  onFocus,
  isLookingUp = false,
  error,
}: AddressFieldProps) {
  const combobox = useAddressCombobox(value, onSelect);
  const { status, activeIndex, isOpen, isListShown, isEmptyShown } = combobox;

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(event.target.value);
    combobox.open();
  }

  return (
    <Input
      label={label}
      labelAdornment={labelAdornment}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      role="combobox"
      aria-expanded={isListShown}
      aria-controls={isListShown ? combobox.listboxId : undefined}
      aria-autocomplete="list"
      aria-activedescendant={
        isListShown && activeIndex !== NO_ACTIVE_INDEX
          ? combobox.getOptionId(activeIndex)
          : undefined
      }
      error={error}
      hint={status === SEARCH_STATUS.ERROR ? (combobox.message ?? undefined) : undefined}
      onChange={handleChange}
      onKeyDown={combobox.handleKeyDown}
      onFocus={onFocus}
      onBlur={combobox.close}
      endAdornment={
        <span className="flex items-center pe-3">
          {isLookingUp || (isOpen && status === SEARCH_STATUS.LOADING) ? <Spinner /> : null}
        </span>
      }
      popup={
        isListShown || isEmptyShown ? (
          <AddressSuggestions
            listboxId={combobox.listboxId}
            label={label}
            suggestions={combobox.suggestions}
            activeIndex={activeIndex}
            isListShown={isListShown}
            getOptionId={combobox.getOptionId}
            onSelect={combobox.select}
            onActivate={combobox.setActiveIndex}
          />
        ) : null
      }
    />
  );
}
