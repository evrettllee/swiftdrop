import { UI_TEXTS } from '@/shared/config';
import {
  CANDIDATE_SORT,
  type CandidateSort,
  MANAGER_SEARCH_TEXT_MIN_LENGTH,
  ORDER_REFUND,
  type OrderRefund,
  UNSUITABLE_REASON,
  type UnsuitableReason,
} from '@/shared/staff-api';

export const ASSIGN_TEXTS = {
  assignTitle: (orderNumber: string) => `Назначить курьера на заказ ${orderNumber}`,
  reassignTitle: (orderNumber: string) => `Переназначить курьера на заказ ${orderNumber}`,
  ASSIGN_TITLE_SHORT: 'Назначить курьера',
  REASSIGN_TITLE_SHORT: 'Переназначить курьера',
  SEARCH_LABEL: 'Поиск курьера',
  SEARCH_PLACEHOLDER: 'Имя или телефон',
  SEARCH_CLEAR: 'Очистить поиск',
  SEARCH_TOO_SHORT: `Введите не меньше ${MANAGER_SEARCH_TEXT_MIN_LENGTH} символов`,
  SORT_LABEL: 'Сортировка курьеров',
  VEHICLES_LABEL: 'Транспорт',
  ALL: 'Все',
  COURIERS_LABEL: 'Курьер',
  UNSUITABLE: 'Не подходят сейчас',
  unsuitableToggle: (count: number) => `Не подходят сейчас (${count})`,
  suitableFor: (weight: string | null, count: string, couriers: string) =>
    weight === null
      ? `Подходят для посылки: ${count} ${couriers}`
      : `Подходят для посылки ${weight}: ${count} ${couriers}`,
  NOBODY: 'Свободных курьеров рядом нет. Попробуйте позже или запустите автоназначение.',
  NOTHING_FOUND: 'Никого не нашли. Измените поиск или транспорт.',
  OPEN_OFFER: 'есть предложение по другому заказу',
  positionAge: (seconds: number) => `позиция ${seconds} с назад`,
  PICKUP: 'до забора',
  NO_DISTANCE: '–',
  CURRENT: 'Текущий курьер заказа',
  COURIER_GONE: 'Курьер больше недоступен',
  LOAD_FAILED: 'Не удалось загрузить курьеров',
  SUBMIT_ASSIGN: 'Назначить',
  SUBMIT_REASSIGN: 'Переназначить',
  CANCEL: 'Отмена',
  REASON: 'Причина',
  REASON_OPTIONAL_HINT: 'Необязательно. Сохранится в ходе заказа.',
} as const;

export const COURIERS_PLURAL = { one: 'курьер', few: 'курьера', many: 'курьеров' } as const;

export const CANDIDATE_SORT_LABELS: Record<CandidateSort, string> = {
  [CANDIDATE_SORT.PICKUP_DISTANCE]: 'Ближе к забору',
  [CANDIDATE_SORT.NAME]: 'По имени',
};

export const UNSUITABLE_REASON_LABELS: Record<UnsuitableReason, string> = {
  [UNSUITABLE_REASON.OFFLINE]: 'Не на линии',
  [UNSUITABLE_REASON.STALE_LOCATION]: 'Нет связи',
  [UNSUITABLE_REASON.BUSY]: 'Везёт другой заказ',
  [UNSUITABLE_REASON.VEHICLE_MISMATCH]: 'Транспорт не подходит под посылку',
  [UNSUITABLE_REASON.NO_VEHICLE]: 'Нет транспорта',
};

export const REASONS_SEPARATOR = ', ';

export const RESTART_TEXTS = {
  title: (orderNumber: string) => `Запустить автоназначение для заказа ${orderNumber}?`,
  WAITING: 'Заказ снова начнут предлагать курьерам.',
  withCourier: (name: string) =>
    `Курьер ${name} будет снят с заказа, и заказ снова начнут предлагать курьерам.`,
  SUBMIT: 'Запустить автоназначение',
  CANCEL: 'Не запускать',
} as const;

export const CANCEL_TEXTS = {
  title: (orderNumber: string) => `Отменить заказ ${orderNumber}?`,
  REASON_HINT: 'Клиент увидит причину на странице заказа.',
  REASON_REQUIRED: 'Укажите причину отмены',
  refundTitle: (amount: string) => `Клиенту вернётся ${amount}`,
  REFUND_TEXT: 'Возврат через Stripe, на карту клиента деньги придут за 5–10 дней.',
  SUBMIT: 'Отменить заказ',
  KEEP: 'Не отменять',
} as const;

export const counterLabel = (length: number, maxLength: number) => `${length} / ${maxLength}`;

export const DONE_TEXTS = {
  ASSIGNED: 'Курьер назначен',
  REASSIGNED: 'Курьер переназначен',
  RESTARTED: 'Автоназначение запущено',
  orderCourier: (orderNumber: string, name: string) => `Заказ ${orderNumber}: ${name}`,
  restarted: (orderNumber: string) => `Заказ ${orderNumber} снова предлагают курьерам`,
  order: (orderNumber: string) => `Заказ ${orderNumber}`,
} as const;

export const CANCEL_DONE_TITLES: Record<OrderRefund, string> = {
  [ORDER_REFUND.REFUNDED]: 'Заказ отменён, деньги возвращены',
  [ORDER_REFUND.PENDING]: 'Заказ отменён, возврат в обработке',
  [ORDER_REFUND.NONE]: 'Заказ отменён',
};

export const ERROR_TEXTS = {
  STALE_TITLE: 'Заказ уже изменился',
  STALE_TEXT: 'Обновите страницу, чтобы увидеть, что с заказом сейчас.',
  REFRESH: 'Обновить',
  NOT_FOUND_TITLE: 'Заказ или курьер не найден',
  COURIER_UNAVAILABLE_TITLE: 'Курьер не может взять заказ',
  SAME_COURIER_TITLE: 'Этот курьер уже назначен на заказ',
  BUSY_TITLE: 'Заказ или курьер сейчас обновляются',
  BUSY_TEXT: 'Попробуйте ещё раз через несколько секунд.',
  FAILED_TITLE: 'Не удалось выполнить действие',
  FAILED_TEXT: 'Проверьте соединение и попробуйте ещё раз.',
  RETRY: UI_TEXTS.RETRY,
} as const;
