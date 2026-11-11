import { type KeyboardEvent, useState } from 'react';
import type { CourierLookupItem } from '@/shared/staff-api';
import { ESCAPE_KEY } from '@/shared/config';
import { FILTER_TEXTS } from '../config/texts';
import { SUGGESTIONS_STATUS, useCourierSuggestions } from './useCourierSuggestions';

const KEY = {
  DOWN: 'ArrowDown',
  UP: 'ArrowUp',
  ENTER: 'Enter',
} as const;

export function courierOptionId(listId: string, index: number): string {
  return `${listId}-${index}`;
}

const KEY_ACTION = {
  CLOSE: 'close',
  NEXT: 'next',
  PREVIOUS: 'previous',
  CHOOSE: 'choose',
} as const;

type KeyAction = (typeof KEY_ACTION)[keyof typeof KEY_ACTION];

function keyActionOf(
  key: string,
  isShown: boolean,
  count: number,
  hasActive: boolean,
): KeyAction | null {
  if (key === ESCAPE_KEY && isShown) {
    return KEY_ACTION.CLOSE;
  }

  if (count > 0 && (key === KEY.DOWN || key === KEY.UP)) {
    return key === KEY.DOWN ? KEY_ACTION.NEXT : KEY_ACTION.PREVIOUS;
  }

  return key === KEY.ENTER && isShown && hasActive ? KEY_ACTION.CHOOSE : null;
}

function messageOf(status: string, count: number): string | null {
  if (status === SUGGESTIONS_STATUS.READY && count === 0) {
    return FILTER_TEXTS.COURIER_NOT_FOUND;
  }

  return status === SUGGESTIONS_STATUS.ERROR ? FILTER_TEXTS.COURIER_FAILED : null;
}

export function useCourierCombobox(
  isSelected: boolean,
  onChoose: (item: CourierLookupItem) => void,
) {
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { status, items } = useCourierSuggestions(text);
  const isShown = isOpen && !isSelected && status !== SUGGESTIONS_STATUS.IDLE;

  function choose(item: CourierLookupItem): void {
    onChoose(item);
    setText('');
    setIsOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    const action = keyActionOf(event.key, isShown, items.length, items[active] !== undefined);

    if (action === null) {
      return;
    }

    event.preventDefault();

    if (action === KEY_ACTION.CLOSE) {
      event.stopPropagation();
      setIsOpen(false);
    } else if (action === KEY_ACTION.CHOOSE) {
      choose(items[active]);
    } else {
      setIsOpen(true);
      setActive(
        (index) => (index + (action === KEY_ACTION.NEXT ? 1 : -1) + items.length) % items.length,
      );
    }
  }

  function onType(value: string): void {
    setText(value);
    setActive(0);
    setIsOpen(true);
  }

  return {
    text,
    items,
    active,
    isShown,
    message: isShown ? messageOf(status, items.length) : null,
    choose,
    onType,
    onKeyDown,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}
