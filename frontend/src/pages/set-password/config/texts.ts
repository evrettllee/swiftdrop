export const SET_PASSWORD_TEXTS = {
  TITLE: 'Создайте пароль',
  LOGIN: 'Логин',
  SUBMIT: 'Создать пароль и войти',
  SUBMITTING: 'Создаём пароль',
  LOADING_LABEL: 'Загружаем ссылку',
  INVALID_TITLE: 'Ссылка недействительна',
  INVALID_TEXT:
    'Ссылка уже использована или прошло больше 72 часов. Попросите администратора отправить приглашение заново.',
  INVALID_ACTION: 'Перейти ко входу',
} as const;

export const ROLE_AS: Record<string, string> = {
  client: 'клиента',
  courier: 'курьера',
  manager: 'менеджера',
};
