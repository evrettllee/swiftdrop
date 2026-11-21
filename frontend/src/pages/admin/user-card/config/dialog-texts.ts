export const DIALOG_TEXTS = {
  CANCEL: 'Отмена',
  FAILED: 'Не удалось выполнить действие. Попробуйте ещё раз',
  ROLE_TITLE: 'Сменить роль',
  ROLE_CONFIRM: 'Сменить роль',
  toManager: (name: string) =>
    `${name} станет менеджером. Все сессии завершатся, войти придётся заново. Профиль курьера сохранится, готовность к работе выключится.`,
  toCourier: (name: string) =>
    `${name} станет курьером. Все сессии завершатся, войти придётся заново.`,
  BLOCK_TITLE: 'Заблокировать пользователя',
  BLOCK_CONFIRM: 'Заблокировать',
  block: (name: string) =>
    `${name} не сможет войти в аккаунт, текущие сессии завершатся сразу.`,
  REASON: 'Причина',
  REASON_PLACEHOLDER: 'Например, жалобы курьеров на оскорбления в чате',
  REASON_HINT: 'Причину видят только администраторы',
  REASON_REQUIRED: 'Укажите причину блокировки',
  reasonCounter: (length: number, max: number) => `${length} / ${max}`,
  UNBLOCK_TITLE: 'Разблокировать пользователя?',
  UNBLOCK_CONFIRM: 'Разблокировать',
  unblockClient: (name: string) =>
    `${name} снова сможет входить в аккаунт и оформлять заказы.`,
  unblockStaff: (name: string) => `${name} снова сможет входить в аккаунт.`,
  SESSIONS_TITLE: 'Завершить все сеансы?',
  SESSIONS_CONFIRM: 'Завершить сеансы',
  sessions: (name: string) =>
    `${name} выйдет из аккаунта на всех устройствах. Войти снова можно будет, это не блокировка.`,
  DELETE_TITLE: 'Удалить пользователя?',
  DELETE_CONFIRM: 'Удалить',
  DELETE_TEXT:
    'Имя, email, телефон и привязки Google и Яндекс удалятся без возможности восстановления. Заказы и переписка сохранятся без личных данных, а email можно будет использовать для новой регистрации.',
  RESET_TITLE: 'Сбросить пароль?',
  RESET_CONFIRM: 'Сбросить пароль',
  reset: (email: string) =>
    `Текущий пароль перестанет работать, все сессии сотрудника завершатся. На ${email} придёт письмо со ссылкой для нового пароля, она действует 72 часа.`,
  RESEND_TITLE: 'Отправить приглашение заново?',
  RESEND_CONFIRM: 'Отправить',
  resend: (email: string) =>
    `Старая ссылка перестанет работать. Новое письмо уйдёт на ${email}, ссылка действует 72 часа.`,
  SENT_TITLE: 'Письмо отправлено',
  RESET_CREATED_TITLE: 'Ссылка создана',
  INVITE_CREATED_TITLE: 'Приглашение создано',
  resetSent: (email: string, hours: string) =>
    `Ссылка для нового пароля ушла на ${email} и действует ${hours}. Все сессии сотрудника уже завершены.`,
  resetCreated: (hours: string) =>
    `Ссылка для нового пароля действует ${hours}. Все сессии сотрудника уже завершены.`,
  resendSent: (email: string, hours: string) =>
    `Новое письмо со ссылкой для создания пароля ушло на ${email}, ссылка действует ${hours}.`,
  resendCreated: (hours: string) => `Ссылка для создания пароля действует ${hours}.`,
  EDIT_TITLE: 'Изменить данные',
  EDIT_CONFIRM: 'Сохранить',
  FIRST_NAME: 'Имя',
  LAST_NAME: 'Фамилия',
  PHONE: 'Телефон',
  EMAIL: 'Email',
  EMAIL_HINT: 'Email изменить нельзя, он служит логином',
} as const;

export const BLOCK_REASON_MAX_LENGTH = 500;
