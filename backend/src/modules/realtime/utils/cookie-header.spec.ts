import { parseCookieHeader } from './cookie-header';

describe('parseCookieHeader', () => {
  it('should return every cookie when the header has several', () => {
    expect(parseCookieHeader('access_token=abc; refresh_token=def')).toEqual({
      access_token: 'abc',
      refresh_token: 'def',
    });
  });

  it('should return an empty object when there is no header', () => {
    expect(parseCookieHeader(undefined)).toEqual({});
  });

  it('should keep the equals signs of a value when the value has them', () => {
    expect(parseCookieHeader('token=a=b=')).toEqual({ token: 'a=b=' });
  });

  it('should decode an escaped value and keep a malformed one as it is', () => {
    expect(parseCookieHeader('name=%D0%98; broken=%E0%A4%A')).toEqual({
      name: 'И',
      broken: '%E0%A4%A',
    });
  });

  it('should skip a part without a name when the header is malformed', () => {
    expect(parseCookieHeader('=value; ok=1')).toEqual({ ok: '1' });
  });
});
