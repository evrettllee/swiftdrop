import { expect, test } from '@playwright/test';
import type { ManagerZone } from '@/shared/staff-api';
import { overlapWinner, ringsOverlap } from './overlap';
import { overlapNotes } from './overlap-notes';

function square(west: number, south: number, size: number) {
  return [
    { latitude: south, longitude: west },
    { latitude: south, longitude: west + size },
    { latitude: south + size, longitude: west + size },
    { latitude: south + size, longitude: west },
  ];
}

function zone(id: number, priority: number, isActive = true): ManagerZone {
  return {
    id,
    name: 'Минск',
    tariff: { id: 1, name: 'Минск, стандарт' },
    priority,
    isActive,
    vertexCount: 4,
    areaKm2: 10,
    updatedAt: '2026-10-20T09:00:00.000Z',
  };
}

test('should find the overlap of crossing, nested and equal rings', () => {
  const base = square(27.5, 53.9, 0.1);

  expect(ringsOverlap(base, square(27.55, 53.95, 0.1))).toBe(true);
  expect(ringsOverlap(base, square(27.52, 53.92, 0.02))).toBe(true);
  expect(ringsOverlap(square(27.52, 53.92, 0.02), base)).toBe(true);
  expect(ringsOverlap(base, square(27.5, 53.9, 0.1))).toBe(true);
});

test('should not count rings that only share an edge or stand apart', () => {
  const base = square(27.5, 53.9, 0.1);

  expect(ringsOverlap(base, square(27.6, 53.9, 0.1))).toBe(false);
  expect(ringsOverlap(base, square(27.8, 53.9, 0.1))).toBe(false);
});

test('should let the higher priority win and the older zone win a tie', () => {
  expect(overlapWinner({ id: null, priority: 5 }, { id: 3, priority: 0 })).toBe('subject');
  expect(overlapWinner({ id: null, priority: 0 }, { id: 3, priority: 5 })).toBe('other');
  expect(overlapWinner({ id: null, priority: 5 }, { id: 3, priority: 5 })).toBe('other');
  expect(overlapWinner({ id: 2, priority: 5 }, { id: 3, priority: 5 })).toBe('subject');
  expect(overlapWinner({ id: 4, priority: 5 }, { id: 3, priority: 5 })).toBe('other');
});

test('should write the note for each outcome and skip the disabled zones', () => {
  const ring = square(27.5, 53.9, 0.1);
  const neighbor = { zone: zone(3, 5), ring: square(27.55, 53.95, 0.1) };
  const notes = (priority: number, id: number | null = null) =>
    overlapNotes(ring, { id, priority }, [neighbor]).map(({ text }) => text);

  expect(overlapNotes(ring, { id: null, priority: 6 }, [neighbor])[0].title).toBe(
    'Пересекается с зоной «Минск»',
  );
  expect(notes(6)).toEqual([
    'Приоритет зоны «Минск» — 5, поэтому внутри пересечения будет действовать новая зона.',
  ]);
  expect(notes(4)).toEqual([
    'Приоритет зоны «Минск» — 5, поэтому внутри пересечения будет действовать зона «Минск».',
  ]);
  expect(notes(5)).toEqual([
    'Приоритет зоны «Минск» — 5, поэтому внутри пересечения будет действовать зона «Минск». При равном приоритете действует более старая зона.',
  ]);
  expect(notes(5, 1)).toEqual([
    'Приоритет зоны «Минск» — 5, поэтому внутри пересечения будет действовать эта зона. При равном приоритете действует более старая зона.',
  ]);
  expect(
    overlapNotes(ring, { id: null, priority: 0 }, [{ ...neighbor, zone: zone(3, 5, false) }]),
  ).toEqual([]);
});
