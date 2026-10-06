import { useId, useState, type KeyboardEvent } from 'react';
import { ESCAPE_KEY } from '../../../shared/constants/dom';
import {
  ADDRESS_FIELD_KEY,
  GEOCODING_MIN_QUERY_LENGTH,
  NO_ACTIVE_INDEX,
  SEARCH_STATUS,
} from '../constants';
import type { AddressSuggestion } from '../types';
import { useAddressSuggestions } from './useAddressSuggestions';

// The state of the combobox pattern of ARIA: whether the list is open, which option is active
// (the focus itself stays in the field) and the keys that move through the list.
export function useAddressCombobox(
  value: string,
  onSelect: (suggestion: AddressSuggestion) => void,
) {
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

  function getOptionId(index: number): string {
    return `${listboxId}-${index}`;
  }

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

  // The user typed: the list opens again and no option is active until an arrow key is pressed.
  function open(): void {
    setIsOpen(true);
    setActiveIndex(NO_ACTIVE_INDEX);
  }

  function close(): void {
    setIsOpen(false);
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

  return {
    listboxId,
    getOptionId,
    status,
    suggestions,
    message,
    isOpen,
    isListShown,
    isEmptyShown,
    activeIndex,
    setActiveIndex,
    select,
    open,
    close,
    handleKeyDown,
  };
}
