import { type KeyboardEvent, useId, useState } from 'react';
import { type AddressSuggestion, GEOCODING_MIN_QUERY_LENGTH } from '@/shared/api';
import { ESCAPE_KEY } from '@/shared/config';
import { ACTIVE_STEP, ADDRESS_FIELD_KEY, NO_ACTIVE_INDEX } from './address-field';
import { SEARCH_STATUS } from './search-status';
import { useAddressSuggestions } from './useAddressSuggestions';

// Whether the list is open and which option is active (the focus itself stays in the field).
function usePopupState() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_INDEX);

  // Moves through `count` options in a circle; the first step goes to the first or the last one.
  function moveActive(step: number, count: number): void {
    if (count > 0) {
      setActiveIndex((current) =>
        current === NO_ACTIVE_INDEX
          ? (step > 0 ? 0 : count - 1)
          : (current + step + count) % count,
      );
    }
  }

  // The user typed: the list opens again and no option is active until an arrow key is pressed.
  function open(): void {
    setIsOpen(true);
    setActiveIndex(NO_ACTIVE_INDEX);
  }

  function reset(): void {
    setIsOpen(false);
    setActiveIndex(NO_ACTIVE_INDEX);
  }

  return { isOpen, setIsOpen, activeIndex, setActiveIndex, moveActive, open, reset };
}

type KeyHandlerContext = {
  popup: ReturnType<typeof usePopupState>;
  suggestions: AddressSuggestion[];
  isListShown: boolean;
  select: (suggestion: AddressSuggestion) => void;
};

// The keys of the combobox: the arrows move through the list, Enter chooses, Escape closes.
function createKeyHandler({ popup, suggestions, isListShown, select }: KeyHandlerContext) {
  return (event: KeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case ADDRESS_FIELD_KEY.ARROW_DOWN:
        event.preventDefault();
        popup.setIsOpen(true);
        popup.moveActive(ACTIVE_STEP.NEXT, suggestions.length);
        break;
      case ADDRESS_FIELD_KEY.ARROW_UP:
        event.preventDefault();
        popup.moveActive(ACTIVE_STEP.PREVIOUS, suggestions.length);
        break;
      case ADDRESS_FIELD_KEY.ENTER: {
        const chosen =
          popup.activeIndex === NO_ACTIVE_INDEX ? undefined : suggestions[popup.activeIndex];

        if (isListShown && chosen !== undefined) {
          event.preventDefault();
          select(chosen);
        }
        break;
      }
      case ESCAPE_KEY:
        popup.setIsOpen(false);
        break;
      default:
        break;
    }
  };
}

// The state of the combobox pattern of ARIA and the keys that move through the list.
export function useAddressCombobox(
  value: string,
  onSelect: (suggestion: AddressSuggestion) => void,
) {
  const listboxId = useId();
  const popup = usePopupState();
  const { isOpen, activeIndex } = popup;
  const { status, suggestions, message } = useAddressSuggestions(value, isOpen);

  const isListShown = isOpen && suggestions.length > 0;
  const isEmptyShown =
    isOpen &&
    status === SEARCH_STATUS.READY &&
    suggestions.length === 0 &&
    value.trim().length >= GEOCODING_MIN_QUERY_LENGTH;

  function select(suggestion: AddressSuggestion): void {
    onSelect(suggestion);
    popup.reset();
  }

  const handleKeyDown = createKeyHandler({ popup, suggestions, isListShown, select });

  return {
    listboxId,
    getOptionId: (index: number): string => `${listboxId}-${index}`,
    status,
    suggestions,
    message,
    isOpen,
    isListShown,
    isEmptyShown,
    activeIndex,
    setActiveIndex: popup.setActiveIndex,
    select,
    open: popup.open,
    close: () => popup.setIsOpen(false),
    handleKeyDown,
  };
}
