import { PRICE_FRACTION_DIGITS } from '../config/limits';
import { VALIDATION_TEXTS as TEXTS } from '../config/texts';

export type PriceParse = { value: number } | { message: string };

const DECIMAL_INPUT = /^-?(\d+\.?\d*|\.\d+)$/;
const PLAIN_DECIMAL = /^\d+(?:\.(\d+))?$/;
const DECIMAL_SEPARATORS = /,/g;
const COMMA = ',';

export function formatPrice(value: number): string {
  return value.toFixed(PRICE_FRACTION_DIGITS).replace('.', COMMA);
}

export function parsePrice(raw: string, max: number): PriceParse {
  const text = raw.trim().replace(DECIMAL_SEPARATORS, '.');

  if (!DECIMAL_INPUT.test(text)) {
    return { message: TEXTS.NOT_A_NUMBER };
  }

  const value = Number(text);

  if (!(value > 0)) {
    return { message: TEXTS.POSITIVE };
  }

  const plain = PLAIN_DECIMAL.exec(String(value));

  if (plain === null) {
    return { message: TEXTS.max(max) };
  }

  const fraction = plain[1] ?? '';

  if (fraction.length > PRICE_FRACTION_DIGITS) {
    return { message: value <= max ? TEXTS.TWO_DECIMALS : TEXTS.max(max) };
  }

  return value > max ? { message: TEXTS.max(max) } : { value };
}
