export const FAILURE_MERGE_WINDOW_MIN = 10;

export const FAILURE_LOCK_NAMESPACE = 319_001;

export const SERVICE_FAILURE_LOG_MESSAGES = {
  NOT_RECORDED: 'Service failure not recorded',
} as const;

export const TECHNICAL_CODE_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;

export const STRIPE_ID_PATTERN = /^[a-z]{2,6}_(?:test_|live_)?[A-Za-z0-9]{10,}$/;

export const UNKNOWN_FAILURE_CODE = 'UNKNOWN';

export const TIMEOUT_ERROR_NAME = 'TimeoutError';

export const TIMEOUT_ERROR_CODE = 'ETIMEDOUT';

export const FAILURE_MESSAGES = {
  TIMEOUT: (seconds: number) => `Нет ответа за ${seconds} с`,
  HTTP_STATUS: (status: number) => `HTTP ${status}`,
  NOT_JSON: 'Ответ не в формате JSON',
  BAD_SHAPE: 'Ответ не по схеме',
  NO_ROUTE_DATA: 'В ответе нет маршрута',
  BAD_SIGNATURE: 'Неверная подпись',
  SAVED_RATE: (date: string) => `Курс от ${date}`,
} as const;
