import { expect, test } from '@playwright/test';
import type { AdminTariff } from '../api/admin-tariffs';
import { changedFields, draftOf, EMPTY_DRAFT, validateDraft } from './tariff-form';

const TARIFF: AdminTariff = {
  tariffId: 7,
  name: 'Минск, стандарт',
  pricePerKm: 0.85,
  pricePerKg: 0.3,
  minPrice: 5,
  fragileFee: 2,
  isActive: true,
  zones: [],
  updatedAt: new Date('2026-10-03T09:00:00Z'),
  updatedBy: null,
};

test('should fill the draft of a tariff with prices shown by a comma', () => {
  expect(draftOf(TARIFF)).toEqual({
    name: 'Минск, стандарт',
    pricePerKm: '0,85',
    pricePerKg: '0,30',
    minPrice: '5,00',
    fragileFee: '2,00',
  });
  expect(draftOf(null)).toEqual(EMPTY_DRAFT);
});

test('should turn a valid draft into numbers and trim the name', () => {
  expect(validateDraft({ ...draftOf(TARIFF), name: '  Пригород  ', pricePerKm: '1.1' })).toEqual({
    values: {
      name: 'Пригород',
      pricePerKm: 1.1,
      pricePerKg: 0.3,
      minPrice: 5,
      fragileFee: 2,
    },
    errors: {},
  });
});

test('should name every field that is wrong', () => {
  const result = validateDraft({
    name: 'А',
    pricePerKm: '0',
    pricePerKg: '',
    minPrice: '1001',
    fragileFee: '1,234',
  });

  expect(result.values).toBeNull();
  expect(result.errors).toEqual({
    name: 'Название от 2 до 50 символов',
    pricePerKm: 'Больше 0',
    pricePerKg: 'Введите число',
    minPrice: 'Не больше 1000',
    fragileFee: 'Не больше двух знаков после запятой',
  });
});

test('should refuse a name over fifty characters', () => {
  expect(validateDraft({ ...draftOf(TARIFF), name: 'я'.repeat(51) }).errors).toEqual({
    name: 'Название от 2 до 50 символов',
  });
  expect(validateDraft({ ...draftOf(TARIFF), name: 'я'.repeat(50) }).errors).toEqual({});
});

test('should send only what changed', () => {
  const { values } = validateDraft({
    ...draftOf(TARIFF),
    minPrice: '5,50',
    name: ' Минск, стандарт ',
  });

  expect(values).not.toBeNull();
  expect(values && changedFields(TARIFF, values)).toEqual({ minPrice: 5.5 });
});

test('should find nothing to send when the values are the same', () => {
  const { values } = validateDraft(draftOf(TARIFF));

  expect(values && changedFields(TARIFF, values)).toEqual({});
});
