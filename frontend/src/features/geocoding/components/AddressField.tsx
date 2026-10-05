import { useId, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { ESCAPE_KEY } from '../../../shared/constants';
import { Input } from '../../../shared/ui/Input';
import { Spinner } from '../../../shared/ui/Spinner';
import {
  ADDRESS_FIELD_KEY,
  ADDRESS_FIELD_TEXTS,
  GEOCODING_MIN_QUERY_LENGTH,
  NO_ACTIVE_INDEX,
  SEARCH_STATUS,
} from '../constants';
import { useAddressSuggestions } from '../lib/useAddressSuggestions';
import type { AddressSuggestion } from '../types';

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

// An address input with a list of suggestions (the combobox pattern of ARIA).
export function AddressField({
  label,
  value,
  placeholder,
  onChange,
  onSelect,
  onFocus,
}: AddressFieldProps) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_INDEX);
  const { status, suggestions, message } = useAddressSuggestions(value, isOpen);

  const isListShown = isOpen && suggestions.length > 0;
  const isEmptyShown =
    isOpen &&
    status === SEARCH_STATUS.READY &&
    suggestions.length === 0 &&
    value.trim().length >= GEOCODING_MIN_QUERY_LENGTH;

  function select(suggestion: AddressSuggestion): void {
    onSelect(suggestion);
    setIsOpen(false);
    setActiveIndex(NO_ACTIVE_INDEX);
  }

  function moveActive(step: number): void {
    if (suggestions.length === 0) {
      return;
    }

    setActiveIndex((current) => {
      if (current === NO_ACTIVE_INDEX) {
        return step > 0 ? 0 : suggestions.length - 1;
      }

      return (current + step + suggestions.length) % suggestions.length;
    });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    onChange(event.target.value);
    setIsOpen(true);
    setActiveIndex(NO_ACTIVE_INDEX);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    switch (event.key) {
      case ADDRESS_FIELD_KEY.ARROW_DOWN:
        event.preventDefault();
        setIsOpen(true);
        moveActive(1);
        break;
      case ADDRESS_FIELD_KEY.ARROW_UP:
        event.preventDefault();
        moveActive(-1);
        break;
      case ADDRESS_FIELD_KEY.ENTER: {
        const chosen = activeIndex === NO_ACTIVE_INDEX ? undefined : suggestions[activeIndex];

        if (isListShown && chosen !== undefined) {
          event.preventDefault();
          select(chosen);
        }
        break;
      }
      case ESCAPE_KEY:
        setIsOpen(false);
        break;
      default:
        break;
    }
  }

  return (
    <Input
      label={label}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      role="combobox"
      aria-expanded={isListShown}
      aria-controls={isListShown ? listboxId : undefined}
      aria-autocomplete="list"
      aria-activedescendant={
        isListShown && activeIndex !== NO_ACTIVE_INDEX ? `${listboxId}-${activeIndex}` : undefined
      }
      hint={status === SEARCH_STATUS.ERROR ? (message ?? undefined) : undefined}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={() => setIsOpen(false)}
      endAdornment={
        <span className="flex items-center pe-3">
          {isOpen && status === SEARCH_STATUS.LOADING ? <Spinner /> : null}
        </span>
      }
      popup={
        isListShown || isEmptyShown ? (
          // The mouse must not take the focus from the field, or the list would close before the click.
          <div
            onMouseDown={(event) => event.preventDefault()}
            className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-auto rounded-md border border-border-elevated bg-surface-elevated py-1 shadow-lg"
          >
            {isListShown ? (
              <ul id={listboxId} role="listbox" aria-label={label}>
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => select(suggestion)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex min-h-11 cursor-pointer flex-col justify-center px-4 py-2 ${
                      index === activeIndex ? 'bg-selected' : ''
                    }`}
                  >
                    <span className="text-body">{suggestion.name}</span>
                    <span className="text-small text-fg-secondary">{suggestion.details}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-3 text-small text-fg-secondary">
                {ADDRESS_FIELD_TEXTS.NO_RESULTS}
              </p>
            )}
          </div>
        ) : null
      }
    />
  );
}
