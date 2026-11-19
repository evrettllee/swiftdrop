import { buildSetPasswordUrl } from './set-password-url';

describe('buildSetPasswordUrl', () => {
  it('should put the token after the set password path when the app address is given', () => {
    expect(buildSetPasswordUrl('http://localhost:5173', 'abc_DEF-123')).toBe(
      'http://localhost:5173/set-password/abc_DEF-123',
    );
  });

  it('should keep one slash when the app address ends with a slash', () => {
    expect(buildSetPasswordUrl('https://swiftdrop.example/', 'token')).toBe(
      'https://swiftdrop.example/set-password/token',
    );
  });
});
