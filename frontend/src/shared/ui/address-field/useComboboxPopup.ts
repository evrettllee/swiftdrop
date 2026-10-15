import { useState } from 'react';
import { NO_ACTIVE_INDEX } from './address-field';

// Whether the list of the combobox is open and which option is active (the focus itself stays in
// the field).
export function useComboboxPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE_INDEX);

  // The user typed: the list opens again and no option is active until an arrow key is pressed.
  function open(): void {
    setIsOpen(true);
    setActiveIndex(NO_ACTIVE_INDEX);
  }

  // An arrow key shows the list and keeps the active option.
  function show(): void {
    setIsOpen(true);
  }

  function close(): void {
    setIsOpen(false);
  }

  // An option was chosen: the list closes and starts without an active option next time.
  function reset(): void {
    setIsOpen(false);
    setActiveIndex(NO_ACTIVE_INDEX);
  }

  // Moves through `count` options in a circle; the first step goes to the first or the last one.
  function moveActive(step: number, count: number): void {
    if (count === 0) {
      return;
    }

    setActiveIndex((current) => {
      if (current === NO_ACTIVE_INDEX) {
        return step > 0 ? 0 : count - 1;
      }

      return (current + step + count) % count;
    });
  }

  return { isOpen, activeIndex, setActiveIndex, open, show, close, reset, moveActive };
}
