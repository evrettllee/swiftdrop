import type { AdminTariff, TariffValues } from '../api/admin-tariffs';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PRICE_FIELDS,
  PRICE_MAX,
  TARIFF_FIELD,
  type TariffField,
} from '../config/limits';
import { VALIDATION_TEXTS as TEXTS } from '../config/texts';
import { formatPrice, parsePrice } from './number-input';

export type TariffDraft = Record<TariffField, string>;

export type TariffErrors = Partial<Record<TariffField, string>>;

export const EMPTY_DRAFT: TariffDraft = {
  name: '',
  pricePerKm: '',
  pricePerKg: '',
  minPrice: '',
  fragileFee: '',
};

export function draftOf(tariff: AdminTariff | null): TariffDraft {
  if (tariff === null) {
    return EMPTY_DRAFT;
  }

  return {
    name: tariff.name,
    pricePerKm: formatPrice(tariff.pricePerKm),
    pricePerKg: formatPrice(tariff.pricePerKg),
    minPrice: formatPrice(tariff.minPrice),
    fragileFee: formatPrice(tariff.fragileFee),
  };
}

export function validateDraft(draft: TariffDraft): {
  values: TariffValues | null;
  errors: TariffErrors;
} {
  const errors: TariffErrors = {};
  const name = draft.name.trim();
  const prices: Partial<Record<TariffField, number>> = {};

  if (name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH) {
    errors[TARIFF_FIELD.NAME] = TEXTS.NAME_LENGTH;
  }

  for (const field of PRICE_FIELDS) {
    const parsed = parsePrice(draft[field], PRICE_MAX[field]);

    if ('message' in parsed) {
      errors[field] = parsed.message;
    } else {
      prices[field] = parsed.value;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { values: null, errors };
  }

  return {
    values: {
      name,
      pricePerKm: prices.pricePerKm ?? 0,
      pricePerKg: prices.pricePerKg ?? 0,
      minPrice: prices.minPrice ?? 0,
      fragileFee: prices.fragileFee ?? 0,
    },
    errors,
  };
}

export function changedFields(tariff: AdminTariff, values: TariffValues): Partial<TariffValues> {
  const changes: Partial<TariffValues> = {};

  if (values.name !== tariff.name) {
    changes.name = values.name;
  }

  for (const field of PRICE_FIELDS) {
    if (values[field] !== tariff[field]) {
      changes[field] = values[field];
    }
  }

  return changes;
}
