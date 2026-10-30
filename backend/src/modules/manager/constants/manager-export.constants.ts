import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { buildThrottleOverride } from '@/common/utils/throttle';

export const MANAGER_EXPORT_ROUTE = 'export';

export const EXPORT_FORMAT = {
  CSV: 'csv',
  XLSX: 'xlsx',
} as const;

export const EXPORT_FORMAT_VALUES = [EXPORT_FORMAT.CSV, EXPORT_FORMAT.XLSX] as const;

export type ExportFormat = (typeof EXPORT_FORMAT_VALUES)[number];

export const EXPORT_FLAG_VALUES = ['true', 'false'] as const;
export const EXPORT_FLAG_TRUE = 'true';

export const MANAGER_EXPORT_ROW_LIMIT = 5000;

const MANAGER_EXPORT_THROTTLE_LIMIT = 10;

export const MANAGER_EXPORT_THROTTLE = buildThrottleOverride(
  MANAGER_EXPORT_THROTTLE_LIMIT,
  MS_PER_MINUTE,
);

export const EXPORT_TOO_LARGE_CODE = 'EXPORT_TOO_LARGE';

export const MANAGER_EXPORT_MESSAGES = {
  FORMAT_INVALID: 'Укажите формат выгрузки: csv или xlsx',
  WITH_PHONES_INVALID: 'Параметр withPhones принимает только true или false',
  TOO_LARGE: `Выгрузка ограничена ${MANAGER_EXPORT_ROW_LIMIT} строками, сузьте фильтр`,
} as const;

export const EXPORT_CONTENT_TYPE: Record<ExportFormat, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export const EXPORT_FILE_PREFIX = 'swiftdrop-orders';

export const EXPORT_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  CONTENT_DISPOSITION: 'Content-Disposition',
  CACHE_CONTROL: 'Cache-Control',
  CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
} as const;

export const EXPORT_NO_STORE = 'no-store';
export const EXPORT_NOSNIFF = 'nosniff';

const BOM_CODE_POINT = 0xfeff;

export const CSV_BOM = String.fromCodePoint(BOM_CODE_POINT);
export const CSV_SEPARATOR = ';';
export const CSV_LINE_END = '\r\n';
export const CSV_QUOTE = '"';
export const CSV_NEEDS_QUOTES = /[";\r\n]/;
export const FORMULA_START = /^[=+\-@\t\r]/;
export const FORMULA_GUARD = "'";
export const CSV_DECIMAL_SEPARATOR = ',';

export const XLSX_SHEET_NAME = 'Заказы';
export const XLSX_DATE_FORMAT = 'dd.mm.yyyy hh:mm';
export const XLSX_MONEY_FORMAT = '0.00';
export const MONEY_DIGITS = 2;
