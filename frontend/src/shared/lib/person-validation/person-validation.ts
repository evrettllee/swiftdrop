// Name and phone limits: must match backend/src/common/constants/person-validation.constants.ts
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

// The longest phone a field takes as typed: the plus and a separator after every digit, as in
// "+375 (29) 123-45-67". The format itself is checked by the schema.
const PHONE_PLUS = '+';
const PHONE_CHARS_PER_DIGIT = 2;
export const PHONE_INPUT_MAX_LENGTH = PHONE_PLUS.length + PHONE_MAX_DIGITS * PHONE_CHARS_PER_DIGIT;

// The first and the last name of a profile joined into one, as the recipient of an order starts.
export const FULL_NAME_SEPARATOR = ' ';
export const FULL_NAME_MAX_LENGTH = NAME_MAX_LENGTH + FULL_NAME_SEPARATOR.length + NAME_MAX_LENGTH;

// Letters of any alphabet with diacritics; parts are joined by one space, hyphen or apostrophe.
// Same rule as NAME_PATTERN in backend/src/common/constants/person-validation.constants.ts: change both together.
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '’-]\p{L}[\p{L}\p{M}]*)*$/u;
export const PHONE_REGEX = new RegExp(`^\\+\\d{${PHONE_MIN_DIGITS},${PHONE_MAX_DIGITS}}$`);
export const PHONE_SEPARATORS_REGEX = /[\s\-()]/g;
export const PHONE_SEPARATOR_REPLACEMENT = '';

export const PHONE_EXAMPLE = '+375 29 123-45-67';
