import { expect, test } from '@playwright/test';
import { barShare, labelStep, niceScale, percentLineScale } from './chart-helpers';

test('should compute nice scale and percent line scale bounds', () => {
  expect(niceScale(830, 4)).toEqual({ top: 1000, ticks: [0, 250, 500, 750, 1000] });
  expect(niceScale(0, 4)).toEqual({ top: 4, ticks: [0, 1, 2, 3, 4] });
  expect(percentLineScale(88, 4)).toEqual({ bottom: 80, top: 100, ticks: [80, 85, 90, 95, 100] });
  expect(percentLineScale(null, 4)).toEqual({
    bottom: 80,
    top: 100,
    ticks: [80, 85, 90, 95, 100],
  });
  expect(percentLineScale(63, 4)).toEqual({ bottom: 60, top: 100, ticks: [60, 70, 80, 90, 100] });
});

test('should clamp bar share and calculate label step', () => {
  expect(barShare(50, 100)).toBe(0.5);
  expect(barShare(120, 100)).toBe(1);
  expect(barShare(10, 0)).toBe(0);
  expect(labelStep(7, 10)).toBe(1);
  expect(labelStep(30, 10)).toBe(3);
});
