// Name and phone limits: must match backend/src/common/constants/person-validation.constants.ts
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

// Letters of any alphabet with diacritics; parts are joined by one space, hyphen or apostrophe.
// Same rule as NAME_PATTERN in backend/src/common/constants/person-validation.constants.ts: change both together.
export const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '’-]\p{L}[\p{L}\p{M}]*)*$/u;
export const PHONE_REGEX = new RegExp(`^\\+\\d{${PHONE_MIN_DIGITS},${PHONE_MAX_DIGITS}}$`);
export const PHONE_SEPARATORS_REGEX = /[\s\-()]/g;
export const PHONE_SEPARATOR_REPLACEMENT = '';

export const PHONE_EXAMPLE = '+375 29 123-45-67';
