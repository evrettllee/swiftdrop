// A Belarusian number "+375291234567" is shown as "+375 29 123-45-67"; other numbers stay as they are.
export const BY_PHONE_PATTERN = /^\+375(\d{2})(\d{3})(\d{2})(\d{2})$/;
export const BY_PHONE_FORMAT = '+375 $1 $2-$3-$4';
