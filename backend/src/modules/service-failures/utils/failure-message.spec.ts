import { errorCodeOf, fetchFailureOf, safeCode } from './failure-message';

const PERSONAL = [
  '27.559,53.9006',
  'ivan.petrov@example.com',
  'cs_test_a1B2c3D4e5F6g7H8',
  'pi_3PqRsTuVwXyZ012345',
  'Иван Петров',
  '+375291234567',
];

function timeoutError(): Error {
  const error = new Error('The operation was aborted due to timeout');
  error.name = 'TimeoutError';

  return error;
}

describe('failure message', () => {
  it('should keep a short technical code', () => {
    expect(safeCode('ECONNREFUSED')).toBe('ECONNREFUSED');
    expect(safeCode('invalid_request_error')).toBe('invalid_request_error');
  });

  it.each(PERSONAL)('should drop %s from any message', (value) => {
    expect(safeCode(value)).toBeNull();
    expect(errorCodeOf({ code: value, name: value })).toBe('UNKNOWN');
  });

  it('should take the code of the error, then of its cause, then its class name', () => {
    expect(errorCodeOf(Object.assign(new Error('x'), { code: 'EAUTH' }))).toBe('EAUTH');
    expect(errorCodeOf(new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } }))).toBe(
      'ECONNRESET',
    );
    expect(errorCodeOf(new SyntaxError('Unexpected token < at ivan@example.com'))).toBe(
      'SyntaxError',
    );
    expect(errorCodeOf('down')).toBe('UNKNOWN');
  });

  it('should tell a timeout from an unavailable service', () => {
    expect(fetchFailureOf(timeoutError(), 5000)).toEqual({
      code: 'timeout',
      message: 'Нет ответа за 5 с',
    });
    expect(
      fetchFailureOf(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }), 5000),
    ).toEqual({ code: 'unavailable', message: 'ECONNREFUSED' });
  });

  it('should never put the address of a failed request into the message', () => {
    const error = new TypeError('fetch failed https://osrm.test/27.559,53.9006 ivan@example.com');

    expect(fetchFailureOf(error, 5000)).toEqual({ code: 'unavailable', message: 'TypeError' });
  });
});
