import { pluralize } from '@/shared/lib/format';

const HOURS = { one: 'час', few: 'часа', many: 'часов' };

export const PASSWORD_LINK_TEXTS = {
  NOT_SENT: 'Письмо не отправлено, перешлите ссылку сами',
  FALLBACK_TITLE: 'Письмо не пришло?',
  FALLBACK_TEXT: 'Скопируйте ссылку и перешлите сотруднику сами. Пароль вы не увидите.',
  COPY: 'Скопировать ссылку',
  COPIED: 'Ссылка скопирована',
  COPY_FAILED: 'Не удалось скопировать. Выделите ссылку и скопируйте её сами',
  DONE: 'Готово',
  hours: (count: number) => `${count} ${pluralize(count, HOURS)}`,
} as const;
