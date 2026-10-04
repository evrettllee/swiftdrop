export const OAUTH_PROVIDER_VALUES = ['google', 'yandex'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDER_VALUES)[number];

export const OAUTH_PROVIDER = {
  GOOGLE: 'google',
  YANDEX: 'yandex',
} as const satisfies Record<string, OAuthProvider>;
