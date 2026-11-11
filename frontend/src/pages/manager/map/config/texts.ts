import { MANAGER_SEARCH_TEXT_MIN_LENGTH } from '@/shared/staff-api';
import { UI_TEXTS } from '@/shared/config';
import { MAP_FILTER, type MapFilter } from './map';

export const MANAGER_MAP_TEXTS = {
  TITLE: 'Карта курьеров',
  PANEL_LABEL: 'Курьеры на линии',
  MAP_LABEL: 'Карта курьеров на линии',
  SEARCH_LABEL: 'Поиск курьера',
  SEARCH_PLACEHOLDER: 'Имя или телефон',
  SEARCH_CLEAR: 'Очистить поиск',
  SEARCH_TOO_SHORT: `Введите не меньше ${MANAGER_SEARCH_TEXT_MIN_LENGTH} символов`,
  FILTERS_LABEL: 'Состояние',
  VEHICLE_FILTERS_LABEL: 'Транспорт',
  ALL: 'Все',
  LOAD_FAILED_TITLE: 'Не удалось загрузить курьеров',
  LOAD_FAILED: 'Проверьте соединение и попробуйте ещё раз.',
  RETRY: UI_TEXTS.RETRY,
  EMPTY_TITLE: 'Ничего не найдено',
  bySearch: (query: string) => `По запросу «${query}» курьеров нет. Проверьте запрос или фильтр.`,
  BY_FILTER: 'Курьеров в этом состоянии сейчас нет.',
  NOBODY_TITLE: 'Курьеров на линии нет',
  NOBODY_TEXT: 'Здесь появятся курьеры, которые вышли на линию.',
  NO_VEHICLE: 'Нет транспорта',
} as const;

export const FILTER_LABELS: Record<MapFilter, string> = {
  [MAP_FILTER.FREE]: 'Свободны',
  [MAP_FILTER.ON_ORDER]: 'С заказом',
  [MAP_FILTER.NO_SIGNAL]: 'Нет связи',
};

export const STATE_TEXTS = {
  FREE: 'Свободен',
  ON_ORDER: 'С заказом',
  OFFER: 'Предложение',
  NO_SIGNAL: 'Нет связи',
  noSignalFor: (duration: string) => `Нет связи ${duration}`,
} as const;

export const CARD_TEXTS = {
  STATE: 'Состояние',
  ORDER: 'Заказ',
  TO_RECIPIENT: 'До получателя',
  POSITION: 'Позиция',
  CLOSE: UI_TEXTS.CLOSE,
  CALL: 'Позвонить курьеру',
  OPEN_ORDER: 'Открыть заказ',
  courierLabel: (name: string) => `Курьер ${name}`,
  activeOrder: (orderNumber: string, status: string) => `${orderNumber}, ${status}`,
  offerOrder: (orderNumber: string) => `Предложение по заказу ${orderNumber}`,
  eta: (minutes: number) => `≈ ${minutes} мин`,
  ago: (duration: string) => `${duration} назад`,
} as const;

export const DURATION_TEXTS = {
  seconds: (count: number) => `${count} с`,
  minutes: (count: number) => `${count} мин`,
  hours: (count: number) => `${count} ч`,
} as const;

export const LEGEND_TEXTS = {
  FREE: STATE_TEXTS.FREE,
  ON_ORDER: STATE_TEXTS.ON_ORDER,
  NO_SIGNAL: STATE_TEXTS.NO_SIGNAL,
} as const;

export const markerLabel = (name: string, state: string) => `${name}, ${state}`;
