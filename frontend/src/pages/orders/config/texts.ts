import { UI_TEXTS } from '@/shared/config';
import { ORDER_LIST_FILTER } from './list';

export const ORDERS_TEXTS = {
  PAGE_TITLE: 'Мои заказы',
  NEW_ORDER: UI_TEXTS.NEW_ORDER,
  TABS_LABEL: 'Фильтр заказов',
  LIST_FAILED: 'Не удалось загрузить заказы. Попробуйте ещё раз',
  LIST_FAILED_TITLE: 'Не удалось загрузить заказы',
  LIST_LOADING: 'Загрузка заказов',
  RETRY: UI_TEXTS.RETRY,
  SHOW_MORE: 'Показать ещё',
  shown: (shown: number, total: number) => `Показано ${shown} из ${total}`,
  // Couriers are not assigned yet: the name comes with the courier slice.
  COURIER_NOT_ASSIGNED: 'Не назначен',
  // Not used yet: the "track" action of a card comes with the tracking slice.
  ACTION_TRACK: 'Отследить',
} as const;

export const ORDER_TAB_LABELS = {
  [ORDER_LIST_FILTER.ALL]: 'Все',
  [ORDER_LIST_FILTER.ACTIVE]: 'Активные',
  [ORDER_LIST_FILTER.FINISHED]: 'Завершённые',
} as const;

// "All" is the empty state of the mockup; the other two are for an empty tab (without a button).
export const ORDERS_EMPTY_TEXTS = {
  [ORDER_LIST_FILTER.ALL]: {
    title: 'Заказов пока нет',
    text: 'Укажите адреса и посылку, и мы сразу посчитаем стоимость доставки.',
  },
  [ORDER_LIST_FILTER.ACTIVE]: {
    title: 'Активных заказов нет',
    text: 'Здесь появятся заказы, которые ещё в работе.',
  },
  [ORDER_LIST_FILTER.FINISHED]: {
    title: 'Завершённых заказов нет',
    text: 'Здесь появятся доставленные и отменённые заказы.',
  },
} as const;
