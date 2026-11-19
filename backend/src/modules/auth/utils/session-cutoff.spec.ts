import { isIssuedBeforeCutoff } from './session-cutoff';

const CUTOFF = new Date('2026-11-13T10:00:05.700Z');
const CUTOFF_SECOND = Date.parse('2026-11-13T10:00:05.000Z') / 1000;

describe('isIssuedBeforeCutoff', () => {
  it('should accept any token when sessions were never ended', () => {
    expect(isIssuedBeforeCutoff(1, null)).toBe(false);
  });

  it('should reject a token issued a second before the cutoff', () => {
    expect(isIssuedBeforeCutoff(CUTOFF_SECOND - 1, CUTOFF)).toBe(true);
  });

  it('should accept a token issued in the same second as the cutoff', () => {
    expect(isIssuedBeforeCutoff(CUTOFF_SECOND, CUTOFF)).toBe(false);
  });

  it('should accept a token issued after the cutoff', () => {
    expect(isIssuedBeforeCutoff(CUTOFF_SECOND + 1, CUTOFF)).toBe(false);
  });

  it('should reject a token without an issue time once sessions were ended', () => {
    expect(isIssuedBeforeCutoff(undefined, CUTOFF)).toBe(true);
  });
});
