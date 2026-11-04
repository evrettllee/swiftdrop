import { expect, test } from '@playwright/test';
import type { ManagerZone } from '@/shared/staff-api';
import { changesOf, draftErrors, draftOf, isDraftChanged } from './zone-draft';

const ZONE: ManagerZone = {
  id: 7,
  name: 'Минск, центр',
  tariff: { id: 2, name: 'Минск, повышенный' },
  priority: 10,
  isActive: true,
  vertexCount: 5,
  areaKm2: 12.4,
  updatedAt: '2026-10-12T09:00:00.000Z',
};

test('should send nothing for an untouched draft', () => {
  const draft = draftOf(ZONE);

  expect(changesOf(ZONE, draft)).toEqual({});
  expect(isDraftChanged(ZONE, draft)).toBe(false);
});

test('should send only the changed fields, the name trimmed and the priority as a number', () => {
  const draft = { ...draftOf(ZONE), name: '  Центр ', priority: '20' };

  expect(changesOf(ZONE, draft)).toEqual({ name: 'Центр', priority: 20 });
  expect(changesOf(ZONE, { ...draftOf(ZONE), tariffId: 3, isActive: false })).toEqual({
    tariffId: 3,
    isActive: false,
  });
});

test('should count a name with spaces only around it as no change', () => {
  const draft = { ...draftOf(ZONE), name: ' Минск, центр ', priority: '010' };

  expect(changesOf(ZONE, draft)).toEqual({});
  expect(isDraftChanged(ZONE, draft)).toBe(true);
});

test('should check the name and the priority by the rules of the API', () => {
  expect(draftErrors({ ...draftOf(ZONE), name: '   ' })).toEqual({
    name: 'Название: от 1 до 80 символов',
  });
  expect(draftErrors({ ...draftOf(ZONE), name: 'а'.repeat(81) }).name).toBeDefined();
  expect(draftErrors({ ...draftOf(ZONE), priority: '101' })).toEqual({
    priority: 'Приоритет: целое число от 0 до 100',
  });
  expect(draftErrors({ ...draftOf(ZONE), priority: '2.5' }).priority).toBeDefined();
  expect(draftErrors({ ...draftOf(ZONE), priority: '' }).priority).toBeDefined();
  expect(draftErrors({ ...draftOf(ZONE), priority: '100' })).toEqual({});
});
