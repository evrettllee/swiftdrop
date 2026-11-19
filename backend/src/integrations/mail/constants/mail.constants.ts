export const MAIL_KIND_VALUES = ['invitation', 'password_reset_by_admin'] as const;

export const MAIL_KIND = {
  INVITATION: 'invitation',
  PASSWORD_RESET_BY_ADMIN: 'password_reset_by_admin',
} as const satisfies Record<string, (typeof MAIL_KIND_VALUES)[number]>;

export const MAIL_UNKNOWN_ERROR_CODE = 'UNKNOWN';

export const MAIL_LOG_MESSAGES = {
  SUPPRESSED: 'Mail suppressed',
  NOT_SENT: 'Mail not sent',
} as const;
