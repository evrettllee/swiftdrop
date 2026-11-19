import { canMergeFailure, clipText } from './failure-merge';

const NOW = new Date('2026-11-13T10:00:00Z');
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

describe('canMergeFailure', () => {
  it.each([0, 1, 9.99, 10])('should merge a repeat %p minutes after the last one', (minutes) => {
    expect(canMergeFailure(minutesAgo(minutes), NOW)).toBe(true);
  });

  it.each([10.01, 11, 60])('should start a new row %p minutes after the last one', (minutes) => {
    expect(canMergeFailure(minutesAgo(minutes), NOW)).toBe(false);
  });

  it('should start a new row when there is no earlier one', () => {
    expect(canMergeFailure(null, NOW)).toBe(false);
  });
});

describe('clipText', () => {
  it('should keep a short text and cut a long one by letters', () => {
    expect(clipText('ETIMEDOUT', 64)).toBe('ETIMEDOUT');
    expect(clipText('я'.repeat(70), 64)).toBe('я'.repeat(64));
  });
});
