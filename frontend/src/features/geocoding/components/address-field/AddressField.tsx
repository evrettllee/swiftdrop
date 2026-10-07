import type { ChangeEvent } from 'react';
import { Input } from '../../../../shared/ui/Input';
import { Spinner } from '../../../../shared/ui/Spinner';
import { NO_ACTIVE_INDEX } from '../../constants/address-field';
import { SEARCH_STATUS } from '../../constants/search';
import { useAddressCombobox } from './useAddressCombobox';
import type { AddressSuggestion } from '../../schemas';
import { AddressSuggestions } from './AddressSuggestions';

type AddressFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  // The user typed: the parent keeps the text.
  onChange: (value: string) => void;
  // The user chose a suggestion: the parent keeps the point and the text.
  onSelect: (suggestion: AddressSuggestion) => void;
  onFocus?: () => void;
};

export function AddressField({
  label,
  value,
  placeholder,
  onChange,
  onSelect,
  onFocus,
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
      hint={status === SEARCH_STATUS.ERROR ? (combobox.message ?? undefined) : undefined}
      onChange={handleChange}
      onKeyDown={combobox.handleKeyDown}
      onFocus={onFocus}
      onBlur={combobox.close}
      endAdornment={
        <span className="flex items-center pe-3">
          {isOpen && status === SEARCH_STATUS.LOADING ? <Spinner /> : null}
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
