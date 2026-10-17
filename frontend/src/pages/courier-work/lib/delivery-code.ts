import { DELIVERY_CODE_LENGTH } from '../config/delivery-code';

const NON_DIGITS = /\D/g;

// Only the digits of the text, no more than the code holds.
export function toDeliveryCode(text: string): string {
  return text.replace(NON_DIGITS, '').slice(0, DELIVERY_CODE_LENGTH);
}

// The code with the pasted text in place of the selection. The field cuts a paste to its length
// before the other characters are dropped, so "12a34" would lose its last digit without it.
export function pasteIntoDeliveryCode(
  value: string,
  pasted: string,
  start: number,
  end: number,
): string {
  return toDeliveryCode(`${value.slice(0, start)}${pasted}${value.slice(end)}`);
}
