// A Belarusian number "+375291234567" is shown as "+375 29 123-45-67"; other numbers stay as they are.
const BY_PHONE_PATTERN = /^\+375(\d{2})(\d{3})(\d{2})(\d{2})$/;
const BY_PHONE_FORMAT = '+375 $1 $2-$3-$4';

// For example "+375 29 123-45-67"
export function formatPhone(phone: string): string {
  return phone.replace(BY_PHONE_PATTERN, BY_PHONE_FORMAT);
}

const TEL_SCHEME = 'tel:';
const NOT_PHONE_CHARS = /[^+\d]/g;

export function buildTelHref(phone: string): string | null {
  const digits = phone.replace(NOT_PHONE_CHARS, '');

  return digits.replace('+', '') === '' ? null : `${TEL_SCHEME}${digits}`;
}
