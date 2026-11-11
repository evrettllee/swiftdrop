export const LIST_FIRST_PAGE = 1;
export const LIST_LIMIT_MIN = 1;
export const LIST_LIMIT_MAX = 100;
export const LIST_OFFSET_MAX = 10_000;

export const LIST_CURSOR_MAX_LENGTH = 512;
export const LIST_CURSOR_FIRST_PAGE = '';
export const LIST_CSV_SEPARATOR = ',';
export const LIST_CSV_MAX_VALUES = 20;
export const LIST_SORT_SEPARATOR = ':';

export const LIST_SEARCH_MIN_LENGTH = 1;
export const LIST_SEARCH_MAX_LENGTH = 100;
export const NUL_CHARACTER = '\u0000';

export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const SORT_DIRECTION_VALUES = [SORT_DIRECTION.ASC, SORT_DIRECTION.DESC] as const;

export const SORT_VALUE_KIND = {
  TIMESTAMP: 'timestamp',
  DECIMAL: 'decimal',
  INTEGER: 'integer',
} as const;

export const SORT_VALUE_PATTERNS = {
  timestamp: /^-?\d{1,17}$/,
  decimal: /^-?\d{1,20}(\.\d{1,10})?$/,
  integer: /^-?\d{1,10}$/,
} as const;

export const LIST_VALIDATION_MESSAGES = {
  PAGE_INVALID: 'Некорректный номер страницы',
  LIMIT_INVALID: `Размер страницы: от ${LIST_LIMIT_MIN} до ${LIST_LIMIT_MAX}`,
  TOO_DEEP: `Слишком далёкая страница: не больше ${LIST_OFFSET_MAX} записей от начала`,
  UNTIL_INVALID: 'Некорректная граница списка',
  CURSOR_INVALID: 'Некорректный курсор',
  CURSOR_SORT_MISMATCH: 'Курсор получен для другой сортировки',
  PAGE_AND_CURSOR: 'Укажите либо номер страницы, либо курсор',
  CURSOR_AND_UNTIL: 'Граница списка задаётся только в режиме страниц',
  SORT_INVALID: 'Неизвестная сортировка',
  FILTER_VALUE_INVALID: 'Неизвестное значение фильтра',
  DATE_INVALID: 'Дата должна быть в формате ГГГГ-ММ-ДД',
  PERIOD_INVALID: 'Начало периода позже его конца',
  SEARCH_INVALID: `Поиск: от ${LIST_SEARCH_MIN_LENGTH} до ${LIST_SEARCH_MAX_LENGTH} символов`,
  SEARCH_FORBIDDEN_CHARACTER: 'Поиск содержит недопустимый символ',
  UNKNOWN_PARAMETER: 'Неизвестный параметр',
} as const;
