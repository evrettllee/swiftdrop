import { z } from 'zod';
import { MINOR_UNITS_PER_MAJOR, MONEY_FRACTION_DIGITS } from '../constants/money.constants';

export const MONEY_MESSAGES = {
  POSITIVE: 'Введите число больше 0',
  TWO_DECIMALS: 'Не больше двух знаков после запятой',
  MAX: (max: number) => `Не больше ${max}`,
} as const;

const PLAIN_DECIMAL = /^(\d+)(?:\.(\d+))?$/;

function minorUnitsOf(value: number): number | null {
  const match = PLAIN_DECIMAL.exec(String(value));

  if (!match) {
    return null;
  }

  const [, whole, fraction = ''] = match;

  if (fraction.length > MONEY_FRACTION_DIGITS) {
    return null;
  }

  return (
    Number(whole) * MINOR_UNITS_PER_MAJOR + Number(fraction.padEnd(MONEY_FRACTION_DIGITS, '0'))
  );
}

function formatMinorUnits(minor: number): string {
  const whole = Math.floor(minor / MINOR_UNITS_PER_MAJOR);
  const fraction = String(minor % MINOR_UNITS_PER_MAJOR).padStart(MONEY_FRACTION_DIGITS, '0');

  return `${whole}.${fraction}`;
}

export function buildMoneySchema(max: number) {
  const maxMinor = max * MINOR_UNITS_PER_MAJOR;

  return z
    .number({ error: MONEY_MESSAGES.POSITIVE })
    .positive(MONEY_MESSAGES.POSITIVE)
    .transform((value, context) => {
      const minor = minorUnitsOf(value);

      if (minor === null && value <= max) {
        context.addIssue({ code: 'custom', message: MONEY_MESSAGES.TWO_DECIMALS });

        return z.NEVER;
      }

      if (minor === null || minor > maxMinor) {
        context.addIssue({ code: 'custom', message: MONEY_MESSAGES.MAX(max) });

        return z.NEVER;
      }

      return formatMinorUnits(minor);
    });
}
