export const TOKEN_KIND_VALUES = ['invite', 'reset'] as const;

export type TokenKind = (typeof TOKEN_KIND_VALUES)[number];

export const TOKEN_KIND = {
  INVITE: 'invite',
  RESET: 'reset',
} as const satisfies Record<string, TokenKind>;
