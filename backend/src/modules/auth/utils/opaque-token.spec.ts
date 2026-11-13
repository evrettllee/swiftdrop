import { createHash } from 'node:crypto';
import { generateOpaqueToken, hashOpaqueToken } from './opaque-token';

describe('opaque tokens', () => {
  it('should give 43 url-safe characters when 32 bytes are asked for', () => {
    expect(generateOpaqueToken(32)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('should give a different token every time when it is called again', () => {
    expect(generateOpaqueToken(32)).not.toBe(generateOpaqueToken(32));
  });

  it('should hash a token to its SHA-256 hex when it is stored', () => {
    expect(hashOpaqueToken('token')).toBe(createHash('sha256').update('token').digest('hex'));
    expect(hashOpaqueToken('token')).toMatch(/^[0-9a-f]{64}$/);
  });
});
