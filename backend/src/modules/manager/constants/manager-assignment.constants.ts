export const MANAGER_ASSIGNMENT_ROUTES = {
  CANDIDATES: ':orderId/candidates',
  ASSIGN: ':orderId/assign',
  REASSIGN: ':orderId/reassign',
  RESTART_ASSIGNMENT: ':orderId/restart-assignment',
} as const;

export const SUITABLE_CANDIDATES_LIMIT = 50;
export const UNSUITABLE_CANDIDATES_LIMIT = 20;
export const METERS_PER_KM = 1000;

export const CANDIDATE_SORT = {
  PICKUP_DISTANCE: 'pickupDistance:asc',
  NAME: 'name:asc',
} as const;

export const CANDIDATE_SORT_VALUES = [CANDIDATE_SORT.PICKUP_DISTANCE, CANDIDATE_SORT.NAME] as const;

export type CandidateSort = (typeof CANDIDATE_SORT_VALUES)[number];

export const UNSUITABLE_REASON = {
  OFFLINE: 'offline',
  STALE_LOCATION: 'stale_location',
  BUSY: 'busy',
  VEHICLE_MISMATCH: 'vehicle_mismatch',
  NO_VEHICLE: 'no_vehicle',
} as const;

export type UnsuitableReason = (typeof UNSUITABLE_REASON)[keyof typeof UNSUITABLE_REASON];

export const ORDER_NOT_ASSIGNABLE_CODE = 'ORDER_NOT_ASSIGNABLE';
export const COURIER_NOT_AVAILABLE_CODE = 'COURIER_NOT_AVAILABLE';
export const ORDER_NOT_REASSIGNABLE_CODE = 'ORDER_NOT_REASSIGNABLE';
export const ORDER_NOT_RESTARTABLE_CODE = 'ORDER_NOT_RESTARTABLE';
export const SAME_COURIER_CODE = 'SAME_COURIER';
export const COURIER_CHANGED_CODE = 'COURIER_CHANGED';

export const MANAGER_ASSIGNMENT_MESSAGES = {
  ORDER_NOT_ASSIGNABLE: 'Назначить курьера на заказ в этом статусе нельзя',
  COURIER_NOT_AVAILABLE: 'Курьер сейчас не может взять заказ',
  ORDER_NOT_REASSIGNABLE: 'Сменить курьера можно только до того, как он забрал посылку',
  ORDER_NOT_RESTARTABLE: 'Перезапустить автоназначение для заказа в этом статусе нельзя',
  SAME_COURIER: 'Этот курьер уже назначен на заказ',
  COURIER_CHANGED: 'Курьер заказа уже изменился. Обновите заказ',
  EXPECTED_COURIER_INVALID: 'Укажите текущего курьера заказа: номер или null',
  REASON_INVALID: 'Причина: от 1 до 500 символов',
  COURIER_NOT_FOUND: 'Курьер не найден',
  COURIER_ID_INVALID: 'Некорректный номер курьера',
  SORT_INVALID: 'Сортировка: pickupDistance:asc или name:asc',
  BUSY: 'Заказ или курьер сейчас обновляются. Попробуйте ещё раз',
} as const;
