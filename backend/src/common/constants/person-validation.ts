export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

// Letters of any alphabet with diacritics; parts are joined by one space, hyphen or apostrophe.
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '’-]\p{L}[\p{L}\p{M}]*)*$/u;
export const PHONE_REGEX = new RegExp(`^\\+\\d{${PHONE_MIN_DIGITS},${PHONE_MAX_DIGITS}}$`);
export const PHONE_SEPARATORS_REGEX = /[\s\-()]/g;
export const PHONE_SEPARATOR_REPLACEMENT = '';

export const PHONE_INVALID_MESSAGE =
  'Введите телефон в международном формате, например +375291234567';
