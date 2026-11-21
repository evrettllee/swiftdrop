export const TARIFF_FIELD = {
  NAME: 'name',
  PRICE_PER_KM: 'pricePerKm',
  PRICE_PER_KG: 'pricePerKg',
  MIN_PRICE: 'minPrice',
  FRAGILE_FEE: 'fragileFee',
} as const;

export type TariffField = (typeof TARIFF_FIELD)[keyof typeof TARIFF_FIELD];

export const PRICE_FIELDS = [
  TARIFF_FIELD.PRICE_PER_KM,
  TARIFF_FIELD.PRICE_PER_KG,
  TARIFF_FIELD.MIN_PRICE,
  TARIFF_FIELD.FRAGILE_FEE,
] as const;

export type PriceField = (typeof PRICE_FIELDS)[number];

export const PRICE_MAX: Record<PriceField, number> = {
  pricePerKm: 100,
  pricePerKg: 100,
  minPrice: 1000,
  fragileFee: 1000,
};

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 50;
export const PRICE_FRACTION_DIGITS = 2;
