import { describeError } from './describe-error';

describe('describeError', () => {
  it('should return the message of an error', () => {
    expect(describeError(new Error('connection refused'))).toBe('connection refused');
  });

  it('should return the message of an error subclass', () => {
    expect(describeError(new TypeError('not a function'))).toBe('not a function');
  });

  it('should return a thrown string as it is', () => {
    expect(describeError('timeout')).toBe('timeout');
  });

  it('should convert a thrown value that is not an error to a string', () => {
    expect(describeError(503)).toBe('503');
    expect(describeError(null)).toBe('null');
    expect(describeError(undefined)).toBe('undefined');
  });
});
