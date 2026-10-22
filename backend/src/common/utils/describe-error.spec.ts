import { DrizzleQueryError } from 'drizzle-orm';
import { describeError, describeErrorStack } from './describe-error';

const INSERT = 'insert into "messages" ("content") values ($1)';
const SECRET_TEXT = 'Код домофона 25';

describe('describeError', () => {
  it('should keep the query of a failed query but not its parameters', () => {
    const cause = Object.assign(new Error(`bad value "${SECRET_TEXT}"`), { code: '23514' });
    const description = describeError(new DrizzleQueryError(INSERT, [SECRET_TEXT, 53.9], cause));

    expect(description).toBe(`Failed query: ${INSERT} (23514)`);
    expect(description).not.toContain(SECRET_TEXT);
    expect(description).not.toContain('53.9');
  });

  it('should give the message of a cause without a code, for example a lost connection', () => {
    const cause = new Error('Connection terminated unexpectedly');

    expect(describeError(new DrizzleQueryError(INSERT, [SECRET_TEXT], cause))).toBe(
      `Failed query: ${INSERT} (Connection terminated unexpectedly)`,
    );
  });

  it('should describe a failed query without a cause', () => {
    expect(describeError(new DrizzleQueryError(INSERT, [SECRET_TEXT]))).toBe(
      `Failed query: ${INSERT} (unknown cause)`,
    );
  });

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

describe('describeErrorStack', () => {
  it('should give the stack of the cause of a failed query, which has no parameters', () => {
    const cause = new Error('Connection terminated unexpectedly');
    const failed = new DrizzleQueryError(INSERT, [SECRET_TEXT], cause);

    expect(failed.stack).toContain(SECRET_TEXT);
    expect(describeErrorStack(failed)).toBe(cause.stack);
  });

  it('should give the own stack of any other error and nothing for a value', () => {
    const error = new Error('connection refused');

    expect(describeErrorStack(error)).toBe(error.stack);
    expect(describeErrorStack('timeout')).toBeUndefined();
  });
});
