import { UI_TEXTS } from '@/shared/config';

export const HISTORY_TEXTS = {
  PAGE_TITLE: UI_TEXTS.COURIER_HISTORY,
  LIST_LABEL: 'Завершённые заказы',
  LIST_LOADING: 'Загрузка истории',
  LOAD_ERROR: 'Не удалось загрузить историю',
  RETRY: UI_TEXTS.RETRY,
  SHOW_MORE: 'Показать ещё',
  // An order whose end was not recorded.
  NO_DATE: '—',
  EMPTY_TITLE: 'Доставок пока нет',
  EMPTY_TEXT: 'Здесь появятся заказы, которые вы доставили.',
  TO_WORK: 'К работе',
  shown: (shown: number, total: number) => `Показано ${shown} из ${total}`,
  // For example "7,98 км, 2,5 кг": the last line of a card on a phone.
  details: (distance: string, weight: string) => `${distance}, ${weight}`,
} as const;
