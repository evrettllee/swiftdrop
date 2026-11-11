import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { PERSON_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { OAUTH_PROVIDER } from '@/common/enums/oauth-provider.enum';
import {
  OAUTH_ERROR_MESSAGES,
  YANDEX_AUTH_HEADER_SCHEME,
  YANDEX_PROFILE_URL,
} from '../constants/oauth.constants';
import { YandexStrategy } from './yandex.strategy';

const ACCESS_TOKEN = 'test-access-token';
const YANDEX_USER_ID = '1234567';

const fullProfile = {
  id: YANDEX_USER_ID,
  default_email: 'Ivan@Yandex.RU',
  first_name: 'Иван',
  last_name: 'Петров',
  display_name: 'ivan.display',
  login: 'ivan.login',
};

function mockProfileResponse(body: unknown, ok = true): jest.SpyInstance {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

describe('YandexStrategy', () => {
  const config = { getOrThrow: () => 'test-value' } as unknown as ConfigService;
  const strategy = new YandexStrategy(config);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should map the profile and lowercase the email when Yandex returns full data', async () => {
    mockProfileResponse(fullProfile);

    await expect(strategy.validate(ACCESS_TOKEN)).resolves.toEqual({
      provider: OAUTH_PROVIDER.YANDEX,
      providerUserId: YANDEX_USER_ID,
      email: 'ivan@yandex.ru',
      emailVerified: true,
      firstName: 'Иван',
      lastName: 'Петров',
    });
  });

  it('should fall back to the display name when the first name is missing', async () => {
    mockProfileResponse({ ...fullProfile, first_name: undefined });

    await expect(strategy.validate(ACCESS_TOKEN)).resolves.toMatchObject({
      firstName: fullProfile.display_name,
    });
  });

  it('should fall back to the login when first and display names are missing', async () => {
    mockProfileResponse({ ...fullProfile, first_name: undefined, display_name: undefined });

    await expect(strategy.validate(ACCESS_TOKEN)).resolves.toMatchObject({
      firstName: fullProfile.login,
    });
  });

  it('should use an empty last name when Yandex does not return one', async () => {
    mockProfileResponse({ ...fullProfile, last_name: undefined });

    await expect(strategy.validate(ACCESS_TOKEN)).resolves.toMatchObject({ lastName: '' });
  });

  it('should cut names to the column limit when they are too long', async () => {
    mockProfileResponse({ ...fullProfile, first_name: 'а'.repeat(PERSON_FIELD_LENGTH.NAME + 50) });

    const profile = await strategy.validate(ACCESS_TOKEN);

    expect(profile.firstName).toHaveLength(PERSON_FIELD_LENGTH.NAME);
  });

  it('should reject the login when Yandex does not return an email', async () => {
    mockProfileResponse({ ...fullProfile, default_email: undefined });

    await expect(strategy.validate(ACCESS_TOKEN)).rejects.toMatchObject({
      message: OAUTH_ERROR_MESSAGES.EMAIL_MISSING,
    });
  });

  it('should reject the login when the profile request fails', async () => {
    mockProfileResponse({}, false);

    await expect(strategy.validate(ACCESS_TOKEN)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject the login when the profile does not match the expected shape', async () => {
    mockProfileResponse({ default_email: 'ivan@yandex.ru' });

    await expect(strategy.validate(ACCESS_TOKEN)).rejects.toMatchObject({
      message: OAUTH_ERROR_MESSAGES.LOGIN_FAILED,
    });
  });

  it('should send the access token in the OAuth header when requesting the profile', async () => {
    const fetchSpy = mockProfileResponse(fullProfile);

    await strategy.validate(ACCESS_TOKEN);

    expect(fetchSpy).toHaveBeenCalledWith(
      YANDEX_PROFILE_URL,
      expect.objectContaining({
        headers: { Authorization: `${YANDEX_AUTH_HEADER_SCHEME} ${ACCESS_TOKEN}` },
      }),
    );
  });
});
