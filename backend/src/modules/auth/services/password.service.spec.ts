import { PasswordService } from './password.service';

const PASSWORD = 'Test1234!';
const WRONG_PASSWORD = 'Wrong1234!';
const ARGON2ID_PREFIX = '$argon2id$';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('should produce an argon2id hash that differs from the password when hashing', async () => {
    const hash = await service.hash(PASSWORD);

    expect(hash).not.toBe(PASSWORD);
    expect(hash.startsWith(ARGON2ID_PREFIX)).toBe(true);
  });

  it('should produce different hashes when the same password is hashed twice', async () => {
    const [first, second] = await Promise.all([service.hash(PASSWORD), service.hash(PASSWORD)]);

    expect(first).not.toBe(second);
  });

  it('should return true when the password matches the hash', async () => {
    const hash = await service.hash(PASSWORD);

    expect(await service.verify(hash, PASSWORD)).toBe(true);
  });

  it('should return false when the password does not match the hash', async () => {
    const hash = await service.hash(PASSWORD);

    expect(await service.verify(hash, WRONG_PASSWORD)).toBe(false);
  });

  it('should return false without throwing when there is no hash', async () => {
    expect(await service.verify(null, PASSWORD)).toBe(false);
  });
});
