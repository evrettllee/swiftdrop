import { ROLE } from '@/common/enums/role.enum';

export const SET_PASSWORD_PATH = '/set-password';

export const INVITABLE_ROLES = [ROLE.COURIER, ROLE.MANAGER] as const;

export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const INVITATION_ROLE_LABELS: Record<InvitableRole, string> = {
  [ROLE.COURIER]: 'курьера',
  [ROLE.MANAGER]: 'менеджера',
};

export const AUTH_MAIL_TEXTS = {
  GREETING: (firstName: string) => `Здравствуйте, ${firstName}!`,
  EXPIRY: (expiresAt: string) => `Ссылка действует до ${expiresAt} и только один раз.`,
  BUTTON: 'Создать пароль',
  INVITATION: {
    SUBJECT: 'Приглашение в SwiftDrop',
    INTRO: (roleLabel: string, hours: number) =>
      `Вас пригласили в SwiftDrop как ${roleLabel}. Создайте пароль по ссылке, она действует ${hours} часа:`,
    OUTRO: 'Если вы не ждали это письмо, просто проигнорируйте его.',
  },
  PASSWORD_RESET_BY_ADMIN: {
    SUBJECT: 'Новый пароль для SwiftDrop',
    INTRO: 'Администратор сбросил ваш пароль, старый больше не работает.',
    ACTION: 'Создайте новый по ссылке:',
  },
} as const;

export const AUTH_MAIL_STYLE = {
  PAGE_BACKGROUND: '#F9FAFB',
  CARD_BACKGROUND: '#FCFCFD',
  CARD_BORDER: '#E5E7EB',
  TEXT: '#111827',
  MUTED_TEXT: '#6B7280',
  BUTTON_BACKGROUND: '#1E3A8A',
  BUTTON_TEXT: '#F9FAFB',
  BUTTON_RADIUS: '8px',
  BUTTON_PADDING: '12px 16px',
  FONT_FAMILY: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
} as const;
