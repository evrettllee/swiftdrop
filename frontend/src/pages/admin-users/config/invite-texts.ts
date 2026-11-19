import { pluralize } from '@/shared/lib/format';

const HOURS = { one: 'час', few: 'часа', many: 'часов' };

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
  NOT_SENT: 'Письмо не отправлено, перешлите ссылку сами',
  FALLBACK_TITLE: 'Письмо не пришло?',
  FALLBACK_TEXT: 'Скопируйте ссылку и перешлите сотруднику сами. Пароль вы не увидите.',
  COPY: 'Скопировать ссылку',
  COPIED: 'Ссылка скопирована',
  COPY_FAILED: 'Не удалось скопировать. Выделите ссылку и скопируйте её сами',
  DONE: 'Готово',
  hours: (count: number) => `${count} ${pluralize(count, HOURS)}`,
} as const;

export const ROLE_AS: Record<string, string> = {
  courier: 'курьер',
  manager: 'менеджер',
};
