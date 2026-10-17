import { UI_TEXTS } from '@/shared/config';

// The page of a finished order of the courier.
export const HISTORY_ORDER_TEXTS = {
  BACK: 'К истории',
  title: (number: string) => `Заказ ${number}`,
  finishedAt: (date: string) => `Завершён ${date}`,
  // An order whose end was not recorded.
  NO_DATE: '—',
  SECTION_ROUTE: 'Маршрут',
  SECTION_PROGRESS: 'Ход заказа',
  SECTION_PARCEL: 'Посылка',
  DISTANCE: 'Расстояние',
  LOADING: 'Загрузка заказа',
  LOAD_ERROR: 'Не удалось загрузить заказ',
  RETRY: UI_TEXTS.RETRY,
  NOT_FOUND_TITLE: 'Заказ не найден',
  NOT_FOUND_TEXT: 'Возможно, ссылка устарела или это не ваш завершённый заказ.',
} as const;
