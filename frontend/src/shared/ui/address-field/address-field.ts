export const ADDRESS_FIELD_KEY = {
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ENTER: 'Enter',
} as const;

export const NO_ACTIVE_INDEX = -1;

// How far an arrow key moves the active option.
export const ACTIVE_STEP = {
  NEXT: 1,
  PREVIOUS: -1,
} as const;

export const ADDRESS_FIELD_TEXTS = {
  NO_RESULTS: 'Ничего не найдено. Уточните адрес или отметьте точку на карте',
} as const;
