export const INVITE_STAFF_TEXTS = {
  TITLE: 'Добавить сотрудника',
  ROLE: 'Роль',
  COURIER: 'Курьер',
  COURIER_HINT: 'Доставляет заказы. Транспорт укажет сам после первого входа',
  COURIER_HINT_SHORT: 'Транспорт укажет сам после первого входа',
  MANAGER: 'Менеджер',
  MANAGER_HINT: 'Работает с заказами, картой курьеров, зонами и поддержкой',
  MANAGER_HINT_SHORT: 'Заказы, карта, зоны и поддержка',
  FIRST_NAME: 'Имя',
  LAST_NAME: 'Фамилия',
  EMAIL: 'Email',
  PHONE: 'Телефон',
  LINK_HINT:
    'Отправим приглашение на email. Сотрудник сам создаст пароль по ссылке, она действует 72 часа.',
  SUBMIT: 'Отправить приглашение',
  SUBMITTING: 'Отправляем',
  CANCEL: 'Отмена',
  SENT_TITLE: 'Приглашение отправлено',
  CREATED_TITLE: 'Приглашение создано',
} as const;

export const ROLE_AS: Record<string, string> = {
  courier: 'курьер',
  manager: 'менеджер',
};
